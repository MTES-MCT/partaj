"""
Referral subdivision model.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from partaj.core.models import Referral


class ReferralSectionType(models.TextChoices):
    """
    Enum for possible referral sectiontypes.
    """

    MAIN = "main"
    SECONDARY = "secondary"


class ReferralGroup(models.Model):
    """
    Referral subdivision grouping sections
    """

    # Generic fields to build up minimal data on any message
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral subdivision as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    class Meta:
        db_table = "partaj_referral_group"
        verbose_name = _("referral group")

    def __str__(self):
        """Get the string representation of a referral group."""
        return f"{self._meta.verbose_name.title()} #{self.id}"

    def get_sections(self):
        """
        Get all sections in this group
        """
        return ReferralSection.objects.filter(group=self).all()


class ReferralSection(models.Model):
    """
    Referral group section
    """

    # Generic fields to build up minimal data on any message
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral section as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    referral = models.OneToOneField(
        Referral,
        verbose_name=_("referral"),
        related_name="section",
        help_text=_("The referral link to this section"),
        on_delete=models.CASCADE,
    )

    group = models.ForeignKey(
        verbose_name=_("subdivision"),
        help_text=_("Referral group section"),
        related_name="sections",
        to=ReferralGroup,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    type = models.CharField(
        choices=ReferralSectionType.choices,
        default=ReferralSectionType.MAIN,
        max_length=64,
    )

    class Meta:
        db_table = "partaj_referral_group_section"
        verbose_name = _("referral group section")

    def __str__(self):
        """Get the string representation of a referral group section."""
        return f"{self._meta.verbose_name.title()} #{self.id}"
