"""
Unit and related models in our core app.
"""
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _


class UnitUtils:
    """
    Referral's answer are not sent to Notix for this unit list
    """

    EXPORT_BLACKLISTED_UNITS = [
        "Test-CODIR",
        "SG/DAJ/Bureau-Test",
        "DGPR/SRT/BRPIC",
        "SG/DAJ/PCNT",
    ]

    @classmethod
    def get_exported_blacklist_unit(cls):
        """
        Return blacklisted unit's name
        """
        return cls.EXPORT_BLACKLISTED_UNITS


class UnitMembershipRole(models.TextChoices):
    """
    Enum for possible roles for a member of a unit.
    """

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

    def get_note_value(self):
        """
        Get a string showing a unit's name for notix
        """
        return f"{self.name}"

    def __str__(self):
        """Get the string representation of a unit."""
        return f"{self._meta.verbose_name.title()} — {self.name}"

    def get_memberships(self):
        """
        Get members of the unit with their membership to this unit. We're going from membership
        to member for simplicity's sake as that's how the relation actually works: a membershio
        only has one user where a user has a membership set.
        """
        return UnitMembership.objects.filter(unit=self).select_related("user")


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


def unitmembership_m2m_changed(signal, sender, **kwargs):
    """
    Listen to the ManyToMany signal for Unit memberships to update the Elasticsearch
    entry for all referrals linked with the relevant unit when its membership changes.
    """
    # pylint: disable=import-outside-toplevel
    from ..indexers import ReferralsIndexer, partaj_bulk

    unit = kwargs["instance"]
    if kwargs["pk_set"]:
        partaj_bulk(
            [
                ReferralsIndexer.get_es_document_for_referral(referral)
                for referral in unit.referrals_assigned.all()
                .select_related("topic", "urgency_level")
                .prefetch_related("assignees", "units", "user")
            ]
        )


models.signals.m2m_changed.connect(unitmembership_m2m_changed, Unit.members.through)


class TopicManager(models.Manager):
    """
    Override the default model manager to add methods related to building the Materialized Path
    properties of all our stored topics.
    """

    def build_materialized_paths(self, topics=None):
        """
        Recursively build Materialized Paths for all topics, starting with the root topics (that
        have no parent) and iterating through their children, one depth level at a time, until
        there are no more children to iterate through.
        """

        # Stop the recursion when we have no topics at this depth level.
        if topics and not topics.exists():
            return

        # If the method is called with no arguments, ie. is called by a use site and not through
        # recursion, start with the root topics.
        if not topics:
            topics = self.get_queryset().filter(parent=None)

        # Always order topics by name before assigning paths. This way siblings will always be
        # ordered by name.
        topics = topics.order_by("name")

        # Start iteration. First topic has path "0", which will be zfilled to "0000"
        i = 0
        for topic in topics:
            # A topic's path starts with their parent's full path
            topic.path = topic.parent.path if topic.parent is not None else ""
            # Use the current queryset index to determine the path of the current topic among
            # their siblings
            topic.path = topic.path + str(i).zfill(4)
            # Increment index (which is path for current topic among siblings) for next sibling
            i = i + 1

        # Bulk update paths for all children of a given parent at once
        self.get_queryset().bulk_update(topics, ["path"])

        # For each topic, replay this routine through their children
        for topic in topics:
            self.build_materialized_paths(topic.children)


class Topic(models.Model):
    """
    We use topics as user-friendly ways to direct users to the right unit that can handle their
    referral.
    """

    objects = TopicManager()

    # Generic fields
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the topic as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    is_active = models.BooleanField(
        verbose_name=_("is active"),
        help_text=_("Whether this topic is displayed in the referral form"),
        default=True,
    )

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

    parent = models.ForeignKey(
        verbose_name=_("parent"),
        help_text=_("Parent topic in the hierarchy of topics"),
        to="self",
        on_delete=models.CASCADE,
        related_name="children",
        blank=True,
        null=True,
    )
    path = models.CharField(
        verbose_name=_("path"),
        help_text=_("Materialized Path to the topic in the hierarchy of topics"),
        max_length=255,
    )

    class Meta:
        db_table = "partaj_topic"
        verbose_name = _("topic")

    def get_note_value(self):
        """
        Get a string showing a unit's name for notix
        """
        return f"{self.name}"

    def __str__(self):
        """Get the string representation of a topic."""
        return self.name

    def delete(self, *args, **kwargs):
        """
        Make sure all Materialized Paths for all topics are re-computed after a topic is
        deleted.
        """
        super().delete(*args, **kwargs)
        Topic.objects.build_materialized_paths()

    def save(self, *args, **kwargs):
        """
        Make sure all Materialized Paths for all topics are re-computed after a topic is
        created or modified.
        """
        super().save(*args, **kwargs)
        Topic.objects.build_materialized_paths()

    def get_parents_paths(self):
        """
        Get the paths to all the parents of the current topic and return them as a list.
        """
        # Split the topic list into chunks of 4 (the length of our Materialized Path parts)
        path_chunks = [
            self.path[i : i + 4] for i in range(0, len(self.path), 4)  # noqa
        ]

        parents_paths = []
        ancestor_path = ""
        # Iterate through the chunk, keeping the current list of parents path and the last parent
        # we went through (eg. the parent one step closer to root than the one represented by the
        # current chunk)
        for path_chunk in path_chunks:
            parent_path = ancestor_path + path_chunk
            # When we complete the loop and find our current topic, bail out
            if parent_path == self.path:
                break

            # We have an actual ancestor of the current topic, add it to the list
            parents_paths.append(parent_path)
            # Update the ancestor path as a starting point to the next parent, which is
            # a child of the topic represented by "parent_path", but a parent or grand-parent
            # (and so on) of the current topic "self".
            ancestor_path = parent_path

        return parents_paths
