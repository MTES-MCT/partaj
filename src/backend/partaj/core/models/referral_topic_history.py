"""
Referral topic history model in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralTopicHistory(models.Model):
    """
    Referral historic topic.
    Instances of this model should only be created by administrators, unit's owner or unit's member.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral topic history as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral topic change activity"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="referral_topic_history",
    )

    old_topic = models.TextField(
        verbose_name=_("old topic"),
        help_text=_("old referral's topic"),
    )

    new_topic = models.TextField(
        verbose_name=_("new topic"),
        help_text=_("new referral's topic"),
    )

    class Meta:
        db_table = "partaj_referral_topic_history"
        verbose_name = _("referral topic history")

        def __str__(self):
            """Get the string representation of a Referral topic history."""
            # pylint: disable=no-member
            return f"{self._meta.verbose_name.title()} #{self.id}"
