from django.db import models
from django.utils.translation import gettext_lazy as _

from .referral import Referral


class ReminderType(models.TextChoices):
    DRAFT_REMINDER = "draft_reminder", "Draft reminder"


class ReferralReminder(models.Model):
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    type = models.CharField(
        max_length=50,
        choices=ReminderType.choices,
    )
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "partaj_referral_reminder"
        unique_together = ("referral", "type")
        verbose_name = _("referral reminder")
