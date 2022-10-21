"""
Defines the django app config for the `core` app.
"""

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class CoreConfig(AppConfig):
    """Django app config for the `core` app."""

    name = "partaj.core"
    verbose_name = _("Partaj")

    # pylint: disable=import-outside-toplevel
    # pylint: disable=unused-import
    def ready(self):
        from . import receivers  # noqa: F401
