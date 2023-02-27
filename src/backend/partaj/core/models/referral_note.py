# pylint: disable=too-many-instance-attributes
"""
Referral report model in our core app.
"""
import uuid

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from .attachment import NoteDocument


class ReferralNote(models.Model):
    """
    The note sent for a given Referral.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the note as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
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
        max_length=200,
        blank=False,
        null=False,
    )

    author = models.CharField(
        verbose_name=_("author"),
        help_text=_("Full author note name"),
        max_length=200,
        blank=False,
    )

    requesters_unit_names = ArrayField(models.CharField(max_length=200))

    assigned_units_names = ArrayField(
        models.CharField(max_length=200),
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
        verbose_name=_("report comment"),
        help_text=_("Html generated from document file or editor"),
        blank=False,
        null=False,
    )

    class Meta:
        db_table = "partaj_referral_note"
        verbose_name = _("referral note")

    def __str__(self):
        """Get the string representation of a referral report."""
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} #{self.report.id} — report {self.id}"
