"""
Models for our core app.

Our main model is the referral model. Here we modelize what a Referral is in the first place
and provide other models it can depend on (eg users).
"""
import uuid

from django.db import models
from django.utils.translation import ugettext_lazy as _


class Referral(models.Model):
    URGENCY_1, URGENCY_2, URGENCY_3, URGENCY_4 = "u1", "u2", "u3", "u4"
    URGENCY_CHOICES = (
        (URGENCY_1, _("Relatively urgent — 2 weeks")),
        (URGENCY_2, _("Urgent — 1 week")),
        (URGENCY_3, _("Extremely urgent — 3 days")),
        (URGENCY_4, _("Absolute emergency — 24 hours")),
    )

    RECEIVED, PENDING, COMPLETE, DONE = ("received", "pending", "complete", "done")
    STATUS_CHOICES = (
        (RECEIVED, _("Received — awaiting treatment by receiver")),
        (PENDING, _("Pending — more information expected from requester")),
        (COMPLETE, _("Complete — referral in treatment")),
        (DONE, _("Done — referral was answered")),
    )

    # Generic fields to build up minimal data on any referral
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Referral requester identity. This is used in lieu of a user model for now.
    requester = models.CharField(
        verbose_name=_("requester"),
        help_text=_("Identity of the person and service requesting the referral"),
        max_length=500,
    )

    # Referral metadata: helpful to quickly sort through referrals
    subject = models.CharField(
        verbose_name=_("subject"),
        help_text=_(
            "Broad subject to help direct the referral to the appropriate office or expert"
        ),
        max_length=200,
    )
    urgency = models.CharField(
        verbose_name=_("urgency"),
        help_text=_("Urgency level. When do you need the referral?"),
        max_length=2,
        choices=URGENCY_CHOICES,
    )
    urgency_explanation = models.CharField(
        verbose_name="urgency explanation",
        help_text=_(
            "Why is this referral urgent? (not required for delays of 1 week or more)"
        ),
        max_length=200,
        blank=True,
    )
    status = models.CharField(
        verbose_name=_("referral status"),
        help_text=_("Current treatment status for this referral"),
        max_length=20,
        choices=STATUS_CHOICES,
        default=RECEIVED,
    )

    # Actual content of the referral request
    context = models.TextField(
        verbose_name=_("context"),
        help_text=_("Explain the facts and context leading to the referral"),
    )
    prior_work = models.TextField(
        verbose_name=_("prior work"),
        help_text=_("What research did you already perform before the referral?"),
    )

    class Meta:
        db_table = "partaj_referral"
        verbose_name = _("referral")
