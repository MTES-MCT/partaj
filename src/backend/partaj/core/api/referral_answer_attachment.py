"""
Referral answer attachment related API endpoints.
"""
from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralAnswerAttachmentSerializer
from .permissions import NotAllowed


class UserIsRelatedReferralAnswerAuthor(BasePermission):
    """
    Permission class to authorize a referral answer's author on API routes and/or actions for
    objects with a relation to the referral answer they created.

    NB: we're using `view.get_referralanswer()` instead of `view.get_object()` as we expect this to
    be implemented by ViewSets using this permission for objects with a relation to a referral.
    """

    def has_permission(self, request, view):
        referralanswer = view.get_referralanswer(request)
        return request.user == referralanswer.created_by


class ReferralAnswerAttachmentViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral answer attachments.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralAnswerAttachment.objects.all()
    serializer_class = ReferralAnswerAttachmentSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action in ["create", "retrieve"]:
            permission_classes = [UserIsRelatedReferralAnswerAuthor]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def get_referralanswer(self, request):
        """
        Helper: get the related referralanswer, return an error if it does not exist.
        """
        answer_id = request.data.get("answer") or request.query_params.get("answer")
        try:
            referralanswer = models.ReferralAnswer.objects.get(id=answer_id)
        except models.ReferralAnswer.DoesNotExist as error:
            raise Http404(
                f"ReferralAnswer {request.data.get('answer')} not found"
            ) from error

        return referralanswer

    def create(self, request, *args, **kwargs):
        """
        Let users create new referral answer attachment, processing the file itself along with
        its metadata to create a ReferralAttachment instance.
        """
        # Make sure the referral answer exists and return an error otherwise.
        referralanswer = self.get_referralanswer(request)

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral answer attachments cannot be created with more than one file."
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
                        "Referral answer attachments cannot be created without a file."
                    ]
                },
            )

        attachment = models.ReferralAnswerAttachment.objects.create(
            file=file,
        )
        attachment.referral_answers.add(referralanswer)
        attachment.save()

        return Response(
            status=201,
            data=ReferralAnswerAttachmentSerializer(attachment).data,
        )
