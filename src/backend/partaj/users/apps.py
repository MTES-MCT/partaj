"""
Defines the django app config for the `users` app.
"""
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class UsersConfig(AppConfig):
    """Django app config for the `users` app."""

    name = 'partaj.users'
    verbose_name = _("Users")
