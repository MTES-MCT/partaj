"""
Referral and related models in our core app.
"""
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_fsm import RETURN_VALUE, FSMField, TransitionNotAllowed, transition

from ..email import Mailer
from .referral_activity import ReferralActivity, ReferralActivityVerb
from .referral_urgencylevel_history import ReferralUrgencyLevelHistory
from .unit import Topic, UnitMembershipRole


class ReferralState(models.TextChoices):
    """
    Enum of all possible values for the state field on referral.
    """

    ANSWERED = "answered", _("Answered")
    ASSIGNED = "assigned", _("Assigned")
    CLOSED = "closed", _("Closed")
    IN_VALIDATION = "in_validation", _("In validation")
    INCOMPLETE = "incomplete", _("Incomplete")
    PROCESSING = "processing", _("Processing")
    RECEIVED = "received", _("Received")


class ReferralUrgency(models.Model):
    """
    Referral urgency model.
    Instances of this model should only be created by administrators.
    """

    duration = models.DurationField(
        verbose_name=_("duration"), help_text=_("Expected treatment duration")
    )
    is_default = models.BooleanField(
        verbose_name=_("is default"),
        help_text=_(
            "Whether this urgency level is the default level for new referrals"
        ),
        default=False,
    )
    name = models.CharField(verbose_name=_("name"), max_length=200)
    requires_justification = models.BooleanField(
        verbose_name=_("requires justification"),
        help_text=_("Whether to require a justification when this urgency is selected"),
    )

    class Meta:
        db_table = "partaj_referral_urgency"
        verbose_name = _("referral urgency")

    def __str__(self):
        """Human representation of a referral urgency."""
        return f"{self._meta.verbose_name.title()}: {self.name}"


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

    # Link the referral with the user who is making it
    # Note: this is optional to support both existing referrals before introduction of this field
    # and deleting users later on while keeping their referrals.
    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("User who created the referral"),
        to=get_user_model(),
        on_delete=models.PROTECT,
        related_name="referrals_created",
    )
    # This field is useful when the actual user above is requesting the referral on behalf of
    # a group of persons or of someone else (eg. for a manager or public official)
    requester = models.CharField(
        verbose_name=_("requester"),
        help_text=_("Identity of the person and service requesting the referral"),
        max_length=500,
    )

    # Referral metadata: helpful to quickly sort through referrals
    topic = models.ForeignKey(
        verbose_name=_("topic"),
        help_text=_(
            "Broad topic to help direct the referral to the appropriate office"
        ),
        to=Topic,
        on_delete=models.PROTECT,
    )
    urgency = models.CharField(
        verbose_name=_("urgency"),
        help_text=_("Urgency level. When do you need the referral?"),
        max_length=2,
        choices=URGENCY_CHOICES,
        blank=True,
    )
    urgency_level = models.ForeignKey(
        verbose_name=_("urgency"),
        help_text=_("Urgency level. When is the referral answer needed?"),
        to=ReferralUrgency,
        on_delete=models.PROTECT,
        related_name="+",
        blank=True,
        null=True,
    )

    urgency_explanation = models.TextField(
        verbose_name=_("urgency explanation"),
        help_text=_("Why is this referral urgent?"),
        blank=True,
    )

    state = FSMField(
        verbose_name=_("referral state"),
        help_text=_("Current treatment status for this referral"),
        default=ReferralState.RECEIVED,
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
    )
    assignees = models.ManyToManyField(
        verbose_name=_("assignees"),
        help_text=_("Partaj users that have been assigned to work on this referral"),
        to=get_user_model(),
        through="ReferralAssignment",
        through_fields=("referral", "assignee"),
        related_name="referrals_assigned",
    )

    # Actual content of the referral request
    object = models.CharField(
        verbose_name=_("object"),
        help_text=_("Brief sentence describing the object of the referral"),
        max_length=50,
        blank=True,
    )
    question = models.TextField(
        verbose_name=_("question"),
        help_text=_("Question for which you are requesting the referral"),
    )
    context = models.TextField(
        verbose_name=_("context"),
        help_text=_("Explain the facts and context leading to the referral"),
    )
    prior_work = models.TextField(
        verbose_name=_("prior work"),
        help_text=_("What research did you already perform before the referral?"),
    )

    class Meta:
        db_table = "partaj_referral"
        verbose_name = _("referral")

    def __str__(self):
        """Get the string representation of a referral."""
        return f"{self._meta.verbose_name.title()} #{self.id}"

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
            ReferralState.INCOMPLETE: "red",
            ReferralState.RECEIVED: "blue",
        }

        return state_colors[self.state]

    def get_due_date(self):
        """
        Use the linked ReferralUrgency to calculate the expected answer date from the day the
        referral was created.
        """
        return self.created_at + self.urgency_level.duration

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
        ReferralActivity.objects.create(
            actor=created_by,
            verb=ReferralActivityVerb.ASSIGNED,
            referral=self,
            item_content_object=assignee,
        )
        # Notify the assignee by sending them an email
        Mailer.send_referral_assigned(
            referral=self,
            assignment=assignment,
            assigned_by=created_by,
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
    def assign_unit(self, unit, created_by):
        """
        Add a unit assignment to the referral.
        """
        assignment = ReferralUnitAssignment.objects.create(
            referral=self,
            unit=unit,
        )
        ReferralActivity.objects.create(
            actor=created_by,
            verb=ReferralActivityVerb.ASSIGNED_UNIT,
            referral=self,
            item_content_object=unit,
        )
        Mailer.send_referral_assigned_unit(
            referral=self, assignment=assignment, assigned_by=created_by
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
        source=ReferralState.IN_VALIDATION,
        target=ReferralState.IN_VALIDATION,
    )
    def perform_answer_validation(self, validation_request, state, comment):
        """
        Provide a response to the validation request, setting the state according to
        the validator's choice and registering their comment.
        """
        ReferralAnswerValidationResponse.objects.create(
            validation_request=validation_request,
            state=state,
            comment=comment,
        )
        verb = (
            ReferralActivityVerb.VALIDATED
            if state == ReferralAnswerValidationResponseState.VALIDATED
            else ReferralActivityVerb.VALIDATION_DENIED
        )
        ReferralActivity.objects.create(
            actor=validation_request.validator,
            verb=verb,
            referral=self,
            item_content_object=validation_request,
        )

        # Notify all the assignees of the validation response with different emails
        # depending on the response state
        assignees = [
            assignment.assignee
            for assignment in ReferralAssignment.objects.filter(referral=self)
        ]
        Mailer.send_validation_performed(
            validation_request=validation_request,
            assignees=assignees,
            is_validated=state == ReferralAnswerValidationResponseState.VALIDATED,
        )

    @transition(
        field=state,
        source=[
            ReferralState.IN_VALIDATION,
            ReferralState.PROCESSING,
        ],
        target=ReferralState.ANSWERED,
    )
    def publish_answer(self, answer, published_by):
        """
        Mark the referral as done by picking and publishing an answer.
        """
        published_answer = ReferralAnswer.objects.create(
            content=answer.content,
            created_by=answer.created_by,
            referral=self,
            state=ReferralAnswerState.PUBLISHED,
        )
        answer.published_answer = published_answer
        answer.save()
        ReferralActivity.objects.create(
            actor=published_by,
            verb=ReferralActivityVerb.ANSWERED,
            referral=self,
            item_content_object=published_answer,
        )
        # Notify the requester by sending them an email
        Mailer.send_referral_answered(
            answer=answer,
            referral=self,
        )

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
        request object and an activity, and send the email to the validator.
        """
        validation_request = ReferralAnswerValidationRequest.objects.create(
            validator=validator,
            answer=answer,
        )
        activity = ReferralActivity.objects.create(
            actor=requested_by,
            verb=ReferralActivityVerb.VALIDATION_REQUESTED,
            referral=self,
            item_content_object=validation_request,
        )
        Mailer.send_validation_requested(
            validation_request=validation_request,
            activity=activity,
        )

    @transition(
        field=state,
        source=[ReferralState.RECEIVED],
        target=ReferralState.RECEIVED,
    )
    def send(self):
        """
        Send relevant emails for the newly send referral and create the corresponding activity.
        """
        ReferralActivity.objects.create(
            actor=self.user,
            verb=ReferralActivityVerb.CREATED,
            referral=self,
        )
        # Confirm the referral has been sent to the requester by email
        Mailer.send_referral_saved(self)
        # Send this email to all owners of the unit(s) (admins are not supposed to receive
        # email notifications)
        for unit in self.units.all():
            contacts = unit.members.filter(
                unitmembership__role=UnitMembershipRole.OWNER
            )
            for contact in contacts:
                Mailer.send_referral_received(self, contact=contact, unit=unit)

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
        ReferralActivity.objects.create(
            actor=created_by,
            verb=ReferralActivityVerb.UNASSIGNED,
            referral=self,
            item_content_object=assignee,
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
        ReferralActivity.objects.create(
            actor=created_by,
            verb=ReferralActivityVerb.UNASSIGNED_UNIT,
            referral=self,
            item_content_object=unit,
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

        ReferralActivity.objects.create(
            actor=created_by,
            verb=ReferralActivityVerb.URGENCYLEVEL_CHANGED,
            referral=self,
            item_content_object=referral_urgencylevel_history,
        )

        return self.state

    @transition(
        field=state,
        source=[ReferralState.RECEIVED, ReferralState.ASSIGNED],
        target=ReferralState.CLOSED,
    )
    def close_referral(self, close_explanation, created_by):
        """
        Close the referral and create the relevant activity.
        """

        ReferralActivity.objects.create(
            actor=self.user,
            verb=ReferralActivityVerb.CLOSED,
            referral=self,
            message=close_explanation,
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


class ReferralAnswerState(models.TextChoices):
    """
    Enum of possible values for the state field of the referral answer state.
    """

    DRAFT = "draft", _("draft")
    PUBLISHED = "published", _("published")


class ReferralAnswer(models.Model):
    """
    An answer created by the relevant unit for a given Referral.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)

    # Publication state & instance links for answers
    state = models.CharField(
        verbose_name=_("state"),
        help_text=_("State of this referral answer"),
        max_length=50,
        choices=ReferralAnswerState.choices,
        # Note: PUBLISHED is used as a default to facilitate migration, as all existing answers
        # were published, there were no drafts.
        default=ReferralAnswerState.PUBLISHED,
    )
    published_answer = models.OneToOneField(
        verbose_name=_("published answer"),
        help_text=_(
            "published answer corresponding to this one, if it is a draft answer"
        ),
        to="self",
        on_delete=models.CASCADE,
        related_name="draft_answer",
        blank=True,
        null=True,
    )

    # Related objects: what referral are we answering, and who is doing it
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral the answer is linked with"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="answers",
    )
    created_by = models.ForeignKey(
        verbose_name=_("created by"),
        help_text=_("User who created the answer"),
        to=get_user_model(),
        on_delete=models.SET_NULL,
        related_name="+",
        blank=True,
        null=True,
    )

    # The actual answer, starting with a simple text field
    content = models.TextField(
        verbose_name=_("content"),
        help_text=_("Actual content of the answer to the referral"),
    )

    class Meta:
        db_table = "partaj_referral_answer"
        verbose_name = _("referral answer")

    def __str__(self):
        """Get the string representation of a referral answer."""
        return (
            f"{self._meta.verbose_name.title()} #{self.referral.id} — answer {self.id}"
        )


class ReferralAnswerValidationRequest(models.Model):
    """
    A validation request exists to link together an answer and a user who was asked to validate it.
    It does not hold a date (like a `created_at`) to avoid duplication & confusion with the related
    activity.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer validation request as uuid"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    validator = models.ForeignKey(
        verbose_name=_("validator"),
        help_text=_("User who was asked to validate the related answer"),
        to=get_user_model(),
        on_delete=models.CASCADE,
        related_name="referral_answer_validation_requests",
        related_query_name="referral_answer_validation_request",
    )
    answer = models.ForeignKey(
        verbose_name=_("answer"),
        help_text=_("Answer the related user was asked to validate"),
        to=ReferralAnswer,
        on_delete=models.CASCADE,
        related_name="validation_requests",
        related_query_name="validation_request",
    )

    class Meta:
        db_table = "partaj_referral_answer_validation_request"
        unique_together = [["answer", "validator"]]
        verbose_name = _("referral answer validation request")


class ReferralAnswerValidationResponseState(models.TextChoices):
    """
    Enum of possible states for a referral answer validation response state field.
    """

    NOT_VALIDATED = "not_validated", _("not validated")
    PENDING = "pending", _("pending")
    VALIDATED = "validated", _("validated")


class ReferralAnswerValidationResponse(models.Model):
    """
    A validation response is used to keep more information about the validation beyond the request:
    it holds a state (was the validation given or not), and a comment that can give some context
    to the the validation requester.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer validation response as uuid"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    validation_request = models.OneToOneField(
        verbose_name=_("validation request"),
        help_text=_(
            "Validation request for which this response is providing an answer"
        ),
        to=ReferralAnswerValidationRequest,
        on_delete=models.CASCADE,
        related_name="response",
    )
    state = models.CharField(
        verbose_name=_("state"),
        help_text=_("State of the validation"),
        max_length=20,
        choices=ReferralAnswerValidationResponseState.choices,
    )
    comment = models.TextField(
        verbose_name=_("comment"),
        help_text=_("Comment associated with the validation acceptance or refusal"),
    )

    class Meta:
        db_table = "partaj_referral_answer_validation_response"
        verbose_name = _("referral answer validation response")
