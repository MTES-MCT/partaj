"""
ReferralRelationship model to linked two referrals.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralRelationshipTypes(models.TextChoices):
    """
    Enum relationship types between referrals.
    """

    LINKED = "L"


class ReferralRelationship(models.Model):
    """Through class to link referrals."""

    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the relationship"),
        primary_key=True,
        editable=False,
    )

    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    main_referral = models.ForeignKey(
        verbose_name=_("main_referral"),
        related_name="main_relationships",
        help_text=_("Main referral in the relationship"),
        to="Referral",
        on_delete=models.CASCADE,
    )

    related_referral = models.ForeignKey(
        verbose_name=_("related_referral"),
        related_name="related_relationships",
        help_text=_("Related referral in the relationship"),
        to="Referral",
        on_delete=models.CASCADE,
    )

    type = models.CharField(
        choices=ReferralRelationshipTypes.choices,
        default=ReferralRelationshipTypes.LINKED,
        max_length=1,
    )

    class Meta:
        db_table = "partaj_referral_relationship"
        unique_together = [["main_referral", "related_referral"]]
        verbose_name = _("referral relationship")
