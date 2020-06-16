"""
Admin of the `core` app of the Partaj project.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from . import models


@admin.register(models.Topic)
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
    list_display = ("name", "get_unit_name")

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("unit",)

    # By default, order units alphabetically by name
    ordering = ("name",)

    def get_unit_name(self, topic):
        """
        Return the linked unit's name to display it on the topic list view.
        """
        return topic.unit.name

    get_unit_name.short_description = _("unit")


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
    fieldsets = ((_("Unit information"), {"fields": ["id", "created_at", "name"]}),)

    # Help users navigate units more easily in the list view
    list_display = ("name",)

    # By default, order units alphabetically by name
    ordering = ("name",)


@admin.register(models.ReferralAttachment)
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
    list_display = ("name", "get_referral_id", "created_at")

    # By default, show newest referrals first
    ordering = ("-created_at",)

    def get_referral_id(self, referral_attachment):
        """
        Return the linked referral's ID to display it on the referral attachment list view.
        """
        return referral_attachment.referral.id

    get_referral_id.short_description = _("referral")


@admin.register(models.ReferralAnswerAttachment)
class ReferralAnswerAttachmentAdmin(admin.ModelAdmin):
    """
    Admin setup for referral answer attachments.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "size"]

    # Organize data on the admin page
    fieldsets = (
        (_("Metadata"), {"fields": ["id", "created_at", "referral_answer"]}),
        (_("Document"), {"fields": ["name", "file", "size"]}),
    )

    # Help users navigate referral answer attachments more easily in the list view
    list_display = ("name", "get_referral_answer_id", "created_at")

    # By default, show newest referrals first
    ordering = ("-created_at",)

    def get_referral_answer_id(self, referral_answer_attachment):
        """
        Return the linked referral answer's ID to display it on the referral answer attachment
        list view.
        """
        return referral_answer_attachment.referral_answer.id

    get_referral_answer_id.short_description = _("referral answer")


class ReferralAttachmentInline(admin.TabularInline):
    """
    Let referral attachments be displayed inline on the referral admin view.
    """

    model = models.ReferralAttachment

    readonly_fields = ["size"]


class ReferralAnswerAttachmentInline(admin.TabularInline):
    """
    Let referral answer attachments be displayed inline on the referral answer admin view.
    """

    model = models.ReferralAnswerAttachment

    readonly_fields = ["size"]


class ReferralAssignmentInline(admin.TabularInline):
    """
    Let referral assignments be displayed inline on the referral admin view.
    """

    model = models.ReferralAssignment


class ReferralAnswerInline(admin.TabularInline):
    """
    Let referral answers be displayed inlie on the referral admin view.
    """

    model = models.ReferralAnswer


@admin.register(models.Referral)
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
        "state",
    ]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id"]}),
        (
            _("Timing information"),
            {"fields": ["created_at", "updated_at", "urgency", "urgency_explanation"]},
        ),
        (_("Requester information"), {"fields": ["user", "requester"]},),
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
        "get_human_state",
    )

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("state", "urgency")

    # By default, show newest referrals first
    ordering = ("-created_at",)


@admin.register(models.ReferralActivity)
class ReferralActivityAdmin(admin.ModelAdmin):
    """
    Admin setup for referral activities.
    """

    # Activities probably need to be readonly if we want to keep everything consistent
    readonly_fields = [
        "id",
        "created_at",
        "actor",
        "verb",
        "referral",
        "item_content_object",
    ]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id", "created_at"]}),
        (
            _("Activity"),
            {"fields": ["actor", "verb", "referral", "item_content_object"]},
        ),
    )

    # Most important identifying fields to show on a Referral activity in list view in the admin
    list_display = (
        "id",
        "referral",
        "actor",
        "verb",
        "created_at",
    )

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("actor", "verb", "referral")

    # By default, show newest referrals first
    ordering = ("-created_at",)


@admin.register(models.ReferralAnswer)
class ReferralAnswerAdmin(admin.ModelAdmin):
    """
    Admin setup for referral answers.
    """

    # Show referral answer attachments inline on each referral answer
    inlines = [ReferralAnswerAttachmentInline]

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = [
        "id",
        "created_at",
        "referral",
    ]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id", "created_at", "referral"]}),
        (_("Referral answer"), {"fields": ["created_by", "content"]}),
    )

    # Most important identifying fields to show on a ReferralAnswer in list view in the admin
    list_display = (
        "id",
        "get_referral_id",
        "created_by",
        "created_at",
    )

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("referral", "created_by")

    # By default, show newest referrals answers first
    ordering = ("-created_at",)

    def get_referral_id(self, referral_answer_attachment):
        """
        Get the ID of the linked referral.
        """
        return referral_answer_attachment.referral.id

    get_referral_id.short_description = _("referral")
