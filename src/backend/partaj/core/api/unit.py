from rest_framework.permissions import BasePermission
from rest_framework import viewsets

from .. import models
from ..serializers import UnitSerializer
from .helpers import NotAllowed


class CanRetrieveUnit(BasePermission):
    """Permission to retrieve a given unit through the API."""

    def has_object_permission(self, request, view, obj):
        """
        Users can only retrieve units of which they are a member.
        """
        return request.user in obj.members.all()


class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for units.
    """

    permission_classes = [NotAllowed]
    queryset = models.Unit.objects.order_by("name")
    serializer_class = UnitSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["retrieve"]:
            permission_classes = [CanRetrieveUnit]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]
