"""
Referral report model in our core app.
"""
import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from .referral_report_version import ReferralReportVersion


class ReferralReportState(models.TextChoices):
    """
    Enum of possible values for the state field of the referral report state.
    """

    DRAFT = "draft", _("draft")
    PUBLISHED = "published", _("published")


class ReferralReport(models.Model):
    """
    A report created by the relevant unit for a given Referral.
    """

    # Generic fields to build up minimal data on any answer
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral report as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)
    published_at = models.DateTimeField(
        verbose_name=_("published at"), blank=True, null=True
    )

    # Publication state & instance links for answers
    state = models.CharField(
        verbose_name=_("state"),
        help_text=_("State of this referral answer"),
        max_length=50,
        choices=ReferralReportState.choices,
        default=ReferralReportState.DRAFT,
    )

    final_version = models.OneToOneField(
        ReferralReportVersion,
        verbose_name=_("final published version"),
        help_text=_("The published referral report version"),
        blank=True,
        null=True,
        on_delete=models.CASCADE,
    )

    comment = models.TextField(
        verbose_name=_("report comment"),
        help_text=_("Comment at report sending"),
        blank=True,
        null=True,
    )

    class Meta:
        db_table = "partaj_referral_report"
        verbose_name = _("referral report")

    def __str__(self):
        """Get the string representation of a referral report."""
        # pylint: disable=no-member
        return (
            f"{self._meta.verbose_name.title()} #{self.referral.id} — report {self.id}"
        )

    def is_last_author(self, user):
        """Check if current user is the last report version author"""
        last_version = self.get_last_version()
        if not last_version:
            return False
        return last_version.created_by.id == user.id

    def get_last_version(self):
        """Get the last created report version"""
        last_version = None

        for version in self.versions.iterator():
            if not last_version:
                last_version = version
                continue
            if version.created_at > last_version.created_at:
                last_version = version

        return last_version

    def get_last_version_by(self, user):
        """Get the last created report version created by user"""
        last_version = None

        for version in self.versions.iterator():
            if not last_version and version.created_by.id == user.id:
                last_version = version
                continue
            if (
                last_version
                and version.created_at > last_version.created_at
                and version.created_by.id == user.id
            ):
                last_version = version

        return last_version


class ReferralReportValidationRequest(models.Model):
    """
    A validation request exists to link together a report version
    and a user who was asked to validate it.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the referral report validation request as uuid"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    validators = models.ManyToManyField(
        verbose_name=_("validator"),
        help_text=_("Users who was asked to validate the related report"),
        to=get_user_model(),
        related_name="referral_report_validations",
    )

    asker = models.ForeignKey(
        verbose_name=_("asker"),
        help_text=_("User who asked for report validation"),
        to=get_user_model(),
        on_delete=models.CASCADE,
        related_name="referral_report_validation_requests",
        related_query_name="referral_report_validation_request",
    )

    report = models.ForeignKey(
        verbose_name=_("report"),
        help_text=_("Report the related user was asked to validate"),
        to=ReferralReport,
        on_delete=models.CASCADE,
        related_name="validation_requests",
        related_query_name="validation_request",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)

    class Meta:
        db_table = "partaj_referral_report_validation_request"
        verbose_name = _("referral report validation request")
