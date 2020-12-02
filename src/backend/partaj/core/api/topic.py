from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import Topic
from ..serializers import TopicSerializer
from .helpers import NotAllowed


class TopicViewSet(viewsets.ModelViewSet):
    """
    API endpoints for topics.
    """

    permission_classes = [NotAllowed]
    queryset = Topic.objects.exclude(
        id="0b736e5e-6850-421e-8701-3ed2e229cf82"
    ).order_by("name")
    serializer_class = TopicSerializer

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
