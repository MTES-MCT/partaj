"""
Referral report model in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralReportState(models.TextChoices):
    """
    Enum of possible values for the state field of the referral report state.
    """

    DRAFT = "draft", _("draft")
    PUBLISHED = "published", _("published")


class ReferralReport(models.Model):
    """
    A report created by the relevant unit for a given Referral.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral report as UUID"),
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
        choices=ReferralReportState.choices,
        default=ReferralReportState.DRAFT,
    )

    class Meta:
        db_table = "partaj_referral_report"
        verbose_name = _("referral report")

    def __str__(self):
        """Get the string representation of a referral report."""
        # pylint: disable=no-member
        return (
            f"{self._meta.verbose_name.title()} #{self.referral.id} — report {self.id}"
        )
