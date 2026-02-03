"""
Referral title history model in our core app.
"""

import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralTitleHistory(models.Model):
    """
    Referral historic title.
    Instances of this model should only be created by administrators,unit's owner or unit's member.
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
        related_name="referral_title_history",
    )

    old_title = models.TextField(
        verbose_name=_("old title"),
        help_text=_("old referral's title"),
    )
    new_title = models.TextField(
        verbose_name=_("new title"),
        help_text=_("new referral's title"),
    )

    class Meta:
        db_table = "partaj_referral_title_history"
        verbose_name = _("referral  title history")

        def __str__(self):
            """Get the string representation of a Referral urgency level history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
