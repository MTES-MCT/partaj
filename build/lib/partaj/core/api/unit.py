"""
Unit related API endpoints.
"""

from rest_framework import viewsets
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..serializers import UnitSerializer
from .permissions import NotAllowed


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
        if self.action in ["list"]:
            permission_classes = [IsAuthenticated]
        elif self.action in ["retrieve"]:
            permission_classes = [CanRetrieveUnit]
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
        List units. Can be used without params to get all units (does not scale but Partaj
        does not yet need to scale the number of units) or with a query param to do autocomplete.
        """
        queryset = self.get_queryset()

        # If the "query" param is provided, filter on unit names, autocomplete-style
        query = request.query_params.get("query")
        if query:
            queryset = self.queryset.filter(name__istartswith=query)

        queryset = queryset.order_by("name")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
