"""
Admin of the `core` app of the Partaj project.
"""
from django.contrib import admin

from .models import Referral, ReferralAttachment


@admin.register(ReferralAttachment)
class ReferralAttachmentAdmin(admin.ModelAdmin):
    pass


class ReferralAttachmentInline(admin.TabularInline):
    model = ReferralAttachment


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    inlines = [ReferralAttachmentInline]
