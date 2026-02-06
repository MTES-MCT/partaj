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
from ..models import ReportEventState, ReportEventVerb, ScanStatus
from ..services import ExtensionValidator, ServiceHandler
from ..services.factories import ReportEventFactory
from ..services.factories.error_response import ErrorResponseFactory
from ..services.factories.validation_tree_factory import ValidationTreeFactory
from .permissions import NotAllowed

from ..serializers import (  # isort:skip
    ReferralReportAppendixSerializer,
    ReferralRequestValidationSerializer,
)

# pylint: disable=broad-except
# pylint: disable=too-many-locals

User = get_user_model()


class CanUpdateAppendix(BasePermission):
    """
    Permission class to authorize a referral report appendix UPDATE
    Conditions :
    - User is authenticated
    - User is the appendix author
    - Appendix is the last one
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        appendix = view.get_object()

        return (
            request.user.is_authenticated
            and appendix.created_by.id == request.user.id
            and appendix.report.get_last_appendix().id == appendix.id
            and appendix.report.referral.state != models.ReferralState.ANSWERED
        )


class CanCreateAppendix(BasePermission):
    """
    Permission class to authorize a referral report appendix CREATE
    Conditions :
    - User is authenticated
    - User is referral's topic unit member
    - Referral is not published yet
    - Referral is not closed yet
    """

    def has_permission(self, request, view):
        report = view.get_referralreport(request)

        return (
            request.user.is_authenticated
            and report.referral.units.filter(members__id=request.user.id).exists()
            and report.referral.state != models.ReferralState.ANSWERED
            and report.referral.state != models.ReferralState.CLOSED
            and report
        )


class CanValidate(BasePermission):
    """
    Permission class to authorize a referral report appendix VALIDATION
    Conditions :
    - User is authenticated
    - User is referral's unit member as OWNER | ADMIN | SUPERADMIN role
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        appendix = view.get_object()
        referral = appendix.report.referral
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
    Permission class to authorize a referral report appendix REQUEST CHANGE
    Conditions :
    - User is authenticated
    - User is referral's unit member as OWNER | ADMIN | SUPERADMIN role
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        appendix = view.get_object()
        referral = appendix.report.referral
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
    Permission class to authorize a referral report appendix REQUEST CHANGE
    Conditions :
    - User is authenticated
    - User is referral's unit member, owner or admin
    - Referral is not published yet
    """

    def has_permission(self, request, view):
        appendix = view.get_object()
        referral = appendix.report.referral
        return (
            request.user.is_authenticated
            and referral.state != models.ReferralState.ANSWERED
            and models.UnitMembership.objects.filter(
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
        )


class CanGetValidator(BasePermission):
    """
    Permission class to authorize a referral report appendix REQUEST CHANGE
    Conditions :
    - User is authenticated
    - appendix is the last one
    - Report is not published
    - User is referral's unit member
    """

    def has_permission(self, request, view):
        appendix = view.get_object()
        referral = appendix.report.referral
        return (
            request.user.is_authenticated
            and referral.state != models.ReferralState.ANSWERED
            and models.UnitMembership.objects.filter(
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
        )


class UserIsAppendixAuthor(BasePermission):
    """
    Permission class to authorize only last author report appendix to publish it
    """

    def has_permission(self, request, view):
        appendix = view.get_object()

        return appendix.created_by.id == request.user.id


class ReferralReportAppendixViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral report appendixs.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralReportAppendix.objects.all()
    serializer_class = ReferralReportAppendixSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """

        if self.action == "create":
            permission_classes = [CanCreateAppendix]
        elif self.action == "update":
            permission_classes = [CanUpdateAppendix]
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
        Let users create new referral report appendix, processing the file itself along with
        its metadata to create a AppendixDocument instance.
        """

        # Make sure the report exists and return an error otherwise.
        report = self.get_referralreport(request)
        appendix_number = request.data.get("appendix_number")

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral appendix documents cannot be created with more than one file."
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
                        "Referral report appendix document cannot be created without a file."
                    ]
                },
            )
        file_scanner = ServiceHandler().get_file_scanner_service()
        scan_result = file_scanner.scan_file(file)
        if scan_result["status"] == ScanStatus.FOUND:
            return ErrorResponseFactory.create_error_file_scan_ko()

        document = models.AppendixDocument.objects.create(
            file=file, scan_id=scan_result["id"], scan_status=scan_result["status"]
        )

        appendix = models.ReferralReportAppendix.objects.create(
            report=report,
            created_by=request.user,
            document=document,
            appendix_number=appendix_number,
        )

        ReportEventFactory().create_appendix_added_event(request.user, appendix)

        report.referral.add_appendix(appendix)
        report.referral.save()

        return Response(
            status=201,
            data=ReferralReportAppendixSerializer(appendix).data,
        )

    def update(self, request, *args, **kwargs):
        """Update an existing appendix."""
        appendix = self.get_object()

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral appendix documents cannot be created with more than one file."
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
                        "Referral report appendix document cannot be created without a file."
                    ]
                },
            )

        file_scanner = ServiceHandler().get_file_scanner_service()
        scan_result = file_scanner.scan_file(file)

        if scan_result["status"] == ScanStatus.FOUND:
            return ErrorResponseFactory.create_error_file_scan_ko()

        appendix.document.update_file(
            file=file, scan_id=scan_result["id"], scan_status=scan_result["status"]
        )
        appendix.save()

        ReportEventFactory().update_appendix_event(request.user, appendix)

        return Response(
            status=200,
            data=ReferralReportAppendixSerializer(appendix).data,
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
        appendix = self.get_object()
        timestamp = datetime.datetime.now().timestamp()

        for index, selected_option in enumerate(selected_options):
            receiver_role = selected_option["role"]
            unit_name = selected_option["unit_name"]
            # Find all users with this unit name
            # Find all referral unit memberships with role and unit corresponding
            # to the selected option
            validators = []
            for unit in appendix.report.referral.units.all():
                validators = validators + [
                    membership.user
                    for membership in unit.get_memberships()
                    .filter(
                        role=receiver_role,
                        user__unit_name=unit_name,
                        is_validator=True,
                    )
                    .exclude(user__id=request.user.id)
                    .all()
                ]

            try:
                # All previous validation request for role and unit
                # has to be inactivated for appendix display
                appendix.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.APPENDIX_REQUEST_VALIDATION,
                    metadata__receiver_role=receiver_role,
                    metadata__receiver_unit_name=unit_name,
                ).update(state=ReportEventState.INACTIVE)

                event_comment = (
                    comment if (index + 1) == len(selected_options) else None
                )

                request_validation_event = (
                    ReportEventFactory().create_request_appendix_validation_event(
                        sender=request.user,
                        appendix=appendix,
                        receiver_role=receiver_role,
                        receiver_unit_name=unit_name,
                        comment=event_comment,
                        timestamp=timestamp,
                    )
                )

                for validator in list(set(validators)):
                    notification = Notification.objects.create(
                        notification_type=NotificationEvents.APPENDIX_REQUEST_VALIDATION,
                        notifier=request.user,
                        notified=validator,
                        preview=comment,
                        item_content_object=request_validation_event,
                    )
                    notification.notify(appendix.report.referral)
            except (IntegrityError, Exception) as error:
                for i in error.args:
                    capture_message(i)
                return Response(
                    status=400,
                    data={"errors": ["Cannot request validation."]},
                )

        appendix.report.referral.save()
        appendix.report.referral.refresh_from_db()

        return Response(
            data=ReferralRequestValidationSerializer(appendix.report.referral).data
        )

    @action(
        detail=True,
        permission_classes=[CanGetValidator],
    )
    # pylint: disable=invalid-name
    def get_validators(self, request, pk):
        """
        Appendix validators request
        """
        appendix = self.get_object()
        referral = appendix.report.referral
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
        appendix = self.get_object()
        comment = request.data.get("comment")

        try:
            with transaction.atomic():
                sender_role = appendix.report.referral.get_user_role(request.user)

                if not sender_role:
                    capture_message(
                        f"No role found for user {request.user.id} with referral"
                        f" {appendix.report.referral.id}",
                        "during appendix validation, aborting validation",
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
                # has to be inactivated for appendix display
                appendix.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb__in=[
                        ReportEventVerb.APPENDIX_REQUEST_CHANGE,
                        ReportEventVerb.APPENDIX_VALIDATED,
                    ],
                    metadata__sender_role=sender_role,
                    metadata__sender_unit_name=request.user.unit_name,
                ).update(state=ReportEventState.INACTIVE)

                # All previous validations and request change by the same user has to be
                # inactivated / canceled
                active_request_validation_query_set = appendix.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.APPENDIX_REQUEST_VALIDATION,
                    metadata__receiver_role=sender_role,
                )

                active_request_validation_event_authors = [
                    active_event.user
                    for active_event in active_request_validation_query_set.all()
                ]

                notified_users = list(
                    set(active_request_validation_event_authors + [appendix.created_by])
                )

                # All previous validation requests has to be also
                # inactivated / canceled
                active_request_validation_query_set.update(
                    state=ReportEventState.INACTIVE
                )

                request_change_event = (
                    ReportEventFactory().create_request_appendix_change_event(
                        sender=request.user,
                        role=sender_role,
                        appendix=appendix,
                        comment=comment,
                    )
                )
                appendix.report.referral.save()

                for notified_user in notified_users:
                    notification = Notification.objects.create(
                        notification_type=NotificationEvents.APPENDIX_REQUEST_CHANGE,
                        notifier=request.user,
                        notified=notified_user,
                        preview=comment,
                        item_content_object=request_change_event,
                    )
                    notification.notify(appendix.report.referral, appendix)

        except (IntegrityError, PermissionError, Exception) as error:
            for i in error.args:
                capture_message(i)

            return Response(
                status=400,
                data={"errors": ["Cannot request change."]},
            )

        return Response(data=ReferralReportAppendixSerializer(appendix).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[CanValidate],
    )
    # pylint: disable=invalid-name
    def validate(self, request, pk):
        """
        User report appendix validation with optional comments
        """
        appendix = self.get_object()
        comment = request.data.get("comment")

        try:
            with transaction.atomic():
                sender_role = appendix.report.referral.get_user_role(request.user)

                if not sender_role:
                    capture_message(
                        f"No role found for user {request.user.id} with referral"
                        f" {appendix.report.referral.id}",
                        "during appendix validation, aborting validation",
                    )

                # All previous validation request and request change for role and unit
                # has to be inactivated for appendix display
                appendix.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb__in=[
                        ReportEventVerb.APPENDIX_REQUEST_CHANGE,
                        ReportEventVerb.APPENDIX_VALIDATED,
                    ],
                    metadata__sender_role=sender_role,
                    metadata__sender_unit_name=request.user.unit_name,
                ).update(state=ReportEventState.INACTIVE)

                active_request_validation_query_set = appendix.events.filter(
                    state=ReportEventState.ACTIVE,
                    verb=ReportEventVerb.APPENDIX_REQUEST_VALIDATION,
                    metadata__receiver_role=sender_role,
                )

                active_request_validation_event_authors = [
                    active_event.user
                    for active_event in active_request_validation_query_set.all()
                ]

                notified_users = list(
                    set(active_request_validation_event_authors + [appendix.created_by])
                )

                active_request_validation_query_set.update(
                    state=ReportEventState.INACTIVE
                )

                # Finally create the new validation event
                validate_appendix_event = ReportEventFactory().validate_appendix_event(
                    sender=request.user,
                    role=sender_role,
                    appendix=appendix,
                    comment=comment,
                )
                appendix.report.referral.save()

                for notified_user in notified_users:
                    notification = Notification.objects.create(
                        notification_type=NotificationEvents.APPENDIX_VALIDATED,
                        notifier=request.user,
                        notified=notified_user,
                        preview=comment,
                        item_content_object=validate_appendix_event,
                    )
                    notification.notify(appendix.report.referral, appendix)

        except (IntegrityError, PermissionError, Exception) as error:
            for i in error.args:
                capture_message(i)
            return Response(
                status=400,
                data={"errors": ["Cannot validate appendix."]},
            )

        return Response(data=ReferralReportAppendixSerializer(appendix).data)
