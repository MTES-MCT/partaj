from django.contrib.auth import get_user_model

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAdminUser
from rest_framework.response import Response

from .models import Referral
from .serializers import ReferralSerializer, UserSerializer


class UserIsReferralUnitMember(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user in referral.topic.unit.members.all()


class UserIsReferralUnitOrganizer(BasePermission):
    """
    Permission class to authorize only unit organizers on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user in referral.topic.unit.get_organizers()


class UserIsReferralRequester(BasePermission):
    """
    Permission class to authorize the referral author on API routes and/or actions related
    to a referral they created.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user == referral.user


class ReferralViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referrals and their nested related objects.
    """

    queryset = Referral.objects.all().order_by("-created_at")
    serializer_class = ReferralSerializer

    def get_permissions(self):
        """
        Manage permissions for "list" and "retrieve" separately without overriding and duplicating
        too much logic from ModelViewSet.
        For all other actions, delegate to the permissions as defined on the @action decorator.
        """
        if self.action == "list":
            permission_classes = [IsAdminUser]
        elif self.action == "retrieve":
            permission_classes = [
                UserIsReferralUnitMember | UserIsReferralRequester | IsAdminUser
            ]
        else:
            permission_classes = getattr(self, self.action).kwargs.get(
                "permission_classes"
            )
        return [permission() for permission in permission_classes]

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember | IsAdminUser],
    )
    def answer(self, request, pk):
        """
        Create an answer to the referral.
        """
        # Get the referral and call the answer transition
        referral = self.get_object()
        referral.answer(content=request.data["content"], created_by=request.user)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer | IsAdminUser],
    )
    def assign(self, request, pk):
        """
        Assign the referral to a member of the linked unit.
        """
        # Get the user to which we need to assign this referral
        User = get_user_model()
        assignee = User.objects.get(id=request.data["assignee_id"])
        # Get the referral itself and call the assign transition
        referral = self.get_object()
        referral.assign(assignee=assignee, created_by=request.user)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoints for users.
    """

    @action(detail=False)
    def whoami(self, request):
        """
        Get information on the current user. This is the only implemented user-related endpoint.
        """
        # If the user is not logged in, the request has no object. Return a 401 so the caller
        # knows they need to log in first.
        if not request.user.is_authenticated:
            return Response(status=401)

        # Serialize the user with a minimal subset of existing fields and return it.
        serialized_user = UserSerializer(request.user)
        return Response(data=serialized_user.data)
