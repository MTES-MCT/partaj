import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralMessage(models.Model):
    """
    A message related to a referral, created by any stakeholder. Can be used
    to provide or request additional information in freeform text or with attachment
    files.
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
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral to which this message is related"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="messages",
    )
    user = models.ForeignKey(
        verbose_name=_("user"),
        help_text=_("User who created the referral message"),
        to=get_user_model(),
        on_delete=models.PROTECT,
        related_name="referral_messages",
    )

    # Actual content of the referral message. Attachments are linked from the foreign key
    # on the referral attachment object itself
    content = models.TextField(
        verbose_name=_("content"),
        help_text=_("Textual content of the referral message"),
    )

    class Meta:
        db_table = "partaj_referral_message"
        verbose_name = _("referral message")

    def __str__(self):
        """Get the string representation of a referral message."""
        return f"{self._meta.verbose_name.title()} #{self.id}"
