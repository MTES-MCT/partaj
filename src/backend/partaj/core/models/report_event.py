"""
Report message model.
"""
import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from .notification import Notification
from .report_event_metadata import EventMetadata


class ReportEventVerb(models.TextChoices):
    """
    Enum listing all possible kinds of report events.
    """

    MESSAGE = "message", _("report message")
    REQUEST_VALIDATION = "request_validation", _("report validation request")
    REQUEST_CHANGE = "request_change", _("report change request")
    APPENDIX_REQUEST_VALIDATION = "appendix_request_validation", _(
        "appendix report validation request"
    )
    APPENDIX_REQUEST_CHANGE = "appendix_request_change", _(
        "appendix report change request"
    )
    VERSION_ADDED = "version_added", _("report version added")
    VERSION_UPDATED = "version_updated", _("report version updated")
    VERSION_VALIDATED = "version_validated", _("report version validated")
    APPENDIX_ADDED = "appendix_added", _("report appendix added")
    APPENDIX_UPDATED = "appendix_updated", _("report appendix updated")
    APPENDIX_VALIDATED = "appendix_validated", _("report appendix validated")


class ReportEventState(models.TextChoices):
    """
    Enum listing all possible state of report event.
    """

    ACTIVE = "active", _("active event")
    OBSOLETE = "obsolete", _("obsolete event")
    INACTIVE = "inactive", _("inactive event")


class ReportEventType(models.TextChoices):
    """
    Enum listing all possible event type.
    """

    VERSION = "version", _("version event")
    APPENDIX = "appendix", _("appendix event")


class ReportEvent(models.Model):
    """
    An activity related to a report, created by any unit member.
    """

    # Generic fields to build up minimal data on any message
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral message as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    type = models.CharField(
        verbose_name=_("type"),
        help_text=_("Event type"),
        max_length=50,
        default=ReportEventType.VERSION,
        choices=ReportEventType.choices,
    )

    # Links to the related objects that define a message: the message author & referral
    report = models.ForeignKey(
        verbose_name=_("report"),
        help_text=_("Report to which this event is related"),
        to="ReferralReport",
        on_delete=models.CASCADE,
        related_name="messages",
    )

    metadata = models.OneToOneField(
        EventMetadata,
        verbose_name=_("Event metadata"),
        help_text=_("Additional event info"),
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    version = models.ForeignKey(
        verbose_name=_("version"),
        help_text=_("Report version to which this event is related"),
        to="ReferralReportVersion",
        on_delete=models.SET_NULL,
        related_name="events",
        null=True,
        blank=True,
    )

    appendix = models.ForeignKey(
        verbose_name=_("appendix"),
        help_text=_("Report appendix to which this event is related"),
        to="ReferralReportAppendix",
        on_delete=models.SET_NULL,
        related_name="events",
        null=True,
        blank=True,
    )

    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("User who created the referral message"),
        to=get_user_model(),
        on_delete=models.PROTECT,
        related_name="report_messages",
    )

    # Actual content of the report message.
    content = models.TextField(
        verbose_name=_("content"),
        help_text=_("Textual content of the report message"),
        null=True,
        blank=True,
    )

    notifications = GenericRelation(
        Notification,
        content_type_field="item_content_type",
        object_id_field="item_object_id",
    )

    verb = models.CharField(
        verbose_name=_("verb"),
        help_text=_("Verb expressing the action this activity represents"),
        max_length=50,
        default=ReportEventVerb.MESSAGE,
        choices=ReportEventVerb.choices,
    )

    state = models.CharField(
        verbose_name=_("state"),
        help_text=_("Event state for display purpose"),
        max_length=50,
        default=ReportEventState.ACTIVE,
        choices=ReportEventState.choices,
    )

    timestamp = models.IntegerField(
        verbose_name=_("timestamp"),
        help_text=_("Timestamp used to fuse event at display"),
        unique=False,
        null=True,
    )

    # The item is the object related to the activity being represented. It can be for example
    # a validation request assignment, an added version or any other type of event
    # that materializes the event described by the activity.
    # As it can be any kind of object, we're using a generic relation to link it to the activity.
    item_content_type = models.ForeignKey(
        verbose_name=_("item content type"),
        help_text=_("Model for the linked item"),
        to=ContentType,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )

    item_object_id = models.CharField(
        verbose_name=_("item object id"),
        help_text=_("ID of the linked item"),
        max_length=255,
        null=True,
        blank=True,
    )
    item_content_object = GenericForeignKey("item_content_type", "item_object_id")

    is_granted_user_notified = False

    class Meta:
        db_table = "partaj_report_message"
        verbose_name = _("report activity")

    def __str__(self):
        """Get the string representation of a referral message."""
        return f"{self._meta.verbose_name.title()} #{self.id}"
