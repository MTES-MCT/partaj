"""
Admin of the `core` app of the Partaj project.
"""
import os

from django import forms
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from .models import Referral, ReferralAttachment


class ReferralAttachmentForm(forms.ModelForm):
    """
    Custom admin form for referral attachment.
    """

    def clean(self):
        """
        Using the same approach we do in the user-facing view, default the referral attachment name
        to the name of the file itself.
        """
        self._validate_unique = True

        if not self.cleaned_data["name"]:
            file_main, _ = os.path.splitext(self.cleaned_data["file"].name)
            self.cleaned_data["name"] = file_main

        return self.cleaned_data


@admin.register(ReferralAttachment)
class ReferralAttachmentAdmin(admin.ModelAdmin):
    """
    Admin setup for referral attachments.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "created_at"]

    # Customize behavior fo the referral attachment form to use the file name as the
    # default name for the attachment
    form = ReferralAttachmentForm

    # Organize data on the admin page
    fieldsets = (
        (_("Metadata"), {"fields": ["id", "created_at", "referral"]}),
        (_("Document"), {"fields": ["name", "file"]}),
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


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    """
    Admin setup for referrals.
    """

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
            {"fields": ["user", "requester", "requester_email", "requester_phone_number"]},
        ),
        (_("Metadata"), {"fields": ["subject", "status"]}),
        (_("Referral content"), {"fields": ["question", "context", "prior_work"]}),
    )

    # Most important identifying fields to show on a Referral in list view in the admin
    list_display = ("subject", "requester", "created_at", "urgency", "status")

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("status", "urgency")

    # By default, show newest referrals first
    ordering = ("-created_at",)
