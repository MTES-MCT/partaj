"""
ReferralUserLink model and related models in our core app.
"""

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralUserLinkRoles(models.TextChoices):
    """
    Enum of possible values for the ReferralUserLink roles.
    """

    REQUESTER = "R"
    OBSERVER = "O"


class ReferralUserLinkNotificationsTypes(models.TextChoices):
    """
    Enum of possible values for the ReferralUserLink notifications.
    """

    ALL = "A"
    RESTRICTED = "R"
    NONE = "N"


class ReferralUserLink(models.Model):
    """Through class to link referrals and users."""

    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the unit assignment"),
        primary_key=True,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("User who is attached to the referral"),
        to=get_user_model(),
        on_delete=models.CASCADE,
    )
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral the user is attached to"),
        to="Referral",
        on_delete=models.CASCADE,
    )

    role = models.CharField(
        choices=ReferralUserLinkRoles.choices,
        default=ReferralUserLinkRoles.REQUESTER,
        max_length=1,
    )

    notifications = models.CharField(
        choices=ReferralUserLinkNotificationsTypes.choices,
        default=ReferralUserLinkNotificationsTypes.ALL,
        max_length=1,
    )

    class Meta:
        db_table = "partaj_referraluserlink"
        unique_together = [["user", "referral"]]
        verbose_name = _("referral user link")
