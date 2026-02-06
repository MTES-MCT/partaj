"""
Referral report appendix in our core app.
"""

import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from .attachment import AppendixDocument


class ReferralReportAppendix(models.Model):
    """
    An appendix created by the relevant unit for a given ReferralReport.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the report appendix as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)

    report = models.ForeignKey(
        verbose_name=_("report"),
        help_text=_("Report the appendix is linked with"),
        to="ReferralReport",
        on_delete=models.CASCADE,
        related_name="appendices",
    )

    document = models.OneToOneField(
        AppendixDocument,
        verbose_name=_("report appendix document"),
        help_text=_("The document attached to the report appendix"),
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    appendix_number = models.IntegerField(
        verbose_name=_("appendix_number"),
        help_text=_("Appendix number"),
        blank=True,
        null=True,
    )

    created_by = models.ForeignKey(
        verbose_name=_("created by"),
        help_text=_("User who created the appendix"),
        to=get_user_model(),
        on_delete=models.SET_NULL,
        related_name="+",
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "partaj_referral_report_appendix"
        ordering = ["-created_at"]
        verbose_name = _("referral report appendix")

    def __str__(self):
        """Get the string representation of a referral report appendix."""
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} #{self.report.id} — report {self.id}"
