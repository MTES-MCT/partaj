"""
Referral subreferral created history model in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class SubReferralCreatedHistory(models.Model):
    """
    Referral historic sub referral created history.
    Instances of this model should only be created by administrators,unit's owner or unit's member.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_(
            "Primary key for the referral sub referral created history as UUID"
        ),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral subject to the sub referral created"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="referral_subreferral_created_history",
    )

    main_referral_id = models.TextField(
        verbose_name=_("main referral id"),
        help_text=_("referral parent which sub referral is created from"),
    )

    secondary_referral_id = models.TextField(
        verbose_name=_("main referral id"),
        help_text=_("newly created id secondary referral "),
    )

    class Meta:
        db_table = "partaj_subreferral_created_history"
        verbose_name = _("referral subreferral created history")

        def __str__(self):
            """Get the string representation of a Referral sub question history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
