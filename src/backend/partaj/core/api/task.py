from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef, Q

import arrow
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models, serializers


class TaskViewSet(viewsets.GenericViewSet):
    """
    Viewset for tasks. Tasks make up the per-user todo list on the dashboard.
    """

    @action(detail=False, permission_classes=[IsAuthenticated])
    def to_answer_soon(self, request):
        """
        Get a list of referrals that need to be answered soon if:
            - the user is assigned to this referral;
            - the user is owner on the related unit.
        """

        queryset = (
            models.Referral.objects.annotate(
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
                        assignee=request.user, referral__id=OuterRef("id"),
                    )
                ),
            )
            .annotate(
                due_date=ExpressionWrapper(
                    F("created_at") + F("urgency_level__duration"),
                    output_field=DateTimeField(),
                )
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
            serializer = serializers.ReferralSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = serializers.ReferralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, permission_classes=[IsAuthenticated])
    def to_assign(self, request):
        """
        Get a list of referrals up for assignment by the current user.
        """

        queryset = (
            models.Referral.objects.annotate(
                is_owned_by_user=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("topic__unit"),
                        user=request.user,
                        role=models.UnitMembershipRole.OWNER,
                    )
                )
            )
            .filter(is_owned_by_user=True, state=models.ReferralState.RECEIVED)
            .annotate(
                due_date=ExpressionWrapper(
                    F("created_at") + F("urgency_level__duration"),
                    output_field=DateTimeField(),
                )
            )
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = serializers.ReferralSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = serializers.ReferralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, permission_classes=[IsAuthenticated])
    def to_process(self, request):
        """
        Get a list of referrals up for processing by the current user.
        """

        queryset = (
            models.Referral.objects.annotate(
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
            .annotate(
                due_date=ExpressionWrapper(
                    F("created_at") + F("urgency_level__duration"),
                    output_field=DateTimeField(),
                )
            )
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = serializers.ReferralSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = serializers.ReferralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, permission_classes=[IsAuthenticated])
    def to_validate(self, request):
        """
        Get a list of referrals up for validation by the current user.
        """

        queryset = (
            models.Referral.objects.annotate(
                has_active_validation_request=Exists(
                    models.ReferralAnswerValidationRequest.objects.filter(
                        answer__referral__id=OuterRef("id"),
                        response=None,
                        validator=request.user,
                    )
                )
            )
            .filter(has_active_validation_request=True)
            .annotate(
                due_date=ExpressionWrapper(
                    F("created_at") + F("urgency_level__duration"),
                    output_field=DateTimeField(),
                )
            )
            .order_by("due_date")
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = serializers.ReferralSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = serializers.ReferralSerializer(queryset, many=True)
        return Response(serializer.data)
