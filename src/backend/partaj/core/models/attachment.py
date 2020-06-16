"""
Attachment models for various objects. Grouped in a common file as they share and abstract
base class.
"""
import os
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


def attachment_upload_to(attachment, filename):
    """
    Helper that builds an object storage filename for an uploaded attachment.
    """
    _, file_extension = os.path.splitext(filename)
    return f"{attachment.id}/{attachment.name}{file_extension}"


class Attachment(models.Model):
    """
    Generic base attachment. We use it to build all our actual attachment classes.
    """

    # Generic fields to build up minimal data on any attachment
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the attachment as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    # Actual file field — each attachment handles one file
    file = models.FileField(upload_to=attachment_upload_to, verbose_name=_("file"))
    name = models.CharField(
        verbose_name=_("name"),
        help_text=_("Name for the attachment, defaults to file name"),
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
        abstract = True

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


class ReferralAttachment(Attachment):
    """
    Handles one file as an attachment to a Referral. Simplify file management and more easily
    link multiple attachments to one Referral.
    """

    # The referral to which this attachment belongs
    referral = models.ForeignKey(
        "Referral",
        verbose_name=_("referral"),
        on_delete=models.CASCADE,
        related_name="attachments",
        related_query_name="attachment",
    )

    class Meta:
        db_table = "partaj_referral_attachment"
        verbose_name = _("referral attachment")

    def __str__(self):
        """
        Get the string representation of a referral attachment.
        """
        return f"{self._meta.verbose_name.title()} #{self.referral.id} — {self.id}"


class ReferralAnswerAttachment(Attachment):
    """
    Handles one file as an attachment to a ReferralAnswer.
    """

    # The referral answer to which this attachment belongs
    referral_answer = models.ForeignKey(
        "ReferralAnswer",
        verbose_name=_("referral answer"),
        on_delete=models.CASCADE,
        related_name="attachments",
        related_query_name="attachment",
    )

    class Meta:
        db_table = "partaj_referral_answer_attachment"
        verbose_name = _("referral answer attachment")

    def __str__(self):
        """
        Get the string representation of a referral answer attachment.
        """
        return f"{self._meta.verbose_name.title()} - {self.id}"
