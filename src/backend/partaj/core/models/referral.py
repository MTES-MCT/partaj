"""
Referral and related models in our core app.
"""
import os
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import ugettext_lazy as _

from django_fsm import FSMField, transition
from phonenumber_field.modelfields import PhoneNumberField

from ..email import Mailer
from .unit import Topic


class ReferralState(models.TextChoices):
    ASSIGNED = "assigned", _("Assigned")
    RECEIVED = "received", _("Received")
    CLOSED = "closed", _("Closed")
    INCOMPLETE = "incomplete", _("Incomplete")
    ANSWERED = "answered", _("Answered")


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
        on_delete=models.SET_NULL,
        related_name="referrals_created",
        blank=True,
        null=True,
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
        blank=True,
        null=True,
    )
    urgency = models.CharField(
        verbose_name=_("urgency"),
        help_text=_("Urgency level. When do you need the referral?"),
        max_length=2,
        choices=URGENCY_CHOICES,
        blank=True,
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
        protected=True,
    )

    # Unit-related information on the referral
    assignees = models.ManyToManyField(
        verbose_name=_("assignees"),
        help_text=_("Partaj users that have been assigned to work on this referral"),
        to=get_user_model(),
        through="ReferralAssignment",
        through_fields=("referral", "assignee"),
        related_name="referrals_assigned",
    )

    # Actual content of the referral request
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

    # DEPRECATED FIELDS
    # To be removed depending on preparedness of the production environment
    requester_email = models.EmailField(
        verbose_name=_("requester email"),
        help_text=_("Email adress for the person requesting the referral"),
        blank=True,
    )
    requester_phone_number = PhoneNumberField(
        verbose_name=_("requester phone number"),
        help_text=_("Phone number for the person requesting the referral"),
        blank=True,
    )

    class Meta:
        db_table = "partaj_referral"
        verbose_name = _("referral")

    def __str__(self):
        """Get the string representation of a referral."""
        return f"{self._meta.verbose_name.title()} #{self.id}"

    def get_human_urgency(self):
        """
        Get a human readable, localized name for this referral's urgency.
        """
        return str(
            dict(self.URGENCY_CHOICES)[self.urgency] if self.urgency else _("3 weeks")
        )

    def get_state_label(self):
        """
        Get the human readable, localized label for the current state of the Referral.
        """
        return ReferralState(self.state).label

    # Add a short description to label the column in the admin site
    get_state_label.short_description = _("state")

    @transition(
        field=state, source=[ReferralState.ASSIGNED], target=ReferralState.ANSWERED
    )
    def answer(self, content, created_by):
        """
        Bring an answer to the referral, marking it as donee.
        """
        ReferralAnswer.objects.create(
            content=content, created_by=created_by, referral=self,
        )

    @transition(
        field=state,
        source=[ReferralState.ASSIGNED, ReferralState.RECEIVED],
        target=ReferralState.ASSIGNED,
    )
    def assign(self, assignee, created_by):
        """
        Assign the referral to one of the unit's members.
        """
        ReferralAssignment.objects.create(
            assignee=assignee,
            created_by=created_by,
            referral=self,
            unit=self.topic.unit,
        )
        # Notify the assignee by sending them an email
        Mailer.send_referral_assigned(
            referral=self, assignee=assignee, assigned_by=created_by,
        )


class ReferralAssignment(models.Model):
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

    # Related objects: what referral are we answering, and who is doing it
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral the answer is linked with"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="answers"
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


def referral_attachment_upload_to(referral_attachment, filename):
    """
    Helper that builds an object storage filename for an uploaded referral attachment.
    """
    _, file_extension = os.path.splitext(filename)
    return f"{referral_attachment.id}/{referral_attachment.name}{file_extension}"


class ReferralAttachment(models.Model):
    """
    Handles one file as an attachment to a Referral. This happens in a separate model to simplify
    file management and more easily link multiple attachments to one Referral.
    """

    # Generic fields to build up minimal data on any referral attachment
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral attachment as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    # The referral to which this attachment belongs
    referral = models.ForeignKey(
        Referral, verbose_name=_("referral"), on_delete=models.CASCADE
    )

    # Actual file field — each attachment handles one file
    file = models.FileField(
        upload_to=referral_attachment_upload_to, verbose_name=_("file")
    )
    name = models.CharField(
        verbose_name=_("name"),
        help_text=_("Name for the referral attachment, defaults to file name"),
        max_length=200,
        blank=True,
    )
    size = models.IntegerField(
        verbose_name=_("file size"),
        help_text=_("Attachment file size in bytes"),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "partaj_referral_attachment"
        verbose_name = _("referral attachment")

    def __str__(self):
        """Get the string representation of a referral attachment."""
        return f"{self._meta.verbose_name.title()} #{self.referral.id} — {self.id}"

    def save(self, *args, **kwargs):
        """
        Override the default save to add automatically generated information & defaults to the
        instance.
        """
        if self._state.adding is True:
            # Add size information when creating the attachment
            self.size = self.file.size
            # We want to use the file name as a default upon creation
            if not self.name:
                file_name, _ = os.path.splitext(self.file.name)
                self.name = file_name
        # Always delegate to the default behavior
        super().save(*args, **kwargs)

    def get_name_with_extension(self):
        """
        Return the name of the attachment, concatenated with the extension.
        """
        _, file_extension = os.path.splitext(self.file.name)
        return f"{self.name}{file_extension}"
