"""
Attachment models for various objects. Grouped in a common file as they share and abstract
base class.
"""
import os
import uuid

from django.db import models
from django.db.models import TextChoices
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

    def update_file(self, *args, file=None, **kwargs):
        """
        Update attachment instance.
        """
        self.file.delete()
        self.file = file
        # Add size information when updating the attachment
        self.size = self.file.size
        # Update the file name
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

    def get_extension(self):
        """
        Return file extension.
        """
        _, file_extension = os.path.splitext(self.file.name)
        return f"{file_extension}"


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
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} - {self.id}"


class ReferralAnswerAttachment(Attachment):
    """
    Handles one file as an attachment to a ReferralAnswer.
    """

    # The referral answers which have a relation to this attachment
    # There may be more than one because of answer revisions and/or published answers
    referral_answers = models.ManyToManyField(
        "ReferralAnswer",
        verbose_name=_("referral answers"),
        related_name="attachments",
        related_query_name="attachments",
    )

    class Meta:
        db_table = "partaj_referral_answer_attachment"
        verbose_name = _("referral answer attachment")

    def __str__(self):
        """
        Get the string representation of a referral answer attachment.
        """
        return f"{self._meta.verbose_name.title()} - {self.id}"


class ReferralMessageAttachment(Attachment):
    """
    Handles one file as an attachment to a ReferralMessage.
    """

    # The referral message to which this attachment belongs
    referral_message = models.ForeignKey(
        "ReferralMessage",
        verbose_name=_("referral message"),
        on_delete=models.CASCADE,
        related_name="attachments",
        related_query_name="attachment",
    )

    class Meta:
        db_table = "partaj_referral_message_attachment"
        verbose_name = _("referral message attachment")

    def __str__(self):
        """
        Get the string representation of a referral message attachment.
        """
        return f"{self._meta.verbose_name.title()} - {self.id}"


class VersionDocument(Attachment):
    """
    Handles one file as a main document to a ReferralReportVersion.
    """

    class Meta:
        db_table = "partaj_referral_version_document"
        verbose_name = _("referral version document")

    def __str__(self):
        """
        Get the string representation of a referral version document.
        """
        return f"{self._meta.verbose_name.title()} - {self.id}"


class SupportedExtensionTypes(TextChoices):
    """
    Enum of possible extensions handled by Archivaj.
    """

    PDF = ".pdf"
    DOCX = ".docx"


class NoteDocument(Attachment):
    """
    Handles one file as a main document to a ReferralNote.
    """

    class Meta:
        db_table = "partaj_referral_note_document"
        verbose_name = _("referral note document")

    def __str__(self):
        """
        Get the string representation of a referral version document.
        """
        return f"{self._meta.verbose_name.title()} - {self.id}"


class ReferralReportAttachment(Attachment):
    """
    Handles attachment files for ReferralReport.
    """

    # The referral message to which this attachment belongs
    report = models.ForeignKey(
        "ReferralReport",
        verbose_name=_("referral report attachments"),
        on_delete=models.CASCADE,
        related_name="attachments",
        related_query_name="attachments",
    )

    class Meta:
        db_table = "partaj_referral_report_attachment"
        verbose_name = _("referral report attachment")

    def __str__(self):
        """
        Get the string representation of a referral report attachment.
        """
        return f"{self._meta.verbose_name.title()} - {self.id}"
