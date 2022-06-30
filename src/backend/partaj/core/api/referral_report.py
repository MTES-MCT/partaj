"""
Referral report related API endpoints.
"""
from rest_framework import viewsets
from rest_framework.permissions import BasePermission

from .. import models
from ..serializers import ReferralReportSerializer
from .permissions import NotAllowed


class CanRetrieveReport(BasePermission):
    """Permission to retrieve a ReferralReport through the API."""

    def has_permission(self, request, view):
        """
        Members of a unit related to a referral can retrieve report for said referral.
        """
        report = view.get_object()
        return (
            request.user.is_authenticated
            and report.referral.units.filter(members__id=request.user.id).exists()
        )


class ReferralReportViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral answers.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralReport.objects.all()
    serializer_class = ReferralReportSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action == "retrieve":
            permission_classes = [CanRetrieveReport]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]
