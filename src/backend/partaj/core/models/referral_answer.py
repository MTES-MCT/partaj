"""
Referral urgency model in our core app.
"""
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralAnswerState(models.TextChoices):
    """
    Enum of possible values for the state field of the referral answer state.
    """

    DRAFT = "draft", _("draft")
    PUBLISHED = "published", _("published")


class ReferralAnswer(models.Model):
    """
    An answer created by the relevant unit for a given Referral.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)

    # Publication state & instance links for answers
    state = models.CharField(
        verbose_name=_("state"),
        help_text=_("State of this referral answer"),
        max_length=50,
        choices=ReferralAnswerState.choices,
        # Note: PUBLISHED is used as a default to facilitate migration, as all existing answers
        # were published, there were no drafts.
        default=ReferralAnswerState.PUBLISHED,
    )
    published_answer = models.OneToOneField(
        verbose_name=_("published answer"),
        help_text=_(
            "published answer corresponding to this one, if it is a draft answer"
        ),
        to="self",
        on_delete=models.CASCADE,
        related_name="draft_answer",
        blank=True,
        null=True,
    )

    # Related objects: what referral are we answering, and who is doing it
    referral = models.ForeignKey(
        verbose_name=_("referral"),
        help_text=_("Referral the answer is linked with"),
        to="Referral",
        on_delete=models.CASCADE,
        related_name="answers",
    )
    created_by = models.ForeignKey(
        verbose_name=_("created by"),
        help_text=_("User who created the answer"),
        to=get_user_model(),
        on_delete=models.SET_NULL,
        related_name="+",
        blank=True,
        null=True,
    )

    # The actual answer, starting with a simple text field
    content = models.TextField(
        verbose_name=_("content"),
        help_text=_("Actual content of the answer to the referral"),
    )

    class Meta:
        db_table = "partaj_referral_answer"
        verbose_name = _("referral answer")

    def __str__(self):
        """Get the string representation of a referral answer."""
        # pylint: disable=no-member
        return (
            f"{self._meta.verbose_name.title()} #{self.referral.id} — answer {self.id}"
        )


class ReferralAnswerValidationRequest(models.Model):
    """
    A validation request exists to link together an answer and a user who was asked to validate it.
    It does not hold a date (like a `created_at`) to avoid duplication & confusion with the related
    activity.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer validation request as uuid"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    validator = models.ForeignKey(
        verbose_name=_("validator"),
        help_text=_("User who was asked to validate the related answer"),
        to=get_user_model(),
        on_delete=models.CASCADE,
        related_name="referral_answer_validation_requests",
        related_query_name="referral_answer_validation_request",
    )
    answer = models.ForeignKey(
        verbose_name=_("answer"),
        help_text=_("Answer the related user was asked to validate"),
        to=ReferralAnswer,
        on_delete=models.CASCADE,
        related_name="validation_requests",
        related_query_name="validation_request",
    )

    class Meta:
        db_table = "partaj_referral_answer_validation_request"
        unique_together = [["answer", "validator"]]
        verbose_name = _("referral answer validation request")


class ReferralAnswerValidationResponseState(models.TextChoices):
    """
    Enum of possible states for a referral answer validation response state field.
    """

    NOT_VALIDATED = "not_validated", _("not validated")
    PENDING = "pending", _("pending")
    VALIDATED = "validated", _("validated")


class ReferralAnswerValidationResponse(models.Model):
    """
    A validation response is used to keep more information about the validation beyond the request:
    it holds a state (was the validation given or not), and a comment that can give some context
    to the the validation requester.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral answer validation response as uuid"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    validation_request = models.OneToOneField(
        verbose_name=_("validation request"),
        help_text=_(
            "Validation request for which this response is providing an answer"
        ),
        to=ReferralAnswerValidationRequest,
        on_delete=models.CASCADE,
        related_name="response",
    )
    state = models.CharField(
        verbose_name=_("state"),
        help_text=_("State of the validation"),
        max_length=20,
        choices=ReferralAnswerValidationResponseState.choices,
    )
    comment = models.TextField(
        verbose_name=_("comment"),
        help_text=_("Comment associated with the validation acceptance or refusal"),
    )

    class Meta:
        db_table = "partaj_referral_answer_validation_response"
        verbose_name = _("referral answer validation response")
