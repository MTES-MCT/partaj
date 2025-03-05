"""
Admin of the `users` app of the Partaj project.
"""
from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _

from impersonate.admin import UserAdminImpersonateMixin

from .models import User

admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(UserAdminImpersonateMixin, admin.ModelAdmin):
    """
    Admin setup for users.
    """

    # Display fields automatically created and updated by Django (as readonly)
    readonly_fields = ["id", "date_joined", "updated_at"]
    filter_horizontal = ("groups",)

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
                    "unit_name",
                    "groups",
                ]
            },
        ),
        (
            _("Authorization information"),
            {"fields": ["is_active", "is_staff", "is_superuser", "is_tester"]},
        ),
    )

    # Most important identifying fields to show on a User in list view in the admin
    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_superuser",
        "is_tester",
    )

    # Add easy filters on our most relevant fields for filtering
    list_filter = ("is_active", "is_staff", "is_superuser", "is_tester")

    # By default, show newest users first
    ordering = ("last_name",)

    # When impersonating a user with django-impersonate, open the impersonation in a new window
    open_new_window = True


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, admin.ModelAdmin):
    """
    Admin setup for Group.
    """
