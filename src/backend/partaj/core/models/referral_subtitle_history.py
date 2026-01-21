"""
Referral subtitle history model in our core app.
"""

import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralSubTitleUpdateHistory(models.Model):
    """
    Referral historic subtitle.
    Instances of this model should only be created by administrators,unit's owner or unit's member.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral sub title history as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral subject to the sub title change"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="referral_subtitle_history",
    )

    subtitle = models.TextField(
        verbose_name=_("new subtitle"),
        help_text=_("new referral's subtitle"),
    )

    class Meta:
        db_table = "partaj_referral_subtitle_update_history"
        verbose_name = _("referral subtitle update history")

        def __str__(self):
            """Get the string representation of a Referral subtitle history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
