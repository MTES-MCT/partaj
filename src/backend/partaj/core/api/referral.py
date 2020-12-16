from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import DateTimeField, ExpressionWrapper, F, Q
from django.db.utils import IntegrityError

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..forms import ReferralForm
from ..serializers import ReferralSerializer
from .helpers import NotAllowed


User = get_user_model()


class UserIsReferralUnitMember(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user in referral.topic.unit.members.all()


class UserIsReferralUnitOrganizer(BasePermission):
    """
    Permission class to authorize only unit organizers on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user in referral.topic.unit.members.filter(
            Q(unitmembership__role=models.UnitMembershipRole.OWNER)
            | Q(unitmembership__role=models.UnitMembershipRole.ADMIN)
        )


class UserIsReferralRequester(BasePermission):
    """
    Permission class to authorize the referral author on API routes and/or actions related
    to a referral they created.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user == referral.user


class ReferralViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referrals and their nested related objects.
    """

    permission_classes = [NotAllowed]
    queryset = models.Referral.objects.all().order_by("-created_at")
    serializer_class = ReferralSerializer

    def get_permissions(self):
        """
        Manage permissions for "list" and "retrieve" separately without overriding and duplicating
        too much logic from ModelViewSet.
        For all other actions, delegate to the permissions as defined on the @action decorator.
        """
        if self.action in ["create", "list"]:
            permission_classes = [IsAuthenticated]
        elif self.action == "retrieve":
            permission_classes = [
                UserIsReferralUnitMember | UserIsReferralRequester | IsAdminUser
            ]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def create(self, request):
        """
        Create a new referral as the client issues a POST on the referrals endpoint.
        """
        form = ReferralForm(
            {
                # Add the currently logged in user to the Referral object we're building
                "user": request.user.id,
                **{key: value for key, value in request.POST.items()},
            },
            request.FILES,
        )

        if form.is_valid():
            # Do not create the referral until we can completely validate it: we need to first
            # make sure the urgency ID we received matches an existing urgency level.
            try:
                referral_urgency = models.ReferralUrgency.objects.get(
                    id=request.POST["urgency_level"]
                )
            except models.ReferralUrgency.DoesNotExist:
                return Response(
                    status=400,
                    data={
                        "urgency_level": [
                            f"{request.POST['urgency_level']} is not a valid referral urgency id."
                        ]
                    },
                )

            # Create the referral from existing data
            referral = form.save()

            # Add in the urgency level we found
            referral.urgency_level = referral_urgency
            referral.save()

            # Create Attachment instances for the related files
            files = request.FILES.getlist("files")
            for file in files:
                referral_attachment = models.ReferralAttachment(
                    file=file, referral=referral
                )
                referral_attachment.save()

            referral.refresh_from_db()
            referral.send()

            # Redirect the user to the "single referral" view
            return Response(status=201, data=ReferralSerializer(referral).data)

        else:
            return Response(status=400, data=form.errors)

    def list(self, request):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """
        queryset = self.get_queryset()

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

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer | IsAdminUser],
    )
    def assign(self, request, pk):
        """
        Assign the referral to a member of the linked unit.
        """
        # Get the user to which we need to assign this referral
        assignee = User.objects.get(id=request.data["assignee_id"])
        # Get the referral itself and call the assign transition
        referral = self.get_object()
        referral.assign(assignee=assignee, created_by=request.user)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def perform_answer_validation(self, request, pk):
        """
        Perform the requested validation.
        Only the validator from an existing validation request can call this method.
        """
        referral = self.get_object()
        # Get the validation request which prompted this validation response
        try:
            validation_request = models.ReferralAnswerValidationRequest.objects.get(
                id=request.data["validation_request"]
            )
        except models.ReferralAnswerValidationRequest.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"validation request {request.data['validation_request']} does not exist"
                    ]
                },
            )

        # Note that we did not include an exception from staff. Validation is linked to a specific
        # person, thus it makes little sense to allow admins to perform it in their place.
        if request.user.id != validation_request.validator.id:
            return Response(status=403)

        referral.perform_answer_validation(
            validation_request=validation_request,
            state=request.data["state"],
            comment=request.data["comment"],
        )
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember | IsAdminUser],
    )
    def publish_answer(self, request, pk):
        """
        Publish an existing draft answer, marking the referral as answered.
        """
        referral = self.get_object()
        try:
            answer = models.ReferralAnswer.objects.get(id=request.data["answer"])
        except models.ReferralAnswer.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"answer {request.data['answer']} does not exist"]},
            )

        referral.publish_answer(
            answer=answer, published_by=request.user,
        )
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember | IsAdminUser],
    )
    def request_answer_validation(self, request, pk):
        """
        Request a validation for an existing answer, notifying the validator in the process.
        """
        referral = self.get_object()
        # Get the answer on which to request a validation, or bail out with an error
        try:
            answer = models.ReferralAnswer.objects.get(id=request.data["answer"])
        except models.ReferralAnswer.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"answer {request.data['answer']} does not exist"]},
            )

        # Get the validator user object, or bail out with an error
        try:
            validator = User.objects.get(id=request.data["validator"])
        except User.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"user {request.data['validator']} does not exist"]},
            )

        try:
            with transaction.atomic():
                referral.request_answer_validation(
                    answer=answer, requested_by=request.user, validator=validator
                )
        except IntegrityError:
            # The DB constraint that could be triggered here is the one that makes
            # answer & validator unique together
            return Response(
                status=400,
                data={
                    "errors": [
                        f"{validator.get_full_name()} was already requested to validate this answer"
                    ]
                },
            )

        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer | IsAdminUser],
    )
    def unassign(self, request, pk):
        """
        Unassign an already assigned member from the referral.
        """
        # Get the user to unassign from this referral
        assignee = User.objects.get(id=request.data["assignee_id"])
        # Get the referral itself and call the unassign transition
        referral = self.get_object()
        referral.unassign(assignee=assignee, created_by=request.user)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)
