"""
Referral activity related API endpoints.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralActivitySerializer


class ReferralActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for referral activity.

    """

    permission_classes = [IsAuthenticated]
    queryset = models.ReferralActivity.objects.all()
    serializer_class = ReferralActivitySerializer

    def list(self, request, *args, **kwargs):
        """
        Let users get a list of referral activities. Allow users to filter them by their related
        referral, and use the queryset & filter to manage what a given user is allowed to see.
        """
        referral_id = self.request.query_params.get("referral", None)
        if referral_id is None:
            return Response(
                status=400,
                data={
                    "errors": [
                        "ReferralActivity list requests need a referral parameter"
                    ]
                },
            )

        try:
            referral = models.Referral.objects.get(id=referral_id)
        except models.Referral.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        "ReferralActivity list requests must reference an existing referral"
                    ]
                },
            )

        # Filter the queryset to match the referral from the request parameters.
        queryset = self.queryset.filter(referral=referral)

        if (
            request.user == referral.user
            and not referral.units.filter(members__id=request.user.id).exists()
        ):
            linked_user_visible_activities = [
                models.ReferralActivityVerb.ANSWERED,
                models.ReferralActivityVerb.ASSIGNED,
                models.ReferralActivityVerb.CREATED,
                models.ReferralActivityVerb.UNASSIGNED,
                models.ReferralActivityVerb.CLOSED,
            ]
            queryset = queryset.filter(verb__in=linked_user_visible_activities)
        elif (
            request.user.is_staff
            or referral.units.filter(members__id=request.user.id).exists()
        ):
            # Unit members can see all activity types, there is no need to
            # further filter the queryset
            pass
        else:
            return Response(status=403)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        At the moment, we do not have an expected use case for retrieval requests on referral
        activity. Just reject the requests with a 400 error.
        """
        return Response(status=400)
