"""
Admin of the `users` app of the Partaj project.
"""
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """
    Admin setup for users.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "date_joined", "updated_at"]

    # Organize data on the admin page
    fieldsets = (
        (
            _("Database information"),
            {"fields": ["id", "date_joined", "updated_at"]},
        ),
        (
            _("Identifying information"),
            {
                "fields": [
                    "username",
                    "first_name",
                    "title",
                    "last_name",
                    "email",
                    "phone_number",
                    "unite",
                ]
            },
        ),
        (
            _("Authorization information"),
            {"fields": ["is_active", "is_staff", "is_superuser"]},
        ),
    )

    # Most important identifying fields to show on a User in list view in the admin
    list_display = ("email", "first_name", "last_name", "is_staff", "is_superuser")

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("is_active", "is_staff", "is_superuser")

    # By default, show newest users first
    ordering = ("-date_joined",)
