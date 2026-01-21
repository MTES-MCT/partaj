"""
Feature flag related API endpoints.
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .. import models
from ..serializers import FeatureFlagSerializer
from .permissions import NotAllowed


class FeatureFlagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for feature flags.
    """

    permission_classes = [NotAllowed]
    queryset = models.FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]
