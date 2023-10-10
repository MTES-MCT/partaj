# pylint: disable=too-many-instance-attributes
"""
Referral report model in our core app.
"""
import uuid

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_fsm import FSMField

from .attachment import NoteDocument


class ReferralNoteStatus(models.TextChoices):
    """
    Enum of all possible status for a note
    """

    # The referral report is published, note is created but the document is not treated
    RECEIVED = "received", _("Received")
    # Note is complete (text extraction etc..), ready to be sent in elastic search
    TO_SEND = "to_send", _("To send")
    # Note has been sent to elastic search
    ACTIVE = "active", _("Active")
    # Note has to be deleted from elastic search
    TO_DELETE = "to_delete", _("To delete")
    # Note is deleted from elastic search and won't be taken in account in future indexation
    INACTIVE = "inactive", _("Inactive")
    # An error occured on Note treatment
    ERROR = "error", _("Error")


class ReferralNote(models.Model):
    """
    The note sent for a given referral answer/final report.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the note as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    referral_id = models.CharField(
        verbose_name=_("referral id"),
        help_text=_("ID of the referral when note is generated"),
        max_length=10,
        blank=False,
        null=False,
    )

    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)
    publication_date = models.DateTimeField(verbose_name=_("publication date"))

    object = models.CharField(
        verbose_name=_("object"),
        help_text=_("Brief sentence describing the object of the referral"),
        max_length=60,
        blank=False,
        null=False,
    )

    topic = models.CharField(
        verbose_name=_("topic"),
        help_text=_("Referral topic title"),
        max_length=255,
        blank=False,
        null=False,
    )

    author = models.CharField(
        verbose_name=_("author"),
        help_text=_("Full author note name"),
        max_length=255,
        blank=False,
    )

    contributors = ArrayField(
        base_field=models.CharField(
            max_length=255,
        ),
        verbose_name=_("contributors"),
        help_text=_("Full names from note contributors"),
        blank=True,
        null=True,
    )

    requesters_unit_names = ArrayField(models.CharField(max_length=255))

    assigned_units_names = ArrayField(
        models.CharField(max_length=255),
    )

    document = models.OneToOneField(
        NoteDocument,
        verbose_name=_("referral note document"),
        help_text=_("The document attached to the note"),
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    text = models.TextField(
        verbose_name=_("version text"),
        help_text=_("Raw text from document file or editor"),
        blank=False,
        null=False,
    )

    html = models.TextField(
        verbose_name=_("html"),
        help_text=_("Html generated from document file or editor"),
        blank=True,
        null=True,
    )

    state = FSMField(
        verbose_name=_("ReferralNote state"),
        help_text=_("Status indicating action to do for scheduled tasks"),
        default=ReferralNoteStatus.RECEIVED,
        choices=ReferralNoteStatus.choices,
    )

    class Meta:
        db_table = "partaj_referral_note"
        verbose_name = _("referral note")

    def __str__(self):
        """Get the string representation of a referral note."""
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} #{self.id}"
