from django.contrib.auth import get_user_model
from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef, Q

import arrow
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralLiteSerializer


class ReferralLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):

    permission_classes = [IsAuthenticated]
    queryset = (
        models.Referral.objects.annotate(
            due_date=ExpressionWrapper(
                F("created_at") + F("urgency_level__duration"),
                output_field=DateTimeField(),
            )
        )
        .annotate(requester_unit_name=F("user__unit_name"))
        .annotate(unit=F("topic__unit__id"))
    )
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

            queryset = queryset.filter(units=unit).order_by("due_date")

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

            queryset = queryset.filter(user=user).order_by("due_date")

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        return Response(
            status=400,
            data={"errors": ["Referral list requests require parameters"]},
        )

    @action(detail=False)
    def to_answer_soon(self, request):
        """
        Get a list of referrals that need to be answered soon if:
            - the user is assigned to this referral;
            - the user is owner on the related unit.
        """

        queryset = (
            self.get_queryset()
            .annotate(
                is_owned_by_user=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("topic__unit"),
                        user=request.user,
                        role=models.UnitMembershipRole.OWNER,
                    )
                )
            )
            .annotate(
                is_user_assigned=Exists(
                    models.ReferralAssignment.objects.filter(
                        assignee=request.user,
                        referral__id=OuterRef("id"),
                    )
                ),
            )
            .exclude(
                (Q(is_owned_by_user=False) & Q(is_user_assigned=False))
                | Q(
                    state__in=[
                        models.ReferralState.ANSWERED,
                        models.ReferralState.CLOSED,
                    ]
                )
                | Q(due_date__gt=arrow.utcnow().shift(days=15).datetime),
            )
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def to_assign(self, request):
        """
        Get a list of referrals up for assignment by the current user.
        """

        queryset = (
            self.get_queryset()
            .annotate(
                is_owned_by_user=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("topic__unit"),
                        user=request.user,
                        role=models.UnitMembershipRole.OWNER,
                    )
                )
            )
            .filter(is_owned_by_user=True, state=models.ReferralState.RECEIVED)
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def to_process(self, request):
        """
        Get a list of referrals up for processing by the current user.
        """

        queryset = (
            self.get_queryset()
            .annotate(
                has_active_assignment=Exists(
                    models.ReferralAssignment.objects.filter(
                        assignee=request.user,
                        referral__id=OuterRef("id"),
                        referral__state=models.ReferralState.ASSIGNED,
                    )
                ),
            )
            .annotate(
                has_validation_request=Exists(
                    models.ReferralAnswerValidationRequest.objects.filter(
                        answer__referral__id=OuterRef("id")
                    )
                ),
            )
            .filter(has_active_assignment=True, has_validation_request=False)
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def to_validate(self, request):
        """
        Get a list of referrals up for validation by the current user.
        """

        queryset = (
            self.get_queryset()
            .annotate(
                has_active_validation_request=Exists(
                    models.ReferralAnswerValidationRequest.objects.filter(
                        answer__referral__id=OuterRef("id"),
                        response=None,
                        validator=request.user,
                    )
                )
            )
            .filter(has_active_validation_request=True)
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
