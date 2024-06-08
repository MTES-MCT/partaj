"""
Topic related API endpoints.
"""

import re

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Topic, Unit
from ..serializers import TopicSerializer
from .permissions import NotAllowed


class TopicViewSet(viewsets.ModelViewSet):
    """
    API endpoints for topics.
    """

    permission_classes = [NotAllowed]
    queryset = Topic.objects.filter(is_active=True)
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

    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of topics.
        """
        base_queryset = (
            self.get_queryset().select_related("unit").prefetch_related("children")
        )
        queryset = base_queryset

        unit = self.request.query_params.get("unit", None)
        if unit is not None and unit != "":
            try:
                unit = Unit.objects.get(id=unit)
            except Unit.DoesNotExist:
                return Response(
                    status=400, data={"errors": [f"Unit {unit} does not exist."]}
                )

            queryset = queryset.filter(unit=unit)

        query = self.request.query_params.get("query", None)
        if query is not None and query != "":
            queryset = queryset.filter(name__iregex=re.escape(query))

            all_parents_paths = [
                path for topic in queryset for path in topic.get_parents_paths()
            ]
            results_parents_queryset = base_queryset.filter(path__in=all_parents_paths)

            queryset = queryset.union(results_parents_queryset)

        page = self.paginate_queryset(queryset.order_by("path"))
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset.order_by("path"), many=True)
        return Response(serializer.data)
