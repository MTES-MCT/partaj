"""
Admin of the `core` app of the Partaj project.
"""

import csv

from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _

from impersonate.models import ImpersonationLog
from rest_framework.authtoken.models import Token

from . import models

# Unregister models that may or may not be auto-registered depending on package versions
try:
    admin.site.unregister(ImpersonationLog)
except NotRegistered:
    pass

try:
    admin.site.unregister(Token)
except NotRegistered:
    pass


@admin.register(models.Topic)
class TopicAdmin(admin.ModelAdmin):
    """
    Admin setup for units.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "path"]

    # Organize data on the admin page
    fieldsets = (
        (_("Topic metadata"), {"fields": ["id", "created_at", "is_active"]}),
        (_("Topic information"), {"fields": ["name", "parent", "path", "unit"]}),
    )
    # Help users navigate topics more easily in the list view
    list_display = ("name", "parent", "path", "get_unit_name")

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("unit",)

    # By default, order topics alphabetically by name
    ordering = ("path",)

    def get_unit_name(self, topic):
        """
        Return the linked unit's name to display it on the topic list view.
        """
        if not topic.unit:
            return None
        return topic.unit.name

    get_unit_name.short_description = _("unit")

    def export_as_csv(self, request, queryset):
        """
        Export the linked topics to CSV format
        """
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f"attachment; filename={meta}.csv"
        writer = csv.writer(response)

        writer.writerow(field_names)
        for obj in queryset:
            writer.writerow([getattr(obj, field) for field in field_names])

        return response

    export_as_csv.short_description = "Export"

    actions = ("export_as_csv",)


@admin.register(models.ReferralUrgency)
class ReferralUrgencyAdmin(admin.ModelAdmin):
    """
    Admin setup for referral urgencies.
    """

    fieldsets = (
        (
            _("Information"),
            {"fields": ("name", "index", "duration", "requires_justification")},
        ),
    )

    list_display = ("name", "index", "duration", "requires_justification")


class TopicInline(admin.TabularInline):
    """
    Let topics be displayed inline on the unit admin view.
    """

    model = models.Topic


class UnitMembershipInline(admin.TabularInline):
    """
    Let unit memberships be displayed inline on the unit admin view.
    """

    model = models.UnitMembership


@admin.register(models.Unit)
class UnitAdmin(admin.ModelAdmin):
    """
    Admin setup for units.
    """

    # Show referral attachments inline on each referral
    inlines = [TopicInline, UnitMembershipInline]

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at"]

    # Organize data on the admin page
    fieldsets = (
        (_("Unit information"), {"fields": ["id", "created_at", "name"]}),
        (_("Knowledge database setup"), {"fields": ["kdb_access", "kdb_export"]}),
        (_("Member access"), {"fields": ["member_role_access"]}),
    )

    # Help users navigate units more easily in the list view
    list_display = (
        "name",
        "kdb_access",
        "kdb_export",
        "member_role_access",
    )

    # By default, order units alphabetically by name
    ordering = ("name",)


@admin.register(models.FeatureFlag)
class ReferralFeatureFlagAdmin(admin.ModelAdmin):
    """
    Admin setup for feature flags.
    """

    fieldsets = (
        (
            _("Information"),
            {"fields": ("tag", "limit_date")},
        ),
    )

    list_display = ("tag", "limit_date")
    ordering = ("tag",)


class ReferralUserLinkInline(admin.TabularInline):
    """
    Let referral user links be displayed inline on the referral admin view.
    """

    model = models.ReferralUserLink


@admin.register(models.Referral)
class ReferralAdmin(admin.ModelAdmin):
    """
    Admin setup for referrals.
    """

    # Show referral attachments inline on each referral
    inlines = [
        ReferralUserLinkInline,
    ]

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
    ]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id"]}),
        (
            _("Timing information"),
            {
                "fields": [
                    "created_at",
                    "updated_at",
                    "sent_at",
                    "urgency",
                    "urgency_level",
                    "urgency_explanation",
                ]
            },
        ),
        (
            _("Metadata"),
            {"fields": ["object", "topic", "state", "answer_type", "status", "title"]},
        ),
        (
            _("Referral content"),
            {"fields": ["question", "context", "prior_work"]},
        ),
    )

    # Most important identifying fields to show on a Referral in list view in the admin
    list_display = (
        "id",
        "get_users",
        "topic",
        "created_at",
        "updated_at",
        "sent_at",
        "urgency",
        "get_human_state",
    )

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("state", "urgency")

    # By default, show newest referrals first
    ordering = ("-created_at",)

    def get_users(self, referral):
        """
        Get the names of the linked users.
        """
        names = ", ".join([user.get_full_name() for user in referral.users.all()])
        # Truncate the list if it is too long to be displayed entirely
        return (names[:50] + "..") if len(names) > 52 else names

    get_users.short_description = _("users")


@admin.register(models.ReferralNote)
class NotesAdmin(admin.ModelAdmin):
    """
    Admin setup for notes.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = [
        "id",
        "created_at",
        "referral_id",
        "publication_date",
    ]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id"]}),
        (
            _("Timing information"),
            {
                "fields": [
                    "created_at",
                    "publication_date",
                ]
            },
        ),
        (
            _("Metadata"),
            {"fields": ["referral_id", "object", "topic", "text", "html", "state"]},
        ),
    )

    # Most important identifying fields to show on a Referral in list view in the admin
    list_display = (
        "referral_id",
        "id",
        "publication_date",
        "state",
        "topic",
        "object",
        "created_at",
    )

    # By default, show newest note first
    ordering = ("-created_at",)

    def get_users(self, referral):
        """
        Get the names of the linked users.
        """
        names = ", ".join([user.get_full_name() for user in referral.users.all()])
        # Truncate the list if it is too long to be displayed entirely
        return (names[:50] + "..") if len(names) > 52 else names

    get_users.short_description = _("users")
