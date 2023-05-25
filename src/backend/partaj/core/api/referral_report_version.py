"""
Referral answer attachment related API endpoints.
"""
from django.db import IntegrityError, transaction
from django.http import Http404

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from sentry_sdk import capture_message

from partaj.core.models import Notification, NotificationEvents, UnitMembership

from .. import models
from ..models import ReportEventState, ReportEventVerb
from ..serializers import ReferralReportVersionSerializer
from ..services.factories import ReportEventFactory
from .permissions import NotAllowed

# pylint: disable=broad-except


class CanUpdateVersion(BasePermission):
    """
    Permission class to authorize a referral report version UPDATE
    Conditions :
    - User is authenticated
    - User is the version author
    - Version is the last one
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        version = view.get_object()

        return (
            request.user.is_authenticated
            and version.created_by.id == request.user.id
            and version.report.get_last_version().id == version.id
            and version.report.referral.state != models.ReferralState.ANSWERED
        )


class CanCreateVersion(BasePermission):
    """
    Permission class to authorize a referral report version CREATE
    Conditions :
    - User is authenticated
    - User is referral's topic unit member
    - User is not the last version author
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        report = view.get_referralreport(request)

        return (
            request.user.is_authenticated
            and not report.is_last_author(request.user)
            and report.referral.units.filter(members__id=request.user.id).exists()
            and report.referral.state != models.ReferralState.ANSWERED
        )


class CanValidate(BasePermission):
    """
    Permission class to authorize a referral report version VALIDATION
    Conditions :
    - User is authenticated
    - User is referral's unit member as OWNER or ADMIN role
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        version = view.get_object()
        referral = version.report.referral
        return (
            request.user.is_authenticated
            and referral.state != models.ReferralState.ANSWERED
            and models.UnitMembership.objects.filter(
                role__in=[
                    models.UnitMembershipRole.OWNER,
                    models.UnitMembershipRole.ADMIN,
                ],
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
        )


class CanRequestChange(BasePermission):
    """
    Permission class to authorize a referral report version REQUEST CHANGE
    Conditions :
    - User is authenticated
    - User is referral's unit member as OWNER or ADMIN role
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        version = view.get_object()
        referral = version.report.referral
        return (
            request.user.is_authenticated
            and referral.state != models.ReferralState.ANSWERED
            and models.UnitMembership.objects.filter(
                role__in=[
                    models.UnitMembershipRole.OWNER,
                    models.UnitMembershipRole.ADMIN,
                ],
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
        )


class CanRequestValidation(BasePermission):
    """
    Permission class to authorize a referral report version REQUEST CHANGE
    Conditions :
    - User is authenticated
    - User is referral's unit member, owner or admin
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        version = view.get_object()
        referral = version.report.referral
        return (
            request.user.is_authenticated
            and referral.state != models.ReferralState.ANSWERED
            and models.UnitMembership.objects.filter(
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
        )


class UserIsLastVersionAuthor(BasePermission):
    """
    Permission class to authorize only last author report version to publish it
    """

    def has_permission(self, request, view):
        version = view.get_object()
        last_version = version.report.get_last_version()

        return (
            last_version.created_by.id == request.user.id
        ) and last_version.id == version.id


class ReferralReportVersionViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral report versions.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralReportVersion.objects.all()
    serializer_class = ReferralReportVersionSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """

        if self.action == "create":
            permission_classes = [CanCreateVersion]
        elif self.action == "update":
            permission_classes = [CanUpdateVersion]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    @staticmethod
    def get_referralreport(request):
        """
        Helper: get the related referralreport, return an error if it does not exist.
        """
        report_id = request.data.get("report") or request.query_params.get("report")
        try:
            referralreport = models.ReferralReport.objects.get(id=report_id)
        except models.ReferralReport.DoesNotExist as error:
            raise Http404(
                f"ReferralReport {request.data.get('report')} not found"
            ) from error

        return referralreport

    def create(self, request, *args, **kwargs):
        """
        Let users create new referral report version, processing the file itself along with
        its metadata to create a VersionDocument instance.
        """

        # Make sure the report exists and return an error otherwise.
        report = self.get_referralreport(request)

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral version documents cannot be created with more than one file."
                    ]
                },
            )

        try:
            file = request.FILES.getlist("files")[0]
            if len(file.name) > 200:
                file.name = file.name[0:190] + "." + file.name.split(".")[-1]
        except IndexError:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral report version document cannot be created without a file."
                    ]
                },
            )

        document = models.VersionDocument.objects.create(
            file=file,
        )

        version = models.ReferralReportVersion.objects.create(
            report=report, created_by=request.user, document=document
        )

        ReportEventFactory().create_version_added_event(request.user, version)

        report.referral.add_version(version)
        report.referral.save()

        return Response(
            status=201,
            data=ReferralReportVersionSerializer(version).data,
        )

    def update(self, request, *args, **kwargs):
        """Update an existing version."""
        version = self.get_object()

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral version documents cannot be created with more than one file."
                    ]
                },
            )

        try:
            file = request.FILES.getlist("files")[0]
            if len(file.name) > 200:
                file.name = file.name[0:190] + "." + file.name.split(".")[-1]
        except IndexError:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral report version document cannot be created without a file."
                    ]
                },
            )
        version.document.update_file(file=file)

        ReportEventFactory().update_version_event(request.user, version)

        return Response(
            status=200,
            data=ReferralReportVersionSerializer(version).data,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[CanRequestValidation],
    )
    # pylint: disable=invalid-name
    def request_validation(self, request, pk):
        """
        User request validation to a referral user level
        """
        version = self.get_object()
        receiver_role = request.data.get("role")
        comment = request.data.get("comment")

        if not request.data.get("role"):
            return Response(
                status=400,
                data={"errors": "Validation request level must be provided"},
            )

        try:
            user_memberships = UnitMembership.objects.filter(
                unit__in=version.report.referral.units.all(), user=request.user
            ).all()

            # The requester is theoretically a MEMBER from a unique unit
            if len(user_memberships) > 1:
                capture_message(
                    f"User {request.user} is in more than one unit for request validation"
                    f" in referral{version.report.referral.id}, we should consider this use case",
                    "warning",
                )

            user_unit = user_memberships[0].unit
            validators = []

            request_validation_event = (
                ReportEventFactory().create_request_validation_event(
                    sender=request.user,
                    version=version,
                    receiver_unit=user_unit,
                    receiver_role=receiver_role,
                    comment=comment,
                )
            )

            validators = validators + [
                membership.user
                for membership in user_unit.get_memberships().filter(role=receiver_role)
            ]

            for validator in validators:
                Notification.objects.create(
                    notification_type=NotificationEvents.VERSION_REQUEST_VALIDATION,
                    notifier=request.user,
                    notified=validator,
                    preview=comment,
                    item_content_object=request_validation_event,
                )
        except (IntegrityError, Exception) as error:
            capture_message(error)
            return Response(
                status=400,
                data={"errors": ["Cannot request validation."]},
            )

        return Response(data=ReferralReportVersionSerializer(version).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[CanRequestChange],
    )
    # pylint: disable=invalid-name
    def request_change(self, request, pk):
        """
        User request validation to a referral user level
        """
        version = self.get_object()
        comment = request.data.get("comment")

        try:
            with transaction.atomic():
                request_change_event = ReportEventFactory().create_request_change_event(
                    sender=request.user, version=version, comment=comment
                )

                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.REQUEST_VALIDATION,
                    metadata__receiver_role=request_change_event.metadata.sender_role,
                ).update(state=ReportEventState.INACTIVE)

                # All previous validations by the same user has to be
                # inactivated / canceled
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.VERSION_VALIDATED,
                    user=request.user,
                ).update(state=ReportEventState.INACTIVE)

                for assignee in version.report.referral.assignees.all():
                    Notification.objects.create(
                        notification_type=NotificationEvents.VERSION_REQUEST_CHANGE,
                        notifier=request.user,
                        notified=assignee,
                        preview=comment,
                        item_content_object=request_change_event,
                    )

        except (IntegrityError, Exception) as error:
            capture_message(error)
            return Response(
                status=400,
                data={"errors": ["Cannot request change."]},
            )

        return Response(data=ReferralReportVersionSerializer(version).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[CanValidate],
    )
    # pylint: disable=invalid-name
    def validate(self, request, pk):
        """
        User report version validation with optional comments
        """
        version = self.get_object()
        comment = request.data.get("comment")

        try:
            with transaction.atomic():
                validate_version_event = ReportEventFactory().validate_version_event(
                    sender=request.user, version=version, comment=comment
                )

                # All previous validation request for role
                # has to be inactivated for version display
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.REQUEST_VALIDATION,
                    metadata__receiver_role=validate_version_event.metadata.sender_role,
                ).update(state=ReportEventState.INACTIVE)

                # All previous request changes by the same user has to be
                # inactivated / canceled
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.REQUEST_CHANGE,
                    user=request.user,
                ).update(state=ReportEventState.INACTIVE)

                for assignee in version.report.referral.assignees.all():
                    Notification.objects.create(
                        notification_type=NotificationEvents.VERSION_REQUEST_CHANGE,
                        notifier=request.user,
                        notified=assignee,
                        preview=comment,
                        item_content_object=validate_version_event,
                    )

        except (IntegrityError, Exception) as error:
            capture_message(error)
            return Response(
                status=400,
                data={"errors": ["Cannot validate version."]},
            )

        return Response(data=ReferralReportVersionSerializer(version).data)
