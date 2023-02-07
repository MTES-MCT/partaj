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
        (_("Metadata"), {"fields": ["id", "created_at", "referral_answers"]}),
        (_("Document"), {"fields": ["name", "file", "size"]}),
    )

    # Help users navigate referral answer attachments more easily in the list view
    list_display = ("name", "get_referral_answers_ids", "created_at")

    # By default, show newest referrals first
    ordering = ("-created_at",)

    def get_referral_answers_ids(self, referral_answer_attachment):
        """
        Return the linked referral answers' IDs to display them on the referral answer attachment
        list view.
        """
        return [
            referral_answer.id
            for referral_answer in referral_answer_attachment.referral_answers.all()
        ]

    get_referral_answers_ids.short_description = _("referral answers")


@admin.register(models.ReferralMessageAttachment)
class ReferralMessageAttachmentAdmin(admin.ModelAdmin):
    """
    Admin setup for referral message attachments.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "size"]

    # Organize data on the admin page
    fieldsets = (
        (_("Metadata"), {"fields": ["id", "created_at", "referral_message"]}),
        (_("Document"), {"fields": ["name", "file", "size"]}),
    )

    # Help users navigate referral message attachments more easily in the list view
    list_display = ("name", "get_referral_message_id", "created_at")

    # By default, show newest referrals first
    ordering = ("-created_at",)

    def get_referral_message_id(self, referral_attachment):
        """
        Return the linked referral message's ID to display it on the referral attachment list view.
        """
        return referral_attachment.referral_message.id

    get_referral_message_id.short_description = _("referral message")


@admin.register(models.ReferralMessage)
class ReferralMessageAdmin(admin.ModelAdmin):
    """
    Admin setup for referral message.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id"]

    # By default, show newest referrals first
    ordering = ("-created_at",)


class ReferralAttachmentInline(admin.TabularInline):
    """
    Let referral attachments be displayed inline on the referral admin view.
    """

    model = models.ReferralAttachment

    readonly_fields = ["size"]


class ReferralAnswerAttachmentRelationInline(admin.TabularInline):
    """
    Let referral answer attachments be displayed inline on the referral answer admin view.
    """

    model = models.ReferralAnswerAttachment.referral_answers.through


class ReferralAssignmentInline(admin.TabularInline):
    """
    Let referral assignments be displayed inline on the referral admin view.
    """

    model = models.ReferralAssignment


class ReferralUnitAssignmentInline(admin.TabularInline):
    """
    Let referral unit assignments be displayed inline on the referral admin view.
    """

    model = models.ReferralUnitAssignment


class ReferralUserLinkInline(admin.TabularInline):
    """
    Let referral user links be displayed inline on the referral admin view.
    """

    model = models.ReferralUserLink


class ReferralAnswerInline(admin.TabularInline):
    """
    Let referral answers be displayed inlie on the referral admin view.
    """

    model = models.ReferralAnswer


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


@admin.register(models.Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Admin setup for notifications.
    """

    list_display = (
        "notified",
        "notifier",
        "notification_type",
        "status",
        "item_content_object",
    )


@admin.register(models.Referral)
class ReferralAdmin(admin.ModelAdmin):
    """
    Admin setup for referrals.
    """

    # Show referral attachments inline on each referral
    inlines = [
        ReferralUserLinkInline,
        ReferralAttachmentInline,
        ReferralUnitAssignmentInline,
        ReferralAssignmentInline,
        ReferralAnswerInline,
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
        (_("Metadata"), {"fields": ["object", "topic", "state", "answer_type"]}),
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
            {
                "fields": [
                    "actor",
                    "verb",
                    "referral",
                    "item_content_object",
                ]
            },
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
    inlines = [ReferralAnswerAttachmentRelationInline]

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "referral", "state"]

    # Organize data on the admin page
    fieldsets = (
        (
            _("Identification"),
            {"fields": ["id", "created_at", "referral", "state", "published_answer"]},
        ),
        (_("Referral answer"), {"fields": ["created_by", "content"]}),
    )

    # Most important identifying fields to show on a ReferralAnswer in list view in the admin
    list_display = (
        "id",
        "get_referral_id",
        "state",
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


class ReferralAnswerValidationResponseInline(admin.TabularInline):
    """
    Let referral answer attachments be displayed inline on the referral answer admin view.
    """

    model = models.ReferralAnswerValidationResponse


@admin.register(models.ReferralAnswerValidationRequest)
class ReferralAnswerValidationAdmin(admin.ModelAdmin):
    """
    Admin setup for referral answer validation. Requests are the entry point here
    but we're also displaying responses.
    """

    # Show validation responses along with their matching validation request
    inlines = [ReferralAnswerValidationResponseInline]

    readonly_fields = [
        "id",
        "answer",
        "validator",
    ]

    # Most important identifying fields to show on a validation in list view in the admin
    list_display = ("id", "get_referral_id", "get_answer_id", "validator")

    ordering = ("answer",)

    def get_answer_id(self, referral_answer_validation_request):
        """
        Get the ID of the linked answer.
        """
        return referral_answer_validation_request.answer.id

    get_answer_id.short_description = _("referral answer")

    def get_referral_id(self, referral_answer_validation_request):
        """
        Get the ID of the linked referral.
        """
        return referral_answer_validation_request.answer.referral.id

    get_referral_id.short_description = _("referral")


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
