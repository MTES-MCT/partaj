"""
Referral report related API endpoints.
"""
from datetime import datetime

from django_fsm import TransitionNotAllowed
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralReportAttachmentSerializer, ReferralReportSerializer
from .permissions import NotAllowed


class UserIsReferralUnitMembership(BasePermission):
    """Permission to retrieve a ReferralReport through the API."""

    def has_permission(self, request, view):
        """
        Check if user is a referral unit member.
        """
        report = view.get_object()
        return (
            request.user.is_authenticated
            and report.referral.units.filter(members__id=request.user.id).exists()
        )


class UserIsLastVersionAuthor(BasePermission):
    """
    Permission class to authorize only last author report version to publish it
    """

    def has_permission(self, request, view):

        report = view.get_object()
        last_version = report.get_last_version()
        version = request.data.get("version")

        is_last_version_author = last_version.created_by.id == request.user.id
        is_last_version = str(last_version.id) == version
        return is_last_version and is_last_version_author


class ReferralReportViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral answers.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralReport.objects.all()
    serializer_class = ReferralReportSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action == "retrieve":
            permission_classes = [UserIsReferralUnitMembership]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    @action(
        detail=True,
        methods=["put"],
        permission_classes=[UserIsReferralUnitMembership],
    )
    # pylint: disable=invalid-name
    def initialize_publishing(self):
        """
        Initialize the version removing attachments and returns all fresh version and referral infos
        """
        report = self.get_object()

        for attachment in report.attachments:
            attachment.delete()

        return Response(
            status=201,
            data=ReferralReportSerializer(report).data,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMembership],
    )
    # pylint: disable=invalid-name
    def add_attachment(self, request, pk):
        """
        Add attachment to the report.
        """
        report = self.get_object()

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral report attachments cannot be created with more than one file."
                    ]
                },
            )

        try:
            file = request.FILES.getlist("files")[0]
        except IndexError:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral report attachments cannot be created without a file."
                    ]
                },
            )

        attachment = models.ReferralReportAttachment.objects.create(
            file=file, report=report
        )
        attachment.save()

        return Response(
            status=201,
            data=ReferralReportAttachmentSerializer(attachment).data,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMembership],
    )
    # pylint: disable=invalid-name
    def publish_report(self, request, pk):
        """
        Publish a referral report version and mark the referral as answered.
        """
        report = self.get_object()
        comment = request.data.get("comment")
        version_id = request.data.get("version")

        if report.referral.state == models.ReferralState.ANSWERED:
            return Response(
                status=403,
                data={
                    "errors": [
                        f"Referral {report.referral.id} is already in ANSWERED state"
                    ]
                },
            )

        last_version = report.get_last_version()
        if not last_version:
            return Response(
                status=404,
                data={
                    "errors": [
                        "Last version or version not found for "
                        f"referral {report.referral.id}"
                    ]
                },
            )

        if str(last_version.id) != version_id:
            return Response(
                status=403,
                data={
                    "errors": [
                        "Last version do not match to provided version for "
                        f"referral {report.referral.id}"
                    ]
                },
            )

        report.final_version = last_version
        report.comment = comment
        report.published_at = datetime.now()
        report.save()

        try:
            report.referral.publish_report(
                version=last_version,
                published_by=request.user,
            )
            report.referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": {
                        f"Transition PUBLISH_ANSWER not allowed from state {report.referral.state}."
                    }
                },
            )
        return Response(
            status=201,
            data=ReferralReportSerializer(report).data,
        )
