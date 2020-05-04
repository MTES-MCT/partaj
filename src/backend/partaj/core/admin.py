"""
Admin of the `core` app of the Partaj project.
"""
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from .models import (
    Referral,
    ReferralAnswer,
    ReferralAssignment,
    ReferralAttachment,
    Unit,
    UnitMembership,
    Topic,
)


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    """
    Admin setup for units.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at"]

    # Organize data on the admin page
    fieldsets = (
        (_("Topic information"), {"fields": ["id", "created_at", "name", "unit"]}),
    )
    # Help users navigate topics more easily in the list view
    list_display = ("name", "unit_name")

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("unit",)

    # By default, order units alphabetically by name
    ordering = ("name",)

    def unit_name(self, topic):
        """
        Return the linked unit's name to display it on the topic list view.
        """
        return topic.unit.name


class TopicInline(admin.TabularInline):
    """
    Let topics be displayed inline on the unit admin view.
    """

    model = Topic


class UnitMembershipInline(admin.TabularInline):
    """
    Let unit memberships be displayed inline on the unit admin view.
    """

    model = UnitMembership


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    """
    Admin setup for units.
    """

    # Show referral attachments inline on each referral
    inlines = [TopicInline, UnitMembershipInline]

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at"]

    # Organize data on the admin page
    fieldsets = ((_("Unit information"), {"fields": ["id", "created_at", "name"]}),)

    # Help users navigate units more easily in the list view
    list_display = ("name",)

    # By default, order units alphabetically by name
    ordering = ("name",)


@admin.register(ReferralAttachment)
class ReferralAttachmentAdmin(admin.ModelAdmin):
    """
    Admin setup for referral attachments.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "size"]

    # Organize data on the admin page
    fieldsets = (
        (_("Metadata"), {"fields": ["id", "created_at", "referral"]}),
        (_("Document"), {"fields": ["name", "file", "size"]}),
    )

    # Help users navigate referral attachments more easily in the list view
    list_display = ("name", "referral_id", "created_at")

    # By default, show newest referrals first
    ordering = ("-created_at",)

    def referral_id(self, referral_attachment):
        """
        Return the linked referral's ID to display it on the referral attachment list view.
        """
        return referral_attachment.referral.id


class ReferralAttachmentInline(admin.TabularInline):
    """
    Let referral attachments be displayed inline on the referral admin view.
    """

    model = ReferralAttachment

    readonly_fields = ["size"]


class ReferralAssignmentInline(admin.TabularInline):
    """
    Let referral assignments be displayed inline on the referral admin view.
    """

    model = ReferralAssignment


class ReferralAnswerInline(admin.TabularInline):
    """
    Let referral answers be displayed inlie on the referral admin view.
    """

    model = ReferralAnswer


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    """
    Admin setup for referrals.
    """

    # Show referral attachments inline on each referral
    inlines = [ReferralAttachmentInline, ReferralAssignmentInline, ReferralAnswerInline]

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "requester_email",
        "requester_phone_number",
        "state",
    ]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id"]}),
        (
            _("Timing information"),
            {"fields": ["created_at", "updated_at", "urgency", "urgency_explanation"]},
        ),
        (
            _("Requester information"),
            {
                "fields": [
                    "user",
                    "requester",
                    "requester_email",
                    "requester_phone_number",
                ]
            },
        ),
        (_("Metadata"), {"fields": ["topic", "state"]}),
        (_("Referral content"), {"fields": ["question", "context", "prior_work"]}),
    )

    # Most important identifying fields to show on a Referral in list view in the admin
    list_display = (
        "id",
        "requester",
        "topic",
        "created_at",
        "urgency",
        "get_state_label",
    )

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("state", "urgency")

    # By default, show newest referrals first
    ordering = ("-created_at",)
