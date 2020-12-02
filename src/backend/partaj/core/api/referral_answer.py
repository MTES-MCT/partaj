from django.http import Http404

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..forms import ReferralAnswerForm
from ..serializers import ReferralAnswerSerializer
from .helpers import NotAllowed


class CanCreateAnswer(BasePermission):
    """Permission to create a ReferralAnswer through the API."""

    def has_permission(self, request, view):
        """
        Members of a unit related to a referral can create answers for said referral.
        """
        referral = view.get_referral(request)
        return request.user in referral.topic.unit.members.all()


class CanRetrieveAnswer(BasePermission):
    """Permission to retrieve a ReferralAnswer through the API."""

    def has_permission(self, request, view):
        """
        Members of a unit related to a referral can retrieve answers for said referral.
        """
        answer = view.get_object()
        return request.user in answer.referral.topic.unit.members.all()


class CanUpdateAnswer(BasePermission):
    """Permission to update a ReferralAnswer through the API."""

    def has_permission(self, request, view):
        """
        Only the answer's author can update a referral answer.
        """
        answer = view.get_object()
        return request.user == answer.created_by


class ReferralAnswerViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral answers.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralAnswer.objects.all()
    serializer_class = ReferralAnswerSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined permissions
        for other actions.
        """
        if self.action == "create":
            permission_classes = [CanCreateAnswer]
        elif self.action == "retrieve":
            permission_classes = [CanRetrieveAnswer]
        elif self.action == "update":
            permission_classes = [CanUpdateAnswer]
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
        except models.Referral.DoesNotExist:
            raise Http404(f"Referral {request.data.get('referral')} not found")

        return referral

    def create(self, request):
        """
        Create a new referral answer as the client issues a POST on the referralanswers endpoint.
        """

        # Make sure the referral exists and return an error otherwise.
        referral = self.get_referral(request)

        form = ReferralAnswerForm(
            {
                "content": request.data.get("content") or "",
                "created_by": request.user,
                "referral": referral,
                "state": models.ReferralAnswerState.DRAFT,
            },
        )

        if not form.is_valid():
            return Response(status=400, data=form.errors)

        referral_answer = form.save()
        for attachment_dict in request.data.get("attachments") or []:
            try:
                referral_answer.attachments.add(
                    models.ReferralAnswerAttachment.objects.get(
                        id=attachment_dict["id"]
                    )
                )
                referral_answer.save()
            except models.ReferralAnswerAttachment.DoesNotExist:
                # Since we have already created the ReferralAnswer, there's not much of a point
                # in bailing out now with an error: we'd rather fail silently and let the user
                # re-add the attachment if needed.
                pass

        referral.draft_answer(referral_answer)
        referral.save()

        return Response(status=201, data=ReferralAnswerSerializer(referral_answer).data)

    def update(self, request, **kwargs):
        """
        Update an existing referral answer.
        """
        instance = self.get_object()

        # Make sure the referral exists and return an error otherwise.
        referral = self.get_referral(request)

        # Users can only modify their own referral answers. For other users' answers,
        # they're expected to use the "Revise" feature
        if not request.user.id == instance.created_by.id:
            return Response(status=403)

        form = ReferralAnswerForm(
            {
                "content": request.data.get("content") or "",
                "created_by": request.user,
                "referral": referral,
                "state": instance.state,
            },
            instance=instance,
        )

        if not form.is_valid():
            return Response(status=400, data=form.errors)

        referral_answer = form.save()

        return Response(status=200, data=ReferralAnswerSerializer(referral_answer).data)

    @action(
        detail=True, methods=["post"], permission_classes=[CanUpdateAnswer],
    )
    def remove_attachment(self, request, pk):
        """
        Remove an attachment from this answer.
        We're using an action route on the ReferralAnswer instead of a DELETE on the attachment
        as the attachment can be linked to more than one answer.
        """
        answer = self.get_object()

        if answer.state == models.ReferralAnswerState.PUBLISHED:
            return Response(
                status=400,
                data={
                    "errors": ["attachments cannot be removed from a published answer"]
                },
            )

        try:
            attachment = answer.attachments.get(id=request.data.get("attachment"))
        except models.ReferralAnswerAttachment.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"referral answer attachment {request.data.get('attachment')} does not exist"
                    ]
                },
            )

        answer.attachments.remove(attachment)
        answer.refresh_from_db()

        return Response(status=200, data=ReferralAnswerSerializer(answer).data)
