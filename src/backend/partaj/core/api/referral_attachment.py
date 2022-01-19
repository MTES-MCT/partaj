"""
Referral attachment related API endpoints.
"""
from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralAttachmentSerializer
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
        except IndexError:
            return Response(
                status=400,
                data={
                    "errors": ["Referral attachments cannot be created without a file."]
                },
            )

        attachment = models.ReferralAttachment.objects.create(
            file=file, referral=referral
        )

        attachment.save()

        return Response(
            status=201,
            data=ReferralAttachmentSerializer(attachment).data,
        )
