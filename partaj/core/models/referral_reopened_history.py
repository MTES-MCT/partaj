"""
Referral reopening history model in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralReopenedHistory(models.Model):
    """
    Referral reopening history model.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral reopening history as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Reopened referral"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="reopening_history",
    )

    explanation = models.TextField(
        verbose_name=_("explanation"),
        help_text=_("explanation of referral reopening"),
    )

    class Meta:
        db_table = "partaj_referral_reopening_history"
        verbose_name = _("referral reopening history")

        def __str__(self):
            """Get the string representation of a Referral reopening history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
