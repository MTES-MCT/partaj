"""
Referral urgency history model in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralUrgencyLevelHistory(models.Model):
    """
    Referral historic urgency model.
    Instances of this model should only be created by administrators.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral urgency level history as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral subject to the urgency level change"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="urgencylevel_history",
    )

    old_referral_urgency = models.ForeignKey(
        verbose_name=_("old urgency level"),
        to="ReferralUrgency",
        on_delete=models.PROTECT,
        related_name="+",
    )

    new_referral_urgency = models.ForeignKey(
        verbose_name=_("new urgency level"),
        to="ReferralUrgency",
        on_delete=models.PROTECT,
        related_name="+",
    )

    explanation = models.TextField(
        verbose_name=_("explanation"),
        help_text=_("explanation of new urgency level"),
    )

    class Meta:
        db_table = "partaj_referral_urgency_history"
        verbose_name = _("referral urgency level history")

        def __str__(self):
            """Get the string representation of a Referral urgency level history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
