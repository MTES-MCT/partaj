"""
Report event metadata class
"""
import uuid

from django.db import models as db_models
from django.db.models import SET_NULL
from django.utils.translation import gettext_lazy as _

from .unit import Unit, UnitMembershipRole


class EventMetadata(db_models.Model):
    """
    A validation request exists to link together a report event.
    It does not hold a date (like a `created_at`) to avoid duplication & confusion
    with the related event.
    """

    id = db_models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer validation request as uuid"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    receiver_role = db_models.CharField(
        verbose_name=_("receiver unit role"),
        max_length=200,
        choices=UnitMembershipRole.choices,
        help_text=_("unit role the event is targeted to"),
        blank=True,
        null=True,
    )

    sender_role = db_models.CharField(
        verbose_name=_("sender unit role"),
        max_length=200,
        choices=UnitMembershipRole.choices,
        help_text=_("unit role the event is from"),
        blank=True,
        null=True,
    )

    receiver_unit = db_models.ForeignKey(
        verbose_name=_("receiver unit"),
        help_text=_("Unit the event is targeted to"),
        to=Unit,
        on_delete=SET_NULL,
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "partaj_event_metadata"
        verbose_name = _("Event metadata")

    def __str__(self):
        """Get the string representation of this report event item."""
        return f"{self._meta.verbose_name.title()} #{self.id}"
