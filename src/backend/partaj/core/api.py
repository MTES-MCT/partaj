from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Referral
from .serializers import ReferralSerializer, UserSerializer


class ReferralViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referrals and their nested related objects.
    """
    queryset = Referral.objects.all().order_by('-created_at')
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]


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
