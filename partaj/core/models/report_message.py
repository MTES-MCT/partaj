"""
Report message model.
"""
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReportMessage(models.Model):
    """
    A message related to a report, created by any stakeholder. Can be used
    to provide or request additional information in freeform text.
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

    # Links to the related objects that define a message: the message author & referral
    report = models.ForeignKey(
        verbose_name=_("report"),
        help_text=_("Report to which this message is related"),
        to="ReferralReport",
        on_delete=models.CASCADE,
        related_name="messages",
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
    )

    class Meta:
        db_table = "partaj_report_message"
        verbose_name = _("report message")

    def __str__(self):
        """Get the string representation of a referral message."""
        return f"{self._meta.verbose_name.title()} #{self.id}"
