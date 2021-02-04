from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralAnswerValidationRequestSerializer
from .helpers import NotAllowed


class CanGetAnswerValidationRequests(BasePermission):
    """Permission to get ReferralAnswerValidationRequests through the API."""

    def has_permission(self, request, view):
        """
        Members of a unit related to the referral the answer is linked to can create answer
        validation requests.
        """
        referralanswer = view.get_referralanswer(request)

        if (
            request.user.is_authenticated
            and referralanswer.referral.units.filter(
                members__id=request.user.id
            ).exists()
        ):
            return True

        if (
            request.user.is_authenticated
            and models.ReferralAnswerValidationRequest.objects.filter(
                answer__referral=referralanswer.referral, validator=request.user
            ).exists()
        ):
            return True

        return False


class ReferralAnswerValidationRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral answer validations.
    Uses requests as an entry point as they are the logical first step: all validation responses
    have an associated request, not all requests have a response.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralAnswerValidationRequest.objects.all()
    serializer_class = ReferralAnswerValidationRequestSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["list"]:
            permission_classes = [CanGetAnswerValidationRequests]
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
        except models.ReferralAnswer.DoesNotExist:
            raise Http404(f"ReferralAnswer {request.data.get('answer')} not found")

        return referralanswer

    def list(self, request, *args, **kwargs):
        """
        Let users get a list of referral answer validation requests.
        They are necessarily filtered by answer so we can manage authorization for related unit
        members.
        """
        answer = self.get_referralanswer(request)
        queryset = self.queryset.filter(answer=answer)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
