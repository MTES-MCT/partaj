"""
Referral report model in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from src.backend.partaj.core.models import VersionDocument


class ReferralReportVersion(models.Model):
    """
    A version created by the relevant unit for a given ReferralReport.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the report version as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)

    report = models.ForeignKey(
        verbose_name=_("report"),
        help_text=_("Report the version is linked with"),
        to="ReferralReport",
        on_delete=models.CASCADE,
        related_name="version",
    )

    document = models.OneToOneField(
        VersionDocument,
        verbose_name=_("report version"),
        help_text=_(
            "The document attached to the report version"),
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "partaj_referral_report_version"
        verbose_name = _("referral report version")

    def __str__(self):
        """Get the string representation of a referral report."""
        # pylint: disable=no-member
        return (
            f"{self._meta.verbose_name.title()} #{self.report.id} — report {self.id}"
        )
