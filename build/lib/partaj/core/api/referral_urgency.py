"""
Referral urgency related API endpoints.
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import ReferralUrgency
from ..serializers import ReferralUrgencySerializer
from .permissions import NotAllowed


class ReferralUrgencyViewSet(viewsets.ModelViewSet):
    """
    API endpoints for urgencies.
    """

    permission_classes = [NotAllowed]
    queryset = ReferralUrgency.objects.all().order_by("index")
    serializer_class = ReferralUrgencySerializer

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
