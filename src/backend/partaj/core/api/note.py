"""
Note related API endpoints.
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .. import models
from ..serializers import ReferralNoteSerializer
from .permissions import NotAllowed


class NoteViewSet(viewsets.ModelViewSet):
    """
    API endpoints for notes.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralNote.objects.all().order_by("-created_at")
    serializer_class = ReferralNoteSerializer

    def get_permissions(self):
        """
        Manage permissions for "retrieve"
        """
        if self.action == "retrieve":
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]
