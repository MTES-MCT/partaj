"""
Referral report publishment model in our core app.
"""

import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralReportPublishment(models.Model):
    """
    A publishment created by the relevant unit for a given ReferralReport.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the report publishment as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    report = models.ForeignKey(
        verbose_name=_("report"),
        help_text=_("Report the publishment is linked with"),
        to="ReferralReport",
        on_delete=models.CASCADE,
        related_name="publishments",
    )

    comment = models.TextField(
        verbose_name=_("publishment comment"),
        help_text=_("Comment at report sending"),
        blank=True,
        null=True,
    )

    version = models.ForeignKey(
        verbose_name=_("publishment version"),
        help_text=_("Version the publishment is linked with"),
        to="ReferralReportVersion",
        on_delete=models.CASCADE,
        related_name="publishments",
    )

    created_by = models.ForeignKey(
        verbose_name=_("created by"),
        help_text=_("User who created the version"),
        to=get_user_model(),
        on_delete=models.SET_NULL,
        related_name="+",
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "partaj_referral_report_publishment"
        ordering = ["-created_at"]
        verbose_name = _("referral report publishment")

    def __str__(self):
        """Get the string representation of a referral report publishment."""
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} #{self.id}"
