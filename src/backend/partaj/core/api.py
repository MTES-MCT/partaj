from django.contrib.auth import get_user_model

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Referral, Topic
from . import serializers


class NotAllowed(BasePermission):
    """
    Utility permission class to deny all requests. This is used as a default to close
    requests to unsupported actions.
    """

    def has_permission(self, request, view):
        """
        Always deny permission.
        """
        return False


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
    serializer_class = serializers.ReferralSerializer

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
        referral.answer(
            attachments=request.data.getlist("files"),
            content=request.data["content"],
            created_by=request.user,
        )
        referral.save()

        return Response(data=serializers.ReferralSerializer(referral).data)

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

        return Response(data=serializers.ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer | IsAdminUser],
    )
    def unassign(self, request, pk):
        """
        Unassign an already assigned member from the referral.
        """
        # Get the user to unassign from this referral
        User = get_user_model()
        assignee = User.objects.get(id=request.data["assignee_id"])
        # Get the referral itself and call the unassign transition
        referral = self.get_object()
        referral.unassign(assignee=assignee, created_by=request.user)
        referral.save()

        return Response(data=serializers.ReferralSerializer(referral).data)


class TopicViewSet(viewsets.ModelViewSet):
    """
    API endpoints for topics.
    """

    permission_classes = [NotAllowed]
    queryset = Topic.objects.all().order_by("name")
    serializer_class = serializers.TopicSerializer

    def get_queryset(self):
        """
        Enable filtering of topics by their linked unit.
        """
        queryset = self.queryset

        unit_id = self.request.query_params.get("unit", None)
        if unit_id is not None:
            queryset = queryset.filter(unit__id=unit_id)

        return queryset

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]


class UrgencyViewSet(viewsets.ViewSet):
    """
    API endpoints for urgencies.
    """

    def list(self, request):
        """
        Return the list of possible values for referral urgency.
        """
        return Response(
            {
                "count": len(Referral.URGENCY_CHOICES),
                "next": None,
                "previous": None,
                "results": [
                    {"name": name, "text": text}
                    for name, text in Referral.URGENCY_CHOICES
                ],
            }
        )


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
        serialized_user = serializers.UserSerializer(request.user)
        return Response(data=serialized_user.data)
