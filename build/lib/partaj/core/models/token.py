"""
Token  models in our core app.
"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class Token(models.Model):
    """
    A token is a access token retrieve from Notix app.
    """

    # Generic fields
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the token as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)

    access_token = models.CharField(
        verbose_name=_("access token"),
        help_text=_("access token"),
        max_length=4096,
        null=True,
    )

    refresh_token = models.CharField(
        verbose_name=_("refresh token"),
        help_text=_("refresh token"),
        max_length=4096,
        null=True,
    )

    class Meta:
        db_table = "partaj_token"
        verbose_name = _("token")
