"""
Referral related API endpoints.
"""
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.utils import IntegrityError

from django_fsm import TransitionNotAllowed
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..forms import ReferralForm
from ..serializers import ReferralSerializer
from .permissions import NotAllowed

User = get_user_model()


class UserIsReferralUnitMember(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return (
            request.user.is_authenticated
            and referral.units.filter(members__id=request.user.id).exists()
        )


class UserIsReferralUnitOrganizer(BasePermission):
    """
    Permission class to authorize only unit organizers on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return (
            request.user.is_authenticated
            and models.UnitMembership.objects.filter(
                role__in=[
                    models.UnitMembershipRole.OWNER,
                    models.UnitMembershipRole.ADMIN,
                ],
                unit__in=referral.units.all(),
                user=request.user,
            ).exists()
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
        if self.action == "create":
            permission_classes = [IsAuthenticated]
        elif self.action == "retrieve":
            permission_classes = [UserIsReferralUnitMember | UserIsReferralRequester]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
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

            # Add in the urgency level we found and the relevant unit
            referral.urgency_level = referral_urgency
            referral.units.add(referral.topic.unit)
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

        return Response(status=400, data=form.errors)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer],
    )
    # pylint: disable=invalid-name
    def assign(self, request, pk):
        """
        Assign the referral to a member of the linked unit.
        """
        # Get the user to which we need to assign this referral
        assignee = User.objects.get(id=request.data.get("assignee"))
        # Get the referral itself and call the assign transition
        referral = self.get_object()
        unit = referral.units.get(members__id=request.user.id)
        referral.assign(assignee=assignee, created_by=request.user, unit=unit)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True, methods=["post"], permission_classes=[UserIsReferralUnitOrganizer]
    )
    # pylint: disable=invalid-name
    def assign_unit(self, request, pk):
        """
        Add a unit assignment to the referral.
        """
        # The unit we're about to assign
        try:
            unit = models.Unit.objects.get(id=request.data.get("unit"))
        except models.Unit.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"Unit {request.data.get('unit')} does not exist."]},
            )
        # Get the referral so we can perform the assignment
        referral = self.get_object()
        try:
            referral.assign_unit(unit=unit, created_by=request.user)
        except IntegrityError:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Unit {request.data.get('unit')} is already assigned to referral."
                    ]
                },
            )
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    # pylint: disable=invalid-name
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
        permission_classes=[UserIsReferralUnitMember],
    )
    # pylint: disable=invalid-name
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
            answer=answer,
            published_by=request.user,
        )
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember],
    )
    # pylint: disable=invalid-name
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
                        (
                            f"{validator.get_full_name()} was already requested "
                            "to validate this answer"
                        )
                    ]
                },
            )

        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer],
    )
    # pylint: disable=invalid-name
    def unassign(self, request, pk):
        """
        Unassign an already assigned member from the referral.
        """
        # Get the referral itself and call the unassign transition
        referral = self.get_object()
        # Get the assignment to remove from this referral
        assignment = models.ReferralAssignment.objects.get(
            assignee__id=request.data.get("assignee"),
            referral__id=referral.id,
        )
        referral.unassign(assignment=assignment, created_by=request.user)
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True, methods=["post"], permission_classes=[UserIsReferralUnitOrganizer]
    )
    # pylint: disable=invalid-name
    def unassign_unit(self, request, pk):
        """
        Remove a unit assignment from the referral.
        """
        # The referral and the assignment we want to remove
        referral = self.get_object()
        assignment = models.ReferralUnitAssignment.objects.get(
            unit__id=request.data.get("unit"), referral=referral
        )
        # Attempt to perform the unassign_unit transition, handle errors
        try:
            referral.unassign_unit(assignment=assignment, created_by=request.user)
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={"errors": ["Unit cannot be removed from this referral."]},
            )

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True, methods=["post"], permission_classes=[UserIsReferralUnitOrganizer]
    )
    # pylint: disable=invalid-name
    def change_urgencylevel(self, request, pk):
        """
        Change a referral's urgency level, keeping track of history and adding a new explanation.
        """

        # check explanation not empty
        if not request.data.get("urgencylevel_explanation"):
            return Response(
                status=400,
                data={"errors": "urgencylevel explanation is mandatory"},
            )

        if not request.data.get("urgencylevel"):
            return Response(
                status=400,
                data={"errors": "new urgencylevel is mandatory"},
            )

        # Get the new urgencylevel
        try:
            new_referral_urgency = models.ReferralUrgency.objects.get(
                id=request.data.get("urgencylevel")
            )
        except models.ReferralUrgency.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"urgencylevel {request.data['urgencylevel']} does not exist"
                    ]
                },
            )

        # Get the referral itself
        referral = self.get_object()
        try:
            referral.change_urgencylevel(
                new_urgency_level=new_referral_urgency,
                new_referralurgency_explanation=request.data.get(
                    "urgencylevel_explanation"
                ),
                created_by=request.user,
            )
            referral.save()

        except TransitionNotAllowed:
            return Response(
                status=400,
                data={"errors": ["Referral State must be Received or Assigned."]},
            )

        return Response(data=ReferralSerializer(referral).data)
