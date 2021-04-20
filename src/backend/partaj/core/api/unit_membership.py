"""
Unit membership related API endpoints.
"""
from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import UnitMembershipSerializer
from .permissions import NotAllowed


class CanListMemberships(BasePermission):
    """Permission to list memberships for a given unit through the API."""

    def has_permission(self, request, view):
        """
        Members of a unit can list memberships for said unit.
        """
        unit = view.get_unit(request)
        return request.user in unit.members.all()


class UnitMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for unit memberships.
    """

    permission_classes = [NotAllowed]
    queryset = models.UnitMembership.objects.order_by("created_at")
    serializer_class = UnitMembershipSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["list"]:
            permission_classes = [CanListMemberships]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def get_unit(self, request):
        """
        Helper: get the related unit, return an error if it does not exist.
        """
        unit = request.data.get("unit") or request.query_params.get("unit")
        try:
            unit = models.Unit.objects.get(id=unit)
        except models.Unit.DoesNotExist as error:
            raise Http404(f"Unit {unit} not found") from error

        return unit

    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of unit memberships.
        """

        unit = self.get_unit(request)
        queryset = self.get_queryset().filter(unit=unit)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
