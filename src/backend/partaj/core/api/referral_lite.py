from django.contrib.auth import get_user_model
from django.db.models import DateTimeField, ExpressionWrapper, F

from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralLiteSerializer


class ReferralLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):

    permission_classes = [IsAuthenticated]
    queryset = models.Referral.objects.all().order_by("-created_at")
    serializer_class = ReferralLiteSerializer

    def list(self, request):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """
        queryset = self.get_queryset().prefetch_related("assignees")

        unit = self.request.query_params.get("unit", None)
        if unit is not None:
            # Get the unit, return an error if it does not exist
            try:
                unit = models.Unit.objects.get(id=unit)
            except models.Unit.DoesNotExist:
                return Response(
                    status=400, data={"errors": [f"Unit {unit} does not exist."]}
                )

            # Make sure the user is a member of the unit and can make this request
            try:
                models.UnitMembership.objects.get(unit=unit, user=request.user)
            except models.UnitMembership.DoesNotExist:
                return Response(status=403)

            queryset = (
                queryset.filter(topic__unit=unit)
                .annotate(
                    due_date=ExpressionWrapper(
                        F("created_at") + F("urgency_level__duration"),
                        output_field=DateTimeField(),
                    )
                )
                .annotate(requester_unit_name=F("user__unit_name"))
                .annotate(unit=F("topic__unit__id"))
                .order_by("due_date")
            )

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        user = self.request.query_params.get("user", None)
        if user is not None:
            # Get the user, return an error if it does not exist
            try:
                User = get_user_model()
                user = User.objects.get(id=user)
            except User.DoesNotExist:
                return Response(
                    status=400, data={"errors": [f"User {user} does not exist."]}
                )

            if user != request.user:
                return Response(status=403)

            queryset = (
                queryset.filter(user=user)
                .annotate(
                    due_date=ExpressionWrapper(
                        F("created_at") + F("urgency_level__duration"),
                        output_field=DateTimeField(),
                    )
                )
                .annotate(requester_unit_name=F("user__unit_name"))
                .annotate(unit=F("topic__unit__id"))
                .order_by("due_date")
            )

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        return Response(
            status=400, data={"errors": ["Referral list requests require parameters"]},
        )
