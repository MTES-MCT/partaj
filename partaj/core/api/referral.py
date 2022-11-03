"""
Referral related API endpoints.
"""
from datetime import datetime

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
from ..models import ReferralReport
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
        return request.user in referral.users.all()


class UserIsFromUnitReferralRequesters(BasePermission):
    """
    Permission class to authorize the referral author on API routes and/or actions related
    to a referral they created.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        user_unit_name = request.user
        user_unit_name_length = len(user_unit_name)

        requester_unit_names = [
            requester.unit_name for requester in referral.users.all()
        ]

        for requester_unit_name in requester_unit_names:
            if user_unit_name in requester_unit_name[0 : user_unit_name_length + 1]:
                return True
        return False


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
        elif self.action in ["update", "send"]:
            permission_classes = [UserIsReferralRequester]
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
        Create a empty referral as the client issues a POST on the referrals endpoint.
        """
        referral = models.Referral.objects.create()
        referral.users.set([request.user])
        referral.save()
        return Response(data=ReferralSerializer(referral).data)

    def update(self, request, *args, **kwargs):
        """
        Update an existing referral.
        """
        referral = self.get_object()

        referral.context = request.data.get("context")
        referral.question = request.data.get("question")
        referral.object = request.data.get("object")
        referral.prior_work = request.data.get("prior_work")
        referral.urgency_explanation = request.data.get("urgency_explanation")

        if request.data.get("topic"):
            try:
                topic = models.Topic.objects.get(id=request.data.get("topic"))
            except models.Topic.DoesNotExist:
                return Response(
                    status=400,
                    data={
                        "Topic": [f"{request.data.get('Topic')} is not a valid topic."]
                    },
                )
            referral.topic = topic

        if request.data.get("urgency_level"):
            # Do not create the referral until we can completely validate it: we need to first
            # make sure the urgency ID we received matches an existing urgency level.
            try:
                referral_urgency = models.ReferralUrgency.objects.get(
                    id=request.data.get("urgency_level")
                )
            except models.ReferralUrgency.DoesNotExist:
                return Response(
                    status=400,
                    data={
                        "urgency_level": [
                            f"{request.data.get('urgency_level')} is not a valid."
                        ]
                    },
                )
            # Add in the urgency level we found and the relevant unit
            referral.urgency_level = referral_urgency

        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
    )
    # pylint: disable=invalid-name
    def send(self, request, pk):
        """
        Update and Send an existing referral.
        """
        instance = self.get_object()
        users = instance.users.all()

        form = ReferralForm(
            {
                **{key: value for key, value in request.data.items()},
                "users": users,
            },
            request.FILES,
            instance=instance,
        )

        if form.is_valid():
            referral = form.save()
            referral.units.add(referral.topic.unit)

            try:
                referral.send(request.user)
                referral.sent_at = datetime.now()
                referral.report = ReferralReport.objects.create()
                referral.save()
            except TransitionNotAllowed:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            f"Transition RECEIVED not allowed from state {referral.state}."
                        ]
                    },
                )
            referral.refresh_from_db()
            return Response(status=200, data=ReferralSerializer(referral).data)

        return Response(status=400, data=form.errors)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralRequester],
    )
    # pylint: disable=invalid-name
    def remove_attachment(self, request, pk):
        """
        Remove an attachment from this referral.
        """
        referral = self.get_object()

        if referral.state != models.ReferralState.DRAFT:
            return Response(
                status=400,
                data={
                    "errors": [
                        "attachments cannot be removed from a non draft referral"
                    ]
                },
            )

        try:
            attachment = referral.attachments.get(id=request.data.get("attachment"))
        except models.ReferralAttachment.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        (
                            f"referral  attachment {request.data.get('attachment')} "
                            "does not exist"
                        )
                    ]
                },
            )
        referral.attachments.get(id=attachment.id).delete()
        referral.refresh_from_db()
        return Response(status=200, data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember | UserIsReferralRequester],
    )
    # pylint: disable=invalid-name
    def add_requester(self, request, pk):
        """
        Add a new user as a requester on the referral.
        """
        # Get the user we need to add to the referral
        try:
            requester = User.objects.get(id=request.data.get("requester"))
        except User.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [f"User {request.data.get('requester')} does not exist."]
                },
            )

        # Get the referral itself and call the add_requester transition
        referral = self.get_object()
        try:
            referral.add_requester(requester=requester, created_by=request.user)
            referral.save()
        except IntegrityError:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"User {requester.id} is already linked to this referral."
                    ]
                },
            )
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Transition ADD_REQUESTER not allowed from state {referral.state}."
                    ]
                },
            )

        return Response(data=ReferralSerializer(referral).data)

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
        try:
            referral.assign(assignee=assignee, created_by=request.user, unit=unit)
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Transition ASSIGN not allowed from state {referral.state}."
                    ]
                },
            )

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
    )
    # pylint: disable=invalid-name
    def follow(self, request, pk):
        """
        Add user to requester and create notifications to be notified only on answer sent
        """
        # Get the user we need to add to the referral
        follower = request.user

        # Get the referral itself and call the add_requester transition
        referral = self.get_object()
        try:
            referral.add_follower(follower=follower)
            referral.save()
        except IntegrityError:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"User {request.user.id} is already linked to this referral."
                    ]
                },
            )
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Transition ADD_REQUESTER not allowed from state {referral.state}."
                    ]
                },
            )

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True, methods=["post"], permission_classes=[UserIsReferralUnitOrganizer]
    )
    # pylint: disable=invalid-name
    def assign_unit(self, request, pk):
        """
        Add a unit assignment to the referral.
        """

        # check explanation not empty
        if not request.data.get("assignunit_explanation"):
            return Response(
                status=400,
                data={"errors": "assign unit explanation is mandatory"},
            )

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
            referral.assign_unit(
                unit=unit,
                created_by=request.user,
                assignunit_explanation=request.data.get("assignunit_explanation"),
            )
            referral.save()
        except IntegrityError:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Unit {request.data.get('unit')} is already assigned to referral."
                    ]
                },
            )
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": {
                        f"Transition ASSIGN_UNIT not allowed from state {referral.state}."
                    }
                },
            )

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

        try:
            referral.perform_answer_validation(
                validation_request=validation_request,
                state=request.data["state"],
                comment=request.data["comment"],
            )
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": {
                        (
                            "Transition PERFORM_ANSWER_VALIDATION "
                            f"not allowed from state {referral.state}."
                        )
                    }
                },
            )

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

        try:
            referral.publish_answer(
                answer=answer,
                published_by=request.user,
            )
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": {
                        f"Transition PUBLISH_ANSWER not allowed from state {referral.state}."
                    }
                },
            )

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember | UserIsReferralRequester],
    )
    # pylint: disable=invalid-name
    def remove_requester(self, request, pk):
        """
        Remove a requester from the referral.
        """
        referral = self.get_object()
        # Get the link we need to deleted to remove the user from the referral
        try:
            referral_user_link = models.ReferralUserLink.objects.get(
                referral=referral, user__id=request.data.get("requester")
            )
        except models.ReferralUserLink.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"User {request.data.get('requester')} is not linked "
                        f"to referral {referral.id}."
                    ]
                },
            )

        if referral.users.count() < 2:
            return Response(
                status=400,
                data={
                    "errors": [
                        "The requester cannot be removed from the referral if there is only one."
                    ]
                },
            )

        # Call the remove_requester transition
        try:
            referral.remove_requester(
                referral_user_link=referral_user_link, created_by=request.user
            )
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Transition REMOVE_REQUESTER not allowed from state {referral.state}."
                    ]
                },
            )

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
                referral.save()
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
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": {
                        (
                            "Transition REQUEST_ANSWER_VALIDATION "
                            f"not allowed from state {referral.state}."
                        )
                    }
                },
            )

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

        try:
            referral.unassign(assignment=assignment, created_by=request.user)
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": {
                        f"Transition UNASSIGN not allowed from state {referral.state}."
                    }
                },
            )

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
                data={
                    "errors": [
                        f"Cannot change urgency level from state {referral.state}."
                    ]
                },
            )

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitOrganizer | UserIsReferralRequester],
    )
    # pylint: disable=invalid-name
    def close_referral(self, request, pk):
        """
        Close the referral and add an explanation.
        """
        # check explanation not empty
        if not request.data.get("close_explanation"):
            return Response(
                status=400,
                data={"errors": "An explanation is required to close a referral"},
            )

        # Get the referral itself
        referral = self.get_object()
        try:
            referral.close_referral(
                close_explanation=request.data.get("close_explanation"),
                created_by=request.user,
            )
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": [f"Cannot close referral from state {referral.state}."]
                },
            )

        return Response(data=ReferralSerializer(referral).data)
