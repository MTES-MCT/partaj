"""
Referral attachment related API endpoints.
"""

from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralAttachmentSerializer, ReferralSerializer
from ..services import ExtensionValidator, ServiceHandler
from ..services.factories.error_response import ErrorResponseFactory
from .permissions import NotAllowed


class UserIsReferralRequester(BasePermission):
    """
    Permission class to authorize a referral's author on API routes and/or actions for
    objects with a relation to the referral they created.
    """

    def has_permission(self, request, view):

        referral = view.get_referral(request)
        return (
            request.user.is_authenticated
            and referral.users.filter(id=request.user.id).exists()
        )


class UserIsAttachmentReferralRequester(BasePermission):
    """
    Permission class to authorize a referral's author on API routes and/or actions for
    objects with a relation to the referral they created.
    """

    def has_permission(self, request, view):

        attachment = view.get_object()

        return (
            request.user.is_authenticated
            and attachment.referral.users.filter(id=request.user.id).exists()
        )


class ReferralAttachmentViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral attachments.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralAttachment.objects.all()
    serializer_class = ReferralAttachmentSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action in ["create", "retrieve"]:
            permission_classes = [UserIsReferralRequester]
        elif self.action in ["destroy"]:
            permission_classes = [UserIsAttachmentReferralRequester]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def get_referral(self, request):
        """
        Helper: get the related referral, return an error if it does not exist.
        """
        referral_id = request.data.get("referral") or request.query_params.get(
            "referral"
        )
        try:
            referral = models.Referral.objects.get(id=referral_id)
        except models.Referral.DoesNotExist as error:
            raise Http404(
                f"Referral {request.data.get('referral')} not found"
            ) from error

        return referral

    def create(self, request, *args, **kwargs):
        """
        Let users create new referral  attachment, processing the file itself along with
        its metadata to create a ReferralAttachment instance.
        """
        # Make sure the referral  exists and return an error otherwise.
        referral = self.get_referral(request)

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral attachments cannot be created with more than one file."
                    ]
                },
            )

        try:
            file = request.FILES.getlist("files")[0]
            extension = ExtensionValidator.get_extension(file.name)

            if not ExtensionValidator.validate_format(extension):
                return ErrorResponseFactory.create_error_415(extension)
        except IndexError:
            return Response(
                status=400,
                data={
                    "errors": ["Referral attachments cannot be created without a file."]
                },
            )

        file_scanner = ServiceHandler().get_file_scanner_service()
        scan_result = file_scanner.scan_file(file)

        if scan_result["status"] == models.ScanStatus.FOUND:
            return ErrorResponseFactory.create_error_file_scan_ko()

        attachment = models.ReferralAttachment.objects.create(
            file=file,
            referral=referral,
            scan_id=scan_result["id"],
            scan_status=scan_result["status"],
        )

        attachment.save()

        return Response(
            status=201,
            data=ReferralAttachmentSerializer(attachment).data,
        )

    # pylint: disable=invalid-name
    def destroy(self, request, *args, **kwargs):
        """
        Remove an attachment from this referral.
        """
        attachment = self.get_object()

        if attachment.referral.state != models.ReferralState.DRAFT:
            return Response(
                status=400,
                data={
                    "errors": [
                        "attachments cannot be removed from a non draft referral"
                    ]
                },
            )

        attachment.delete()
        attachment.referral.refresh_from_db()

        return Response(status=200, data=ReferralSerializer(attachment.referral).data)
