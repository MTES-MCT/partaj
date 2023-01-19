# pylint: disable=C0302
# Too many lines in module
"""
Referral and related models in our core app.
"""
import copy

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_fsm import RETURN_VALUE, FSMField, TransitionNotAllowed, transition

from .. import signals
from . import Notification
from .referral_activity import ReferralActivity, ReferralActivityVerb
from .referral_answer import (
    ReferralAnswer,
    ReferralAnswerState,
    ReferralAnswerValidationRequest,
    ReferralAnswerValidationResponse,
)
from .referral_report import ReferralReport
from .referral_urgencylevel_history import ReferralUrgencyLevelHistory
from .referral_userlink import (
    ReferralUserLink,
    ReferralUserLinkNotificationsTypes,
    ReferralUserLinkRoles,
)
from .unit import Topic


class ReferralState(models.TextChoices):
    """
    Enum of all possible values for the state field on referral.
    """

    ANSWERED = "answered", _("Answered")
    ASSIGNED = "assigned", _("Assigned")
    CLOSED = "closed", _("Closed")
    IN_VALIDATION = "in_validation", _("In validation")
    INCOMPLETE = "incomplete", _("Incomplete")
    DRAFT = "draft", _("Draft")
    PROCESSING = "processing", _("Processing")
    RECEIVED = "received", _("Received")


class ReferralAnswerTypeChoice(models.TextChoices):
    """
    Enum of all possible values for the referral answer type
    """

    ATTACHMENT = "attachment", _("Attachment")
    EDITOR = "editor", _("Editor")
    NONE = "closed", _("None")


# pylint: disable=R0904
# Too many public methods
class Referral(models.Model):
    """
    Our main model. Here we modelize what a Referral is in the first place and provide other
    models it can depend on (eg users or attachments).
    """

    URGENCY_1, URGENCY_2, URGENCY_3 = "u1", "u2", "u3"
    URGENCY_CHOICES = (
        (URGENCY_1, _("Urgent — 1 week")),
        (URGENCY_2, _("Extremely urgent — 3 days")),
        (URGENCY_3, _("Absolute emergency — 24 hours")),
    )

    # Generic fields to build up minimal data on any referral
    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral"),
        primary_key=True,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)
    sent_at = models.DateTimeField(
        verbose_name=_("sent at"),
        blank=True,
        null=True,
    )

    # Link the referral with the user who is making it
    # Note: this is optional to support both existing referrals before introduction of this field
    # and deleting users later on while keeping their referrals.
    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("User who created the referral"),
        to=get_user_model(),
        on_delete=models.PROTECT,
        related_name="referrals_created",
        blank=True,
        null=True,
    )
    # Link the referral with the users who are identified as the requesters
    users = models.ManyToManyField(
        verbose_name=_("users"),
        help_text=_("Users who are registered as requesters for this referral"),
        to=get_user_model(),
        through="ReferralUserLink",
        through_fields=("referral", "user"),
        related_name="referrals_requested",
        blank=True,
        null=True,
    )

    # Referral metadata: helpful to quickly sort through referrals
    topic = models.ForeignKey(
        verbose_name=_("topic"),
        help_text=_(
            "Broad topic to help direct the referral to the appropriate office"
        ),
        to=Topic,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    urgency = models.CharField(
        verbose_name=_("urgency"),
        help_text=_("Urgency level. When do you need the referral?"),
        max_length=2,
        choices=URGENCY_CHOICES,
        blank=True,
        null=True,
    )
    urgency_level = models.ForeignKey(
        verbose_name=_("urgency"),
        help_text=_("Urgency level. When is the referral answer needed?"),
        to="ReferralUrgency",
        on_delete=models.PROTECT,
        related_name="+",
        blank=True,
        null=True,
    )

    urgency_explanation = models.TextField(
        verbose_name=_("urgency explanation"),
        help_text=_("Why is this referral urgent?"),
        blank=True,
        null=True,
    )

    state = FSMField(
        verbose_name=_("referral state"),
        help_text=_("Current treatment status for this referral"),
        default=ReferralState.DRAFT,
        choices=ReferralState.choices,
    )

    # Unit-related information on the referral
    units = models.ManyToManyField(
        verbose_name=_("units"),
        help_text=_("Partaj units that have been assigned to this referral"),
        to="Unit",
        through="ReferralUnitAssignment",
        through_fields=("referral", "unit"),
        related_name="referrals_assigned",
        blank=True,
        null=True,
    )
    assignees = models.ManyToManyField(
        verbose_name=_("assignees"),
        help_text=_("Partaj users that have been assigned to work on this referral"),
        to=get_user_model(),
        through="ReferralAssignment",
        through_fields=("referral", "assignee"),
        related_name="referrals_assigned",
        blank=True,
        null=True,
    )

    # Actual content of the referral request
    object = models.CharField(
        verbose_name=_("object"),
        help_text=_("Brief sentence describing the object of the referral"),
        max_length=60,
        blank=True,
        null=True,
    )
    question = models.TextField(
        verbose_name=_("question"),
        help_text=_("Question for which you are requesting the referral"),
        blank=True,
        null=True,
    )
    context = models.TextField(
        verbose_name=_("context"),
        help_text=_("Explain the facts and context leading to the referral"),
        blank=True,
        null=True,
    )
    prior_work = models.TextField(
        verbose_name=_("prior work"),
        help_text=_("What research did you already perform before the referral?"),
        blank=True,
        null=True,
    )
    report = models.OneToOneField(
        ReferralReport,
        verbose_name=_("report"),
        help_text=_("The referral unit report"),
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    answer_type = FSMField(
        verbose_name=_("referral answer type"),
        help_text=_("referral answer type"),
        default=ReferralAnswerTypeChoice.NONE,
        choices=ReferralAnswerTypeChoice.choices,
    )

    notifications = GenericRelation(
        Notification,
        content_type_field="item_content_type",
        object_id_field="item_object_id",
    )

    class Meta:
        db_table = "partaj_referral"
        verbose_name = _("referral")

    def __str__(self):
        """Get the string representation of a referral."""
        return f"{self._meta.verbose_name.title()} #{self.id}"

    def save(self, *args, **kwargs):
        """
        Override the default save method to update the Elasticsearch entry for the
        referral whenever it is updated.
        """
        super().save(*args, **kwargs)
        # There is a necessary circular dependency between the referral indexer and
        # the referral model (and models in general)
        # We handled it by importing the indexer only at the point we need it here.
        # pylint: disable=import-outside-toplevel
        from ..indexers import ReferralsIndexer

        ReferralsIndexer.update_referral_document(self)

    def delete(self, *args, **kwargs):
        """
        Override the default delete method to delete the Elasticsearch entry whenever it is deleted.
        """

        cloned_referral = copy.deepcopy(self)

        super().delete(*args, **kwargs)

        # pylint: disable=import-outside-toplevel
        from ..indexers import ReferralsIndexer

        ReferralsIndexer.delete_referral_document(cloned_referral)

    def get_human_state(self):
        """
        Get the human readable, localized label for the current state of the Referral.
        """
        return ReferralState(self.state).label

    # Add a short description to label the column in the admin site
    get_human_state.short_description = _("state")

    def get_state_class(self):
        """
        Get the correspond class for state colors.
        """
        state_colors = {
            ReferralState.ANSWERED: "green",
            ReferralState.ASSIGNED: "teal",
            ReferralState.CLOSED: "darkgray",
            ReferralState.DRAFT: "red",
            ReferralState.RECEIVED: "blue",
        }

        return state_colors[self.state]

    def get_due_date(self):
        """
        Use the linked ReferralUrgency to calculate the expected answer date from the day the
        referral was created.
        """
        if self.urgency_level and self.sent_at:
            return self.sent_at + self.urgency_level.duration

        return None

    def get_users_text_list(self):
        """
        Return a comma-separated list of all users linked to the referral.
        """
        return ", ".join([user.get_full_name() for user in self.users.all()])

    def get_referraluserlinks(self):
        """
        Get referraluserlink i.e. requesters and observers of the referral
        """
        return ReferralUserLink.objects.filter(referral=self)

    def get_observers(self):
        """
        Check if the user is an observer
        """
        return [
            referral_userlink.user
            for referral_userlink in ReferralUserLink.objects.filter(
                referral=self, role=ReferralUserLinkRoles.OBSERVER
            ).all()
        ]

    def get_requesters(self):
        """
        Get all referral requesters
        """
        return [
            referral_userlink.user
            for referral_userlink in ReferralUserLink.objects.filter(
                referral=self, role=ReferralUserLinkRoles.REQUESTER
            ).all()
        ]

    def is_user_from_unit_referral_requesters(self, user):
        """
        Check if the user is from a requester unit
        """
        if not hasattr(user, "unit_name"):
            return False
        user_unit_name = user.unit_name
        user_unit_name_length = len(user_unit_name)

        requester_unit_names = [
            requester.unit_name
            for requester in self.users.filter(
                referraluserlink__role=ReferralUserLinkRoles.REQUESTER
            ).all()
        ]

        for requester_unit_name in requester_unit_names:
            if user_unit_name in requester_unit_name[0 : user_unit_name_length + 1]:
                return True
        return False

    def is_observer(self, user):
        """
        Check if the user is observer for this referral
        """
        return user in self.get_observers()

    @transition(
        field=state,
        source=[
            ReferralState.DRAFT,
            ReferralState.ANSWERED,
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ],
        target=RETURN_VALUE(
            ReferralState.DRAFT,
            ReferralState.ANSWERED,
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ),
    )
    def add_requester(
        self,
        requester,
        created_by,
        notifications=ReferralUserLinkNotificationsTypes.ALL,
    ):
        """
        Add a new user to the list of requesters for a referral.
        """
        ReferralUserLink.objects.create(
            referral=self, user=requester, notifications=notifications
        )

        signals.requester_added.send(
            sender="models.referral.add_requester",
            referral=self,
            requester=requester,
            created_by=created_by,
        )

        return self.state

    def add_observer(self, observer, created_by):
        """
        Add a new user to the list of observers for a referral.
        """
        ReferralUserLink.objects.create(
            referral=self,
            user=observer,
            role=ReferralUserLinkRoles.OBSERVER,
            notifications=ReferralUserLinkNotificationsTypes.RESTRICTED,
        )

        signals.observer_added.send(
            sender="models.referral.add_observer",
            referral=self,
            observer=observer,
            created_by=created_by,
        )

    def add_user_by_role(self, user, created_by, role):
        """
        Add user as a referral requester or observer depending on
        """
        if role == ReferralUserLinkRoles.REQUESTER:
            self.add_requester(user, created_by)
        elif role == ReferralUserLinkRoles.OBSERVER:
            self.add_observer(user, created_by)
        else:
            raise Exception(f"Role type {role} is not allowed")

    @transition(
        field=state,
        source=[
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ],
        target=RETURN_VALUE(
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
        ),
    )
    def assign(self, assignee, created_by, unit):
        """
        Assign the referral to one of the unit's members.
        """
        assignment = ReferralAssignment.objects.create(
            assignee=assignee,
            created_by=created_by,
            referral=self,
            unit=unit,
        )

        signals.unit_member_assigned.send(
            sender="models.referral.assign",
            referral=self,
            assignee=assignee,
            assignment=assignment,
            created_by=created_by,
        )

        if self.state in [ReferralState.IN_VALIDATION, ReferralState.PROCESSING]:
            return self.state

        return ReferralState.ASSIGNED

    @transition(
        field=state,
        source=[
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ],
        target=RETURN_VALUE(
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ),
    )
    def assign_unit(
        self,
        unit,
        created_by,
        assignunit_explanation,
    ):
        """
        Add a unit assignment to the referral.
        """
        assignment = ReferralUnitAssignment.objects.create(
            referral=self,
            unit=unit,
        )
        signals.unit_assigned.send(
            sender="models.referral.assign_unit",
            referral=self,
            assignment=assignment,
            created_by=created_by,
            unit=unit,
            assignunit_explanation=assignunit_explanation,
        )

        return self.state

    @transition(
        field=state,
        source=[
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ],
        target=RETURN_VALUE(
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
        ),
    )
    def draft_answer(self, answer):
        """
        Create a draft answer to the Referral. If there is no current assignee, we'll auto-assign
        the person who created the draft.
        TODO: Remove after once referral_v2
        """
        # If the referral is not already assigned, self-assign it to the user who created
        # the answer
        if not ReferralAssignment.objects.filter(referral=self).exists():
            # Get the first unit from referral linked units the user is a part of.
            # Having a user in two different units both assigned on the same referral is a very
            # specific edge case and picking between those is not an important distinction.
            unit = answer.referral.units.filter(
                members__id=answer.created_by.id
            ).first()
            ReferralAssignment.objects.create(
                assignee=answer.created_by,
                created_by=answer.created_by,
                referral=self,
                unit=unit,
            )
            ReferralActivity.objects.create(
                actor=answer.created_by,
                verb=ReferralActivityVerb.ASSIGNED,
                referral=self,
                item_content_object=answer.created_by,
            )

        # Create the activity. Everything else was handled upstream where the ReferralAnswer
        # instance was created
        ReferralActivity.objects.create(
            actor=answer.created_by,
            verb=ReferralActivityVerb.DRAFT_ANSWERED,
            referral=self,
            item_content_object=answer,
        )

        if self.state in [ReferralState.IN_VALIDATION, ReferralState.PROCESSING]:
            return self.state

        return ReferralState.PROCESSING

    @transition(
        field=state,
        source=[
            ReferralState.RECEIVED,
            ReferralState.PROCESSING,
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
        ],
        target=RETURN_VALUE(
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ),
    )
    def add_version(self, version):
        """
        Send signal and return the state
        """
        signals.version_added.send(
            sender="models.referral.assign",
            referral=self,
            version=version,
        )

        if self.state in [ReferralState.IN_VALIDATION]:
            return self.state

        return ReferralState.PROCESSING

    @transition(
        field=state,
        source=ReferralState.IN_VALIDATION,
        target=ReferralState.IN_VALIDATION,
    )
    def perform_answer_validation(self, validation_request, state, comment):
        """
        Provide a response to the validation request, setting the state according to
        the validator's choice and registering their comment.
        TODO: Remove after once referral_v2
        """
        ReferralAnswerValidationResponse.objects.create(
            validation_request=validation_request,
            state=state,
            comment=comment,
        )

        signals.answer_validation_performed.send(
            sender="models.referral.perform_answer_validation",
            referral=self,
            validation_request=validation_request,
            state=state,
        )

    @transition(
        field=state,
        source=[
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
        ],
        target=ReferralState.ANSWERED,
    )
    # pylint: disable=broad-except
    def publish_answer(self, answer, published_by):
        """
        Mark the referral as done by picking and publishing an answer.
        """
        # Create the published answer to our draft and attach all the relevant attachments
        published_answer = ReferralAnswer.objects.create(
            content=answer.content,
            created_by=answer.created_by,
            referral=self,
            state=ReferralAnswerState.PUBLISHED,
        )

        for attachment in answer.attachments.all():
            attachment.referral_answers.add(published_answer)
            attachment.save()
        # Update the draft answer with a reference to its published version
        answer.published_answer = published_answer
        answer.save()

        signals.answer_published.send(
            sender="models.referral.publish_answer",
            referral=self,
            published_answer=published_answer,
            published_by=published_by,
        )

    @transition(
        field=state,
        source=[
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
        ],
        target=ReferralState.ANSWERED,
    )
    # pylint: disable=broad-except
    def publish_report(self, version, published_by):
        """
        Send signal and just update state to ANSWERED
        """
        signals.report_published.send(
            sender="models.referral.publish_report",
            referral=self,
            version=version,
            published_by=published_by,
        )

        return ReferralState.ANSWERED

    @transition(
        field=state,
        source=[
            ReferralState.DRAFT,
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ],
        target=RETURN_VALUE(
            ReferralState.DRAFT,
            ReferralState.ASSIGNED,
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
            ReferralState.RECEIVED,
        ),
    )
    def remove_requester(self, referral_user_link, created_by):
        """
        Remove a user from the list of requesters for a referral.
        """
        requester = referral_user_link.user
        referral_user_link.delete()
        signals.requester_deleted.send(
            sender="models.referral.remove_requester",
            referral=self,
            requester=requester,
            created_by=created_by,
        )

        return self.state

    @transition(
        field=state,
        source=[
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
        ],
        target=ReferralState.IN_VALIDATION,
    )
    def request_answer_validation(self, answer, requested_by, validator):
        """
        Request a validation for an existing answer. Represent the request through a validation
        request object.
        """
        validation_request = ReferralAnswerValidationRequest.objects.create(
            validator=validator,
            answer=answer,
        )

        signals.answer_validation_requested.send(
            sender="models.referral.request_answer_validation",
            referral=self,
            requester=requested_by,
            validation_request=validation_request,
        )

    @transition(
        field=state,
        source=[ReferralState.DRAFT],
        target=ReferralState.RECEIVED,
    )
    def send(self, created_by):
        """
        Send relevant emails for the newly sent referral and create the corresponding activity.
        """
        signals.referral_sent.send(
            sender="models.referral.send",
            referral=self,
            created_by=created_by,
        )

    @transition(
        field=state,
        source=[
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ],
        target=RETURN_VALUE(
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ),
    )
    def unassign(self, assignment, created_by):
        """
        Unassign the referral from a currently assigned member.
        """
        assignee = assignment.assignee
        assignment.delete()
        self.refresh_from_db()

        signals.unit_member_unassigned.send(
            sender="models.referral.unassign",
            referral=self,
            assignee=assignee,
            created_by=created_by,
        )

        # Check the number of remaining assignments on this referral to determine the next state
        assignment_count = ReferralAssignment.objects.filter(referral=self).count()

        if self.state == ReferralState.ASSIGNED and assignment_count == 0:
            return ReferralState.RECEIVED

        return self.state

    @transition(
        field=state,
        source=[
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ],
        target=RETURN_VALUE(
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ),
    )
    def unassign_unit(self, assignment, created_by):
        """
        Remove a unit assignment from the referral.
        """
        unit = assignment.unit

        if self.units.count() <= 1:
            raise TransitionNotAllowed()

        if self.assignees.filter(unitmembership__unit=unit):
            raise TransitionNotAllowed()

        assignment.delete()
        self.refresh_from_db()

        signals.unit_unassigned.send(
            sender="models.referral.unassign_unit",
            referral=self,
            created_by=created_by,
            unit=unit,
        )

        return self.state

    @transition(
        field=state,
        source=[
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ],
        target=RETURN_VALUE(
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ),
    )
    def ask_for_validation(self):
        """
        Change referral state to IN_VALIDATION due to granted user
        notified into the report conversation
        But let it unchanged if no report version exists yet
        """
        if not self.report or not len(self.report.versions.all()) > 0:
            return self.state

        return ReferralState.IN_VALIDATION

    @transition(
        field=state,
        source=[
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ],
        target=RETURN_VALUE(
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ),
    )
    def change_urgencylevel(
        self, new_urgency_level, new_referralurgency_explanation, created_by
    ):
        """
        Perform the urgency level change, keeping a history object to
        show the relevant information on the referral activity.
        """
        old_urgency_level = self.urgency_level
        self.urgency_level = new_urgency_level

        referral_urgencylevel_history = ReferralUrgencyLevelHistory.objects.create(
            referral=self,
            old_referral_urgency=old_urgency_level,
            new_referral_urgency=new_urgency_level,
            explanation=new_referralurgency_explanation,
        )

        signals.urgency_level_changed.send(
            sender="models.referral.change_urgencylevel",
            referral=self,
            created_by=created_by,
            referral_urgencylevel_history=referral_urgencylevel_history,
        )

        return self.state

    @transition(
        field=state,
        source=[
            ReferralState.RECEIVED,
            ReferralState.ASSIGNED,
            ReferralState.PROCESSING,
            ReferralState.IN_VALIDATION,
        ],
        target=ReferralState.CLOSED,
    )
    def close_referral(self, close_explanation, created_by):
        """
        Close the referral and create the relevant activity.
        """
        signals.referral_closed.send(
            sender="models.referral.close_referral",
            referral=self,
            created_by=created_by,
            close_explanation=close_explanation,
        )


class ReferralUnitAssignment(models.Model):
    """
    Through class to link referrals and units. Using a ManyToMany to associate those models
    directly brings us more flexibility in the way we manage those relationships over time.
    """

    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the unit assignment"),
        primary_key=True,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    unit = models.ForeignKey(
        verbose_name=_("unit"),
        help_text=_("Unit who is attached to the referral"),
        to="Unit",
        on_delete=models.CASCADE,
    )
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral the unit is attached to"),
        to="Referral",
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "partaj_referralunitassignment"
        unique_together = [["unit", "referral"]]
        verbose_name = _("referral unit assignment")


class ReferralAssignment(models.Model):
    """
    Through model to link a referral with a user assigned to work on it and keep
    some metadata about that relation.
    """

    # Generic fields to build up minimal data on any assignment
    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the assignment"),
        primary_key=True,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    # Point to each of the two models we're associating
    assignee = models.ForeignKey(
        verbose_name=_("assignee"),
        help_text=_("User is assigned to work on the referral"),
        to=get_user_model(),
        on_delete=models.CASCADE,
    )
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral the assignee is linked with"),
        to="Referral",
        on_delete=models.CASCADE,
    )

    # We need to keep some key information about the assignment, such as thee person who
    # created it and the unit as part of which it was created
    created_by = models.ForeignKey(
        verbose_name=_("created by"),
        help_text=_("User who created the assignment"),
        to=get_user_model(),
        on_delete=models.SET_NULL,
        related_name="+",
        blank=True,
        null=True,
    )
    unit = models.ForeignKey(
        verbose_name=_("unit"),
        help_text=_("Unit under which the assignment was created"),
        to="Unit",
        on_delete=models.SET_NULL,
        related_name="+",
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "partaj_referralassignment"
        unique_together = [["assignee", "referral"]]
        verbose_name = _("referral assignment")
