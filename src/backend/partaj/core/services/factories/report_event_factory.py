"""
NoteFactory handling Note creation from provided data
"""
from sentry_sdk import capture_message

from partaj.core.models import (
    EventMetadata,
    ReportEvent,
    ReportEventState,
    ReportEventVerb,
    UnitMembership,
)


class ReportEventFactory:
    """ReportEventFactory class"""

    # pylint: disable=too-many-arguments
    @classmethod
    def create_request_validation_event(
        cls,
        sender,
        version,
        receiver_unit,
        receiver_role,
        comment=None,
    ):
        """
        Create and save ReportEvent based on provided data
        """

        event_metadata = EventMetadata.objects.create(
            receiver_role=receiver_role, receiver_unit=receiver_unit
        )

        request_validation_event = ReportEvent.objects.create(
            report=version.report,
            version=version,
            user=sender,
            content=comment,
            verb=ReportEventVerb.REQUEST_VALIDATION,
            metadata=event_metadata,
        )

        return request_validation_event

    @classmethod
    def create_request_change_event(cls, sender, version, comment=None):
        """
        Create and save ReportEvent based on provided data
        """

        # We consider that the role of the validator in the different units of the referral
        # will always be the same for the moment, so we take the last.

        sender_unit_roles = [
            membership.role
            for membership in UnitMembership.objects.filter(
                unit__in=version.report.referral.units.all(),
                user=sender,
            ).all()
        ]

        unique_roles = list(set(sender_unit_roles))
        if len(unique_roles) > 1:
            capture_message(
                f"User {sender.name} has two different roles for referral "
                f"{version.report.referral.id}, please consider to change use cases",
                "warning",
            )

        if len(unique_roles) == 0:
            raise PermissionError(
                f"User {sender.name} has no unit role for referral "
                f"{version.report.referral.id}, can't request change"
            )

        sender_unit_role = sender_unit_roles[0]

        event_metadata = EventMetadata.objects.create(
            sender_role=sender_unit_role,
        )

        request_change_event = ReportEvent.objects.create(
            report=version.report,
            version=version,
            user=sender,
            content=comment,
            verb=ReportEventVerb.REQUEST_CHANGE,
            metadata=event_metadata,
        )

        return request_change_event

    @classmethod
    def create_version_added_event(cls, user, version, comment=None):
        """
        Create and save ReportEvent based on provided data
        """
        event = ReportEvent.objects.create(
            report=version.report,
            version=version,
            user=user,
            verb=ReportEventVerb.VERSION_ADDED,
            content=comment,
            state=ReportEventState.INACTIVE,
        )

        return event

    @classmethod
    def create_message_added_event(cls, user, report, comment=None):
        """
        Create and save ReportEvent based on provided data
        """
        event = ReportEvent.objects.create(
            content=comment,
            verb=ReportEventVerb.MESSAGE,
            user=user,
            report=report,
            state=ReportEventState.INACTIVE,
        )

        return event

    @classmethod
    def validate_version_event(cls, sender, version, comment=None):
        """
        Create and save ReportEvent based on provided data
        """
        sender_unit_roles = [
            membership.role
            for membership in UnitMembership.objects.filter(
                unit__in=version.report.referral.units.all(),
                user=sender,
            ).all()
        ]

        unique_roles = list(set(sender_unit_roles))
        if len(unique_roles) > 1:
            capture_message(
                f"User {sender.name} has two different roles for referral "
                f"{version.report.referral.id}, please consider to change use cases",
                "warning",
            )

        if len(unique_roles) == 0:
            raise PermissionError(
                f"User {sender.name} has no unit role for referral "
                f"{version.report.referral.id}, can't request change"
            )

        sender_unit_role = sender_unit_roles[0]
        event_metadata = EventMetadata.objects.create(
            sender_role=sender_unit_role,
        )

        validate_version_event = ReportEvent.objects.create(
            report=version.report,
            version=version,
            user=sender,
            verb=ReportEventVerb.VERSION_VALIDATED,
            content=comment,
            metadata=event_metadata,
        )

        return validate_version_event

    @classmethod
    def update_version_event(cls, user, version):
        """
        Create and save ReportEvent based on provided data
        """
        event = ReportEvent.objects.create(
            report=version.report,
            version=version,
            user=user,
            verb=ReportEventVerb.VERSION_UPDATED,
            state=ReportEventState.INACTIVE,
        )

        return event
