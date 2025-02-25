"""
Admin of the `core` app of the Partaj project.
"""
import csv

from django.contrib import admin
from django.http import HttpResponse
from django.utils.translation import gettext_lazy as _

from impersonate.models import ImpersonationLog
from rest_framework.authtoken.models import Token

from . import models

admin.site.unregister(ImpersonationLog)
admin.site.unregister(Token)


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
        return topic.unit.name

    get_unit_name.short_description = _("unit")

    def export_as_csv(self, request, queryset):
        """
        Export the linked topics to CSV format
        """
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename={}.csv".format(meta)
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
