"""
Unit and related models in our core app.
"""
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _


class UnitMembershipRole(models.TextChoices):
    ADMIN = "admin", _("Admin")
    MEMBER = "member", _("Member")
    OWNER = "owner", _("Owner")


class Unit(models.Model):
    """
    A unit is a group of people who own one or several topics.
    """

    # Generic fields
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the unit as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    # Help users navigate units by giving them human names
    name = models.CharField(
        verbose_name=_("name"), help_text=_("Human name for this unit"), max_length=255
    )

    # Members of the unit can collaborate on referrals the unit is responsible for.
    # Characteristics of the membership are defined on the intermediary model.
    members = models.ManyToManyField(
        verbose_name=_("members"),
        help_text=_("Members of the unit"),
        to=get_user_model(),
        through="UnitMembership",
    )

    class Meta:
        db_table = "partaj_unit"
        verbose_name = _("unit")

    def __str__(self):
        """Get the string representation of a unit."""
        return f"{self._meta.verbose_name.title()} — {self.name}"

    def get_organizers(self):
        """
        Return a queryset of all the owners and admins of this unit for convenience.
        """
        return self.members.filter(
            Q(unitmembership__role=UnitMembershipRole.OWNER)
            | Q(unitmembership__role=UnitMembershipRole.ADMIN)
        )


class UnitMembership(models.Model):
    """
    Explicit ManyToMany association table to manage user memberships to units.
    """

    # Generic fields to build up minimal data on any membership
    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the membership"),
        primary_key=True,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)

    # Point to each of the two models we're associating
    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("User whose membership is characterized"),
        to=get_user_model(),
        on_delete=models.CASCADE,
    )
    unit = models.ForeignKey(
        verbose_name=_("unit"),
        help_text=_("Unit to which we're linking the user"),
        to=Unit,
        on_delete=models.CASCADE,
    )

    # Manage the level of the membership
    role = models.CharField(
        verbose_name=_("role"),
        help_text=_("Role granted to the user in the unit by this membership"),
        max_length=20,
        choices=UnitMembershipRole.choices,
        default=UnitMembershipRole.MEMBER,
    )

    class Meta:
        db_table = "partaj_unitmembership"
        unique_together = [["unit", "user"]]
        verbose_name = _("unit membership")

    def get_human_role(self):
        """
        Get the human readable, localized label for the current role granted by the membership.
        """
        return UnitMembershipRole(self.role).label


class Topic(models.Model):
    """
    We use topics as user-friendly ways to direct users to the right unit that can handle their
    referral.
    """

    # Generic fields
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the topic as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    # The unit which owns this topic
    unit = models.ForeignKey(
        Unit, verbose_name=_("unit"), on_delete=models.SET_NULL, blank=True, null=True
    )

    # The purpose of topics is to have user-friendly names to display in our views
    name = models.CharField(
        verbose_name=_("name"),
        help_text=_("User-friendly name for this topic"),
        max_length=255,
    )

    class Meta:
        db_table = "partaj_topic"
        verbose_name = _("topic")

    def __str__(self):
        """Get the string representation of a topic."""
        return self.name
