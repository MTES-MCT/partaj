from django.contrib.auth import get_user_model

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Referral
from .serializers import ReferralSerializer, UserSerializer


class ReferralViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referrals and their nested related objects.
    """

    queryset = Referral.objects.all().order_by("-created_at")
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"])
    def answer(self, request, pk):
        """
        Create an answer to the referral.
        """
        # Get the referral and call the answer transition
        referral = self.get_object()
        referral.answer(content=request.data["content"], created_by=request.user)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(detail=True, methods=["post"])
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
