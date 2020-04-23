from rest_framework import permissions
from rest_framework import viewsets

from ..models import Referral
from ..serializers import ReferralSerializer


class ReferralViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = Referral.objects.all().order_by('-created_at')
    serializer_class = ReferralSerializer
    permission_classes = [permissions.IsAuthenticated]
