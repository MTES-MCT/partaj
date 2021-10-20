"""
Referral activity & related models. Keeps a track of actions taken by users on
referrals in an easy-to-consume way.
"""
import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralActivityVerb(models.TextChoices):
    """
    Enum listing all possible kinds of referral activities.
    """

    ASSIGNED = "assigned", _("assigned")
    ASSIGNED_UNIT = "assigned_unit", _("assigned unit")
    ANSWERED = "answered", _("answered")
    DRAFT_ANSWERED = "draft_answered", _("draft answered")
    CREATED = "created", _("created")
    UNASSIGNED = "unassigned", _("unassigned")
    UNASSIGNED_UNIT = "unassigned_unit", _("unassigned unit")
    VALIDATED = "validated", _("validated")
    VALIDATION_DENIED = "validation_denied", _("validation denied")
    VALIDATION_REQUESTED = "validation_requested", _("validation requested")
    URGENCYLEVEL_CHANGED = "urgencylevel_changed", _("urgency level changed")
    CLOSED = "closed", _("closed")


class ReferralActivity(models.Model):
    """
    Keep track of all the activity that happens around a referral. This enables us to build a
    timeline of what everyone does on a referral.
    """

    # Generic fields to build up minimal data on any activity
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral activity as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    actor = models.ForeignKey(
        verbose_name=_("actor"),
        help_text=_("User who generated this activity"),
        to=get_user_model(),
        on_delete=models.SET_NULL,
        related_name="referral_activity",
        related_query_name="referral_activity",
        blank=True,
        null=True,
    )
    verb = models.CharField(
        verbose_name=_("verb"),
        help_text=_("Verb expressing the action this activity represents"),
        max_length=50,
        choices=ReferralActivityVerb.choices,
    )
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral on which the activity took place"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="activity",
        related_query_name="activity",
    )

    message = models.TextField(
        verbose_name=_("message"),
        help_text=_(
            "message field for activity verbs that do not have a linked object"
        ),
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
        on_delete=models.CASCADE,
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
        db_table = "partaj_referral_activity"
        verbose_name = _("referral activity")

    def __str__(self):
        """Get the string representation of a referral activity."""
        # pylint: disable=no-member
        return f"{self._meta.verbose_name.title()} #{self.referral.id} — {self.verb} {self.id}"
