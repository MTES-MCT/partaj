# pylint: disable=too-many-locals
"""
Referral message related API endpoints.
"""

from django.core.exceptions import ValidationError

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models, signals
from ..forms import ReferralMessageForm
from ..serializers import ReferralMessageSerializer
from ..services import ExtensionValidator, ServiceHandler
from ..services.factories.error_response import ErrorResponseFactory
from . import permissions


class UserIsFromUnitReferralRequesters(BasePermission):
    """
    Permission class to authorize users from requesters unit
    """

    def has_permission(self, request, view):
        referral = view.get_object()

        return referral.is_user_from_unit_referral_requesters(request.user)


class ReferralMessageViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral messages.
    """

    permission_classes = [permissions.NotAllowed]
    queryset = models.ReferralMessage.objects.all()
    serializer_class = ReferralMessageSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsUserFromUnitReferralRequesters
                | permissions.IsRequestReferralLinkedUser
                | permissions.IsRequestReferralLinkedUnitMember
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [
                permissions.IsLinkedReferralLinkedUser
                | permissions.IsLinkedReferralLinkedUnitMember
            ]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Create a new referral message as the client issues a POST on the referralmessages endpoint.
        """

        referral_id = request.data.get("referral")
        try:
            referral = models.Referral.objects.get(id=referral_id)
        except (models.Referral.DoesNotExist, ValidationError):
            return Response(
                status=400,
                data={"errors": [f"Referral {referral_id} does not exist."]},
            )

        form = ReferralMessageForm(
            {
                "content": request.data.get("content") or "",
                "referral": referral,
                "user": request.user,
            },
            request.FILES or None,
        )

        if not form.is_valid():
            return Response(status=400, data=form.errors)

        file_scanner = ServiceHandler().get_file_scanner_service()

        files = request.FILES.getlist("files")
        attachments = []

        for file in files:
            extension = ExtensionValidator.get_extension(file.name)

            if not ExtensionValidator.validate_format(extension):
                return ErrorResponseFactory.create_error_415(extension)

            scan_result = file_scanner.scan_file(file)
            if scan_result["status"] == models.ScanStatus.FOUND:
                return ErrorResponseFactory.create_error_file_scan_ko()

            referral_message_attachment = models.ReferralMessageAttachment(
                file=file, scan_id=scan_result["id"], scan_status=scan_result["status"]
            )
            attachments.append(referral_message_attachment)

        # Create the referral message from incoming data, and attachment instances for the files
        referral_message = form.save()
        for attachment in attachments:
            attachment.referral_message = referral_message
            attachment.save()

        signals.referral_message_created.send(
            sender="models.referral_message.create",
            referral=referral,
            referral_message=referral_message,
        )

        return Response(
            status=201, data=ReferralMessageSerializer(referral_message).data
        )

    def list(self, request, *args, **kwargs):
        """
        Return a list of referral messages. The list is always filtered by referral as there's
        no point in shuffling together messages that belong to different referrals.
        """

        queryset = self.get_queryset().filter(
            referral__id=request.query_params.get("referral")
        )

        page = self.paginate_queryset(queryset.order_by("created_at"))
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset.order_by("created_at"), many=True)
        return Response(serializer.data)
