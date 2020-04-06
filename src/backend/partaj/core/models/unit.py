"""
Unit and related models in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import ugettext_lazy as _


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

    class Meta:
        db_table = "partaj_unit"
        verbose_name = _("unit")

    def __str__(self):
        """Get the string representation of a unit."""
        return f"{self._meta.verbose_name.title()} — {self.name}"


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
