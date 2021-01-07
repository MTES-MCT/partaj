from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Topic, Unit
from ..serializers import TopicSerializer
from .helpers import NotAllowed


class TopicViewSet(viewsets.ModelViewSet):
    """
    API endpoints for topics.
    """

    permission_classes = [NotAllowed]
    queryset = Topic.objects.filter(is_active=True, parent=None).order_by("name")
    serializer_class = TopicSerializer

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

    def list(self, request):
        """
        Handle requests for lists of topics.
        """
        queryset = self.get_queryset()

        unit = self.request.query_params.get("unit", None)
        if unit is not None:
            try:
                unit = Unit.objects.get(id=unit)
            except Unit.DoesNotExist:
                return Response(
                    status=400, data={"errors": [f"Unit {unit} does not exist."]}
                )

            queryset = queryset.filter(unit=unit)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
