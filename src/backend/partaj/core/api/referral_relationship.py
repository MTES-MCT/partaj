"""
Referral activity related API endpoints.
"""
from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..forms import ReferralRelationshipForm
from ..models import Referral
from ..serializers import ReferralRelationshipSerializer
from .permissions import RequestReferralRelationshipGetMixin


class UserIsReferralUnitMemberList(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral_id = request.query_params.get("referralId", None)
        referral = Referral.objects.get(id=referral_id)

        return (
            request.user.is_authenticated
            and referral.units.filter(members__id=request.user.id).exists()
        )


class UserIsReferralUnitMemberCreate(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        relationship = view.get_object()

        referral = relationship.related_referral

        return (
            request.user.is_authenticated
            and referral.units.filter(members__id=request.user.id).exists()
        )


class UserIsReferralUnitMember(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        relationship = view.get_object()

        referral = relationship.related_referral

        return (
            request.user.is_authenticated
            and referral.units.filter(members__id=request.user.id).exists()
        )


class ReferralRelationshipViewSet(
    viewsets.ModelViewSet, RequestReferralRelationshipGetMixin
):
    """
    API endpoints for referral activity.
    """

    def get_permissions(self):
        """
        Manage permissions for "list" and "retrieve" separately without overriding and duplicating
        too much logic from ModelViewSet.
        For all other actions, delegate to the permissions as defined on the @action decorator.
        """
        if self.action == "create":
            permission_classes = [UserIsReferralUnitMemberCreate]
        if self.action == "list":
            permission_classes = [UserIsReferralUnitMemberList]
        elif self.action == "delete":
            permission_classes = [UserIsReferralUnitMember]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    queryset = models.ReferralRelationship.objects.all()
    serializer_class = ReferralRelationshipSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a referral relationship
        """
        form = ReferralRelationshipForm(request.data)

        if not form.is_valid():
            return Response(data=form.errors, status=400)

        instance = form.save()
        return Response(data=ReferralRelationshipSerializer(instance).data)

    def list(self, request, *args, **kwargs):
        """
        Let users get a list of referral activities. Allow users to filter them by their related
        referral, and use the queryset & filter to manage what a given user is allowed to see.
        """
        referral_id = self.request.query_params.get("referralId", None)

        if referral_id is None:
            return Response(
                status=400,
                data={
                    "errors": [
                        "ReferralRelationship list requests need a referralId parameter"
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
                        "ReferralRelationships list requests must reference an existing referral"
                    ]
                },
            )

        # Filter the queryset to match the referral from the request parameters.
        queryset = self.queryset.filter(main_referral=referral)

        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)
