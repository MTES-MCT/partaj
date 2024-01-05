"""
Referral answer attachment related API endpoints.
"""
import datetime

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.http import Http404

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from sentry_sdk import capture_message

from partaj.core.models import Notification, NotificationEvents

from .. import models
from ..models import ReportEventState, ReportEventVerb
from ..serializers import ReferralReportVersionSerializer
from ..services import ExtensionValidator
from ..services.factories import ReportEventFactory
from ..services.factories.error_response import ErrorResponseFactory
from ..services.factories.validation_tree_factory import ValidationTreeFactory
from .permissions import NotAllowed

# pylint: disable=broad-except
# pylint: disable=too-many-locals

User = get_user_model()


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
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        report = view.get_referralreport(request)

        return (
            request.user.is_authenticated
            and report.referral.units.filter(members__id=request.user.id).exists()
            and report.referral.state != models.ReferralState.ANSWERED
        )


class CanValidate(BasePermission):
    """
    Permission class to authorize a referral report version VALIDATION
    Conditions :
    - User is authenticated
    - User is referral's unit member as OWNER | ADMIN | SUPERADMIN role
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
                    models.UnitMembershipRole.SUPERADMIN,
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
    - User is referral's unit member as OWNER | ADMIN | SUPERADMIN role
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
                    models.UnitMembershipRole.SUPERADMIN,
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
            and version.report.get_last_version().id == version.id
            and referral.state != models.ReferralState.ANSWERED
            and models.UnitMembership.objects.filter(
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
        )


class CanGetValidator(BasePermission):
    """
    Permission class to authorize a referral report version REQUEST CHANGE
    Conditions :
    - User is authenticated
    - Version is the last one
    - Report is not published
    - User is referral's unit member
    """

    def has_permission(self, request, view):
        version = view.get_object()
        referral = version.report.referral
        return (
            request.user.is_authenticated
            and version.report.get_last_version().id == version.id
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
        version_number = request.data.get("version_number")

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
            extension = ExtensionValidator.get_extension(file.name)

            if not ExtensionValidator.validate_format(extension):
                return ErrorResponseFactory.create_error_415(extension)

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
            report=report,
            created_by=request.user,
            document=document,
            version_number=version_number,
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
            extension = ExtensionValidator.get_extension(file.name)

            if not ExtensionValidator.validate_format(extension):
                return ErrorResponseFactory.create_error_415(extension)

            if len(file.name) > 200:
                file.name = file.name[0:190] + "." + extension
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
        version.save()

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
        selected_options = request.data.get("selected_options")
        comment = request.data.get("comment")
        version = self.get_object()
        timestamp = datetime.datetime.now().timestamp()

        for index, selected_option in enumerate(selected_options):
            receiver_role = selected_option["role"]
            unit_name = selected_option["unit_name"]
            # Find all users with this unit name
            # Find all referral unit memberships with role and unit corresponding
            # to the selected option
            validators = []
            for unit in version.report.referral.units.all():
                validators = validators + [
                    membership.user
                    for membership in unit.get_memberships()
                    .filter(
                        role=receiver_role,
                        user__unit_name=unit_name,
                    )
                    .exclude(user__id=request.user.id)
                    .all()
                ]

            try:
                # All previous validation request for role and unit
                # has to be inactivated for version display
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.REQUEST_VALIDATION,
                    metadata__receiver_role=receiver_role,
                    metadata__receiver_unit_name=unit_name,
                ).update(state=ReportEventState.INACTIVE)

                event_comment = (
                    comment if (index + 1) == len(selected_options) else None
                )

                request_validation_event = (
                    ReportEventFactory().create_request_validation_event(
                        sender=request.user,
                        version=version,
                        receiver_role=receiver_role,
                        receiver_unit_name=unit_name,
                        comment=event_comment,
                        timestamp=timestamp,
                    )
                )

                version.report.referral.ask_for_validation()

                for validator in list(set(validators)):
                    notification = Notification.objects.create(
                        notification_type=NotificationEvents.VERSION_REQUEST_VALIDATION,
                        notifier=request.user,
                        notified=validator,
                        preview=comment,
                        item_content_object=request_validation_event,
                    )
                    notification.notify(version.report.referral)
            except (IntegrityError, Exception) as error:
                for i in error.args:
                    capture_message(i)
                return Response(
                    status=400,
                    data={"errors": ["Cannot request validation."]},
                )

        version.report.referral.save()

        return Response(data=ReferralReportVersionSerializer(version).data)

    @action(
        detail=True,
        permission_classes=[CanGetValidator],
    )
    # pylint: disable=invalid-name
    def get_validators(self, request, pk):
        """
        Version validators request
        """
        version = self.get_object()
        referral = version.report.referral
        referral.refresh_from_db()

        validation_tree = ValidationTreeFactory.create_from_referral(
            referral, request.user
        )

        return Response(data=validation_tree.tree)

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
                sender_role = version.report.referral.get_user_role(request.user)

                if not sender_role:
                    capture_message(
                        f"No role found for user {request.user.id} with referral"
                        f" {version.report.referral.id}",
                        "during version validation, aborting validation",
                    )

                    return Response(
                        status=400,
                        data={
                            "errors": [
                                "No role found for requester, cannot request change."
                            ]
                        },
                    )

                # All previous validation request and request change for role and unit
                # has to be inactivated for version display
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb__in=[
                        ReportEventVerb.REQUEST_CHANGE,
                        ReportEventVerb.VERSION_VALIDATED,
                    ],
                    metadata__sender_role=sender_role,
                    metadata__sender_unit_name=request.user.unit_name,
                ).update(state=ReportEventState.INACTIVE)

                # All previous validations and request change by the same user has to be
                # inactivated / canceled
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.REQUEST_VALIDATION,
                    metadata__receiver_role=sender_role,
                ).update(state=ReportEventState.INACTIVE)

                request_change_event = ReportEventFactory().create_request_change_event(
                    sender=request.user,
                    role=sender_role,
                    version=version,
                    comment=comment,
                )
                version.report.referral.save()
                notification = Notification.objects.create(
                    notification_type=NotificationEvents.VERSION_REQUEST_CHANGE,
                    notifier=request.user,
                    notified=version.created_by,
                    preview=comment,
                    item_content_object=request_change_event,
                )
                notification.notify(version.report.referral, version)

        except (IntegrityError, PermissionError, Exception) as error:
            for i in error.args:
                capture_message(i)

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
                sender_role = version.report.referral.get_user_role(request.user)

                if not sender_role:
                    capture_message(
                        f"No role found for user {request.user.id} with referral"
                        f" {version.report.referral.id}",
                        "during version validation, aborting validation",
                    )

                # All previous validation request and request change for role and unit
                # has to be inactivated for version display
                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb__in=[
                        ReportEventVerb.REQUEST_CHANGE,
                        ReportEventVerb.VERSION_VALIDATED,
                    ],
                    metadata__sender_role=sender_role,
                    metadata__sender_unit_name=request.user.unit_name,
                ).update(state=ReportEventState.INACTIVE)

                version.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.REQUEST_VALIDATION,
                    metadata__receiver_role=sender_role,
                ).update(state=ReportEventState.INACTIVE)

                # Finally create the new validation event
                validate_version_event = ReportEventFactory().validate_version_event(
                    sender=request.user,
                    role=sender_role,
                    version=version,
                    comment=comment,
                )
                version.report.referral.save()

                for assignee in version.report.referral.assignees.all():
                    notification = Notification.objects.create(
                        notification_type=NotificationEvents.VERSION_VALIDATED,
                        notifier=request.user,
                        notified=assignee,
                        preview=comment,
                        item_content_object=validate_version_event,
                    )
                    notification.notify(version.report.referral, version)

        except (IntegrityError, PermissionError, Exception) as error:
            for i in error.args:
                print(i)
                capture_message(i)
            return Response(
                status=400,
                data={"errors": ["Cannot validate version."]},
            )

        return Response(data=ReferralReportVersionSerializer(version).data)
