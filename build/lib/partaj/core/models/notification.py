"""
Generic notification model in our core app.
"""
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from ..email import Mailer


class NotificationTypes(models.TextChoices):
    """
    Enum of possible values for the notification type.
    """

    REFERRAL_MESSAGE = "REFERRAL_MESSAGE"
    REPORT_MESSAGE = "REPORT_MESSAGE_NOTIFICATION"
    REFERRAL_REQUESTER_ADDED = "REFERRAL_REQUESTER_ADDED"
    REFERRAL_UNIT_MEMBER_ASSIGNED = "REFERRAL_UNIT_MEMBER_ASSIGNED"
    REFERRAL_UNIT_ASSIGNED = "REFERRAL_UNIT_ASSIGNED"
    REFERRAL_UNIT_UNASSIGNED = "REFERRAL_UNIT_UNASSIGNED"
    REFERRAL_URGENCY_LEVEL_CHANGED = "REFERRAL_URGENCY_LEVEL_CHANGED"
    REFERRAL_CLOSED = "REFERRAL_CLOSED"
    REPORT_VERSION_ADDED = "REPORT_VERSION_ADDED"
    REFERRAL_ANSWER_VALIDATION_PERFORMED = "REFERRAL_ANSWER_VALIDATION_PERFORMED"
    REFERRAL_ANSWER_PUBLISHED = "REFERRAL_ANSWER_PUBLISHED"
    REFERRAL_REQUESTER_DELETED = "REFERRAL_REQUESTER_DELETED"
    REFERRAL_UNIT_MEMBER_UNASSIGNED = "REFERRAL_UNIT_MEMBER_UNASSIGNED"
    REFERRAL_ANSWER_VALIDATION_REQUESTED = "REFERRAL_ANSWER_VALIDATION_REQUESTED"
    REFERRAL_SENT = "REFERRAL_SENT"
    REPORT_PUBLISHED = "REPORT_PUBLISHED"


class NotificationStatus(models.TextChoices):
    """
    Enum of possible values for the notification status.
    """

    ACTIVE = "A"
    INACTIVE = "I"


class Notification(models.Model):
    """
    Notification to send to users with different use case
    """

    # Generic fields to build up minimal data on any membership
    id = models.AutoField(
        verbose_name=_("id"),
        help_text=_("Primary key for the notification"),
        primary_key=True,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    notification_type = models.CharField(
        max_length=48, choices=NotificationTypes.choices
    )
    status = models.CharField(
        max_length=1,
        choices=NotificationStatus.choices,
        default=NotificationStatus.ACTIVE,
    )
    notifier = models.ForeignKey(
        verbose_name=_("notifier"),
        help_text=_("User who generated this notification"),
        related_name="sent_notifications",
        to=get_user_model(),
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    notified = models.ForeignKey(
        verbose_name=_("notified"),
        help_text=_("User who is notified by this notification"),
        to=get_user_model(),
        related_name="received_notifications",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    preview = models.TextField(
        verbose_name=_("preview"),
        help_text=_("Text content to display into the notification"),
        blank=True,
        null=True,
    )

    # The item is the object related to the activity being represented. It can be for example
    # a referral assignment, an answer or any other type of event that materializes the event
    # described by the activity.
    # As it can be any kind of object, we're using a generic relation to link it to the activity.
    item_content_type = models.ForeignKey(
        verbose_name=_("item content type"),
        help_text=_("Model for the linked item"),
        to=ContentType,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    item_object_id = models.CharField(
        verbose_name=_("item object id"),
        help_text=_("ID of the linked item"),
        max_length=255,
        blank=True,
    )
    item_content_object = GenericForeignKey("item_content_type", "item_object_id")

    class Meta:
        db_table = "partaj_notification"
        verbose_name = _("notification")

    def notify(self, referral):
        """Method to send notification by mail"""
        if self.notification_type == NotificationTypes.REPORT_MESSAGE:
            Mailer.send_report_notification(referral=referral, notification=self)
