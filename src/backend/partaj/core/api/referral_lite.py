"""
Referral lite related API endpoints.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import DateTimeField, Exists, ExpressionWrapper, F, OuterRef, Q

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
            F("sent_at") + F("urgency_level__duration"),
            output_field=DateTimeField(),
        )
    ).annotate(unit=F("topic__unit__id"))
    serializer_class = ReferralLiteSerializer

    # pylint: disable=too-many-branches
    def get_queryset(self):
        """
        Apply all relevant filters in the query parameters and return a ready-to-use queryset.
        """
        queryset = self.queryset.prefetch_related("assignees", "users")
        # Filter the available referrals to only those that the current user is allowed to see
        queryset = (
            queryset.annotate(
                is_user_related_unit_member=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("units"),
                        user=self.request.user,
                    )
                )
            )
            .annotate(
                is_user_validator=Exists(
                    models.ReferralAnswerValidationRequest.objects.filter(
                        answer__referral__id=OuterRef("id"),
                        validator=self.request.user,
                    )
                )
            )
            .filter(
                # Users can see referrals if they are members of a linked unit
                Q(is_user_related_unit_member=True)
                # Or if they are amond the authors of the referral
                | Q(users=self.request.user)
                # Or if they were asked for a validation on one of the answers
                | Q(is_user_validator=True)
            )
        )

        form = ReferralListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            raise exceptions.ValidationError(detail=form.errors)

        topic = form.cleaned_data.get("topic")
        if len(topic):
            queryset = queryset.filter(topic__in=topic)

        unit = form.cleaned_data.get("unit")
        if len(unit):
            queryset = queryset.filter(units__in=unit)

        user = form.cleaned_data.get("user")
        if len(user):
            queryset = queryset.filter(users__in=user)

        task = form.cleaned_data.get("task")
        if task == "process":
            # Get a list of referrals that need to be processed if:
            # - the user is assigned to this referral;
            # - the user is admin/owner on one of the related units.
            queryset = (
                queryset.annotate(
                    is_owned_by_user=Exists(
                        models.UnitMembership.objects.filter(
                            unit=OuterRef("units"),
                            user=self.request.user,
                            role__in=[
                                models.UnitMembershipRole.ADMIN,
                                models.UnitMembershipRole.OWNER,
                            ],
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
                .exclude((Q(is_owned_by_user=False) & Q(is_user_assigned=False)))
            )
        elif task == "assign":
            # Get a list of referrals up for assignment by the current user.
            queryset = queryset.annotate(
                is_owned_by_user=Exists(
                    models.UnitMembership.objects.filter(
                        unit=OuterRef("units"),
                        user=self.request.user,
                        role=models.UnitMembershipRole.OWNER,
                    )
                )
            ).filter(is_owned_by_user=True, state=models.ReferralState.RECEIVED)
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

        assignee = form.cleaned_data.get("assignee")
        if len(assignee):
            queryset = queryset.filter(assignees__id__in=assignee)

        state = form.cleaned_data.get("state")
        if len(state):
            queryset = queryset.filter(state__in=state)

        due_date_after = form.cleaned_data.get("due_date_after")
        if due_date_after:
            queryset = queryset.filter(due_date__gt=due_date_after)

        due_date_before = form.cleaned_data.get("due_date_before")
        if due_date_before:
            # If the same day is selected for before and after, silently add one day to the
            # `due_date_before` so we actually show referrals that have exactly this due date
            if due_date_after == due_date_before:
                due_date_before += timedelta(days=1)
            queryset = queryset.filter(due_date__lt=due_date_before)

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

        queryset = queryset.distinct("due_date", "id").order_by("-due_date", "id")

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
