"""
Admin of the `core` app of the Partaj project.
"""
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from .models import Referral, ReferralAttachment


@admin.register(ReferralAttachment)
class ReferralAttachmentAdmin(admin.ModelAdmin):
    pass


class ReferralAttachmentInline(admin.TabularInline):
    model = ReferralAttachment


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    # Show referral attachments inline on each referral
    inlines = [ReferralAttachmentInline]
    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at", "updated_at"]

    # Organize data on the admin page
    fieldsets = (
        (_("Identification"), {"fields": ["id"]}),
        (
            _("Timing information"),
            {"fields": ["created_at", "updated_at", "urgency", "urgency_explanation"]},
        ),
        (
            _("Requester information"),
            {"fields": ["requester", "requester_email", "requester_phone_number"]},
        ),
        (_("Metadata"), {"fields": ["subject", "status"]}),
        (_("Referral content"), {"fields": ["question", "context", "prior_work"]}),
    )
