"""
Referral satisfaction & related models.
"""

import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralSatisfactionChoice(models.TextChoices):
    """
    Enum listing all possible kinds of referral satisfaction answer.
    """

    HAPPY = 10, _("satisfaction happy choice")
    NORMAL = 5, _("satisfaction normal choice")
    UNHAPPY = 0, _("satisfaction unhappy choice")


class ReferralUserRole(models.TextChoices):
    """
    Enum listing all possible referral role in satisfaction answer.
    """

    MEMBER = "MEMBER", _("referral unit member")
    OWNER = "OWNER", _("referral unit owner")
    REQUESTER = "REQUESTER", _("referral requester")


class ReferralSatisfactionType(models.TextChoices):
    """
    Enum listing all possible kinds of referral satisfaction.
    """

    REQUEST = "request", _("request satisfaction")
    ANSWER = "answer", _("answer satisfaction")


class ReferralSatisfaction(models.Model):
    """
    Referral user satisfaction for request and response
    """

    # Generic fields to build up minimal data on any activity
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral satisfaction as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral on which the satisfaction response was made"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="satisfactions",
    )

    role = models.CharField(
        verbose_name=_("role"),
        help_text=_("User role in the referral"),
        max_length=50,
        choices=ReferralUserRole.choices,
    )

    choice = models.IntegerField(
        verbose_name=_("choice"),
        help_text=_("Choice made for the satisfaction request"),
        choices=ReferralSatisfactionChoice.choices,
    )

    type = models.TextField(
        verbose_name=_("type"),
        help_text=_("type of satisfaction request response"),
        choices=ReferralSatisfactionType.choices,
    )

    class Meta:
        db_table = "partaj_referral_satisfaction"
        verbose_name = _("referral satisfaction")

    def __str__(self):
        """Get the string representation of a referral satisfaction."""
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} #tieps"
