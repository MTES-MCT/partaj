"""
Referral subquestion history model in our core app.
"""

import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralSubQuestionUpdateHistory(models.Model):
    """
    Referral historic subquestion.
    Instances of this model should only be created by administrators,unit's owner or unit's member.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral sub question history as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral subject to the sub question change"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="referral_subquestion_history",
    )

    subquestion = models.TextField(
        verbose_name=_("new subquestion"),
        help_text=_("new referral's subquestion"),
    )

    class Meta:
        db_table = "partaj_referral_subquestion_history"
        verbose_name = _("referral subquestion history")

        def __str__(self):
            """Get the string representation of a Referral sub question history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
