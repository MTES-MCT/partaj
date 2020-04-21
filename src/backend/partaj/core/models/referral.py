"""
Referral and related models in our core app.
"""
import os
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import ugettext_lazy as _

from phonenumber_field.modelfields import PhoneNumberField

from .unit import Topic


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

    RECEIVED, PENDING, COMPLETE, DONE = ("received", "pending", "complete", "done")
    STATUS_CHOICES = (
        (RECEIVED, _("Received — awaiting validation by receiver")),
        (PENDING, _("Incomplete — more information expected from requester")),
        (COMPLETE, _("Complete — referral in treatment")),
        (DONE, _("Done — referral was answered")),
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
    question = models.TextField(
        verbose_name=_("question"),
        help_text=_("Question for which you are requesting the referral"),
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
    status = models.CharField(
        verbose_name=_("referral status"),
        help_text=_("Current treatment status for this referral"),
        max_length=20,
        choices=STATUS_CHOICES,
        default=RECEIVED,
    )

    # Actual content of the referral request
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
    subject = models.CharField(
        verbose_name=_("subject"),
        help_text=_(
            "Broad topic to help direct the referral to the appropriate office"
        ),
        max_length=200,
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
