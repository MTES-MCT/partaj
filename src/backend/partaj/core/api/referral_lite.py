"""
Referral lite related API endpoints.
"""
from django.contrib.auth import get_user_model
from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef, Q

import arrow
from rest_framework import exceptions, mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..forms import ReferralListQueryForm
from ..serializers import ReferralLiteSerializer

# pylint: disable=invalid-name
User = get_user_model()


class ReferralLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Referral related endpoints using the referral lite serializer.

    Use this one instead of referral when performance is important (eg. for list requests
    which take a long time using time using the regular referral serializer).
    """

    permission_classes = [IsAuthenticated]
    queryset = models.Referral.objects.annotate(
        due_date=ExpressionWrapper(
            F("created_at") + F("urgency_level__duration"),
            output_field=DateTimeField(),
        )
    ).annotate(unit=F("topic__unit__id"))
    serializer_class = ReferralLiteSerializer

    def get_queryset(self):
        """
        Apply all relevant filters in the query parameters and return a ready-to-use queryset.
        """
        queryset = self.queryset.prefetch_related("assignees", "users")

        form = ReferralListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            raise exceptions.ValidationError(
                detail=form.errors
            )

        unit = form.cleaned_data.get("unit")
        if unit:
            try:
                unit = models.Unit.objects.get(id=unit)
            except models.Unit.DoesNotExist as exc:
                raise exceptions.ValidationError(
                    detail=[f"Unit {unit} does not exist."]
                ) from exc
            # Make sure the user is a member of the unit and can make this request
            try:
                models.UnitMembership.objects.get(unit=unit, user=self.request.user)
            except models.UnitMembership.DoesNotExist as exc:
                raise exceptions.PermissionDenied from exc
            queryset = queryset.filter(units=unit)

        user = form.cleaned_data.get("user")
        if user:
            try:
                user = User.objects.get(id=user)
            except User.DoesNotExist as exc:
                raise exceptions.ValidationError(
                    detail=[f"User {user} does not exist."]
                ) from exc
            # Requests to filter on a given user can only be performed by said user themselves
            if user != self.request.user:
                raise exceptions.PermissionDenied
            queryset = queryset.filter(users=user)

        task = form.cleaned_data.get("task")
        if task == "answer_soon":
            # Get a list of referrals that need to be answered soon if:
            # - the user is assigned to this referral;
            # - the user is owner on the related unit.
            queryset = (
                queryset.annotate(
                    is_owned_by_user=Exists(
                        models.UnitMembership.objects.filter(
                            unit=OuterRef("topic__unit"),
                            user=self.request.user,
                            role=models.UnitMembershipRole.OWNER,
                        )
                    )
                )
                .annotate(
                    is_user_assigned=Exists(
                        models.ReferralAssignment.objects.filter(
                            assignee=self.request.user,
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
            )
        elif task == "assign":
            # Get a list of referrals up for assignment by the current user.
            queryset = queryset.annotate(
                is_owned_by_user=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("topic__unit"),
                        user=self.request.user,
                        role=models.UnitMembershipRole.OWNER,
                    )
                )
            ).filter(is_owned_by_user=True, state=models.ReferralState.RECEIVED)
        elif task == "process":
            # Get a list of referrals up for processing by the current user.
            queryset = (
                queryset.annotate(
                    has_active_assignment=Exists(
                        models.ReferralAssignment.objects.filter(
                            assignee=self.request.user,
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
            )
        elif task == "validate":
            # Get a list of referrals up for validation by the current user.
            queryset = queryset.annotate(
                has_active_validation_request=Exists(
                    models.ReferralAnswerValidationRequest.objects.filter(
                        answer__referral__id=OuterRef("id"),
                        response=None,
                        validator=self.request.user,
                    )
                )
            ).filter(
                has_active_validation_request=True,
                state=models.ReferralState.IN_VALIDATION,
            )
        else:
            # Make sure permissions cannot be bypassed by setting a bogus task
            task = None

        assignee = form.cleaned_data.get("assignee")
        if len(assignee):
            queryset = queryset.filter(assignees__id__in=assignee)

        state = form.cleaned_data.get("state")
        if len(state):
            queryset = queryset.filter(state__in=state)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """
        try:
            queryset = self.get_queryset()
        except exceptions.ValidationError as exc:
            return Response(status=400, data={"errors": exc.detail})
        except exceptions.PermissionDenied:
            # - request is filtering on a unit, but current user is not a member of that unit
            # - request is filtering on a user who is no the current user
            return Response(status=403)

        queryset = queryset.order_by("due_date")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
