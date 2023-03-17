# pylint: disable=C0302
# Too many lines in module

# pylint: disable=R0904
# Too many  public methodes
"""
Referral related API endpoints.
"""
from datetime import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.utils import IntegrityError

from django_cas_ng.models import UserMapping
from django_fsm import TransitionNotAllowed
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from partaj.core.models import ReferralUserLink

from .. import models, signals
from ..forms import ReferralForm
from ..serializers import ReferralSerializer
from .permissions import NotAllowed

from ..models import (  # isort:skip
    ReferralReport,
    ReferralUserLinkNotificationsTypes,
    ReferralUserLinkRoles,
)

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
    to a referral they request.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return (
            request.user
            in referral.users.filter(
                referraluserlink__role=ReferralUserLinkRoles.REQUESTER
            ).all()
        )


class UserIsStaff(BasePermission):
    """
    Permission class to authorize staff only
    """

    def has_permission(self, request, view):
        return request.user.is_staff


class UserIsReferralObserver(BasePermission):
    """
    Permission class to authorize the referral author on API routes and/or actions related
    to a referral they observe.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return (
            request.user
            in referral.users.filter(
                referraluserlink__role=ReferralUserLinkRoles.OBSERVER
            ).all()
        )


class UserIsReferralUser(BasePermission):
    """
    Permission class to authorize the referral author on API routes and/or actions related
    to a referral they are part of.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return request.user in referral.users.all()


class UserIsFromUnitReferralRequesters(BasePermission):
    """
    Permission class to authorize users from requesters unit
    """

    def has_permission(self, request, view):
        referral = view.get_object()

        return referral.is_user_from_unit_referral_requesters(request.user)


class ReferralStateIsDraft(BasePermission):
    """
    Permission class to authorize referral deletion if referral's state is DRAFT
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return referral.state == models.ReferralState.DRAFT


class UserIsObserverAndReferralIsNotDraft(BasePermission):
    """
    Permission class to authorize referral deletion if referral's state is DRAFT
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return (
            request.user
            in referral.users.filter(
                referraluserlink__role=ReferralUserLinkRoles.OBSERVER
            ).all()
            and referral.state != models.ReferralState.DRAFT
        )


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
            permission_classes = [
                UserIsReferralUnitMember
                | UserIsObserverAndReferralIsNotDraft
                | UserIsReferralRequester
                | UserIsFromUnitReferralRequesters
            ]
        elif self.action in ["update", "send"]:
            permission_classes = [UserIsReferralRequester]
        elif self.action == "destroy":
            permission_classes = [UserIsReferralRequester & ReferralStateIsDraft]
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
        permission_classes=[
            UserIsReferralUnitMember
            | UserIsReferralRequester
            | UserIsObserverAndReferralIsNotDraft
            | UserIsFromUnitReferralRequesters
        ],
    )
    # pylint: disable=invalid-name
    def upsert_user(self, request, pk):
        """
        Add or update a requester on the referral.
        """
        user_id = request.data.get("user")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"User {user_id} does not exist."]},
            )

        # These values are optionals, we will add default values later depending on cases
        user_role = request.data.get("role")
        notifications_type = request.data.get("notifications")
        referral = self.get_object()

        try:
            referral_user_link = models.ReferralUserLink.objects.get(
                referral=referral, user__id=user_id
            )

            # CASE USER IS ALREADY A REFERRAL USER
            user_role = user_role or referral_user_link.role
            notifications_type = (
                notifications_type
                or ReferralUserLink.get_default_notifications_type_for_role(user_role)
            )
            if notifications_type not in ReferralUserLinkNotificationsTypes.values:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            f"Notification type {notifications_type} does not exist."
                        ]
                    },
                )
            if (
                referral_user_link.role == user_role
                and referral_user_link.notifications == notifications_type
            ):
                return Response(
                    status=400,
                    data={
                        "errors": [
                            f"User {user_id} "
                            f"is already {user_role} with {notifications_type} "
                            f"notifications for referral {referral.id}."
                        ]
                    },
                )

            # CASE ROLE HAS CHANGE
            if referral_user_link.role != user_role:
                last_role = referral_user_link.role
                if (
                    last_role == ReferralUserLinkRoles.REQUESTER
                    and len(referral.get_requesters()) < 2
                ):
                    return Response(
                        status=400,
                        data={
                            "errors": [
                                "The last requester cannot be removed from the referral "
                            ]
                        },
                    )
                referral_user_link.role = user_role
                # If role has change, we also change notifications to default role ones
                referral_user_link.notifications = notifications_type
                referral_user_link.save()
                referral.save()

                if last_role == ReferralUserLinkRoles.REQUESTER:
                    signals.requester_deleted.send(
                        sender="api.referral.upsert_user",
                        referral=referral,
                        created_by=request.user,
                        requester=user,
                    )
                    signals.observer_added.send(
                        sender="api.referral.upsert_user",
                        referral=referral,
                        observer=user,
                        created_by=request.user,
                    )
                else:
                    signals.observer_deleted.send(
                        sender="api.referral.upsert_user",
                        referral=referral,
                        created_by=request.user,
                        observer=user,
                    )
                    signals.requester_added.send(
                        sender="api.referral.upsert_user",
                        referral=referral,
                        requester=user,
                        created_by=request.user,
                    )

                return Response(data=ReferralSerializer(referral).data)

            # CASE REQUESTER ONLY CHANGE HIS NOTIFICATIONS PREFERENCES
            referral_user_link.notifications = notifications_type
            referral_user_link.save()

        except models.ReferralUserLink.DoesNotExist:
            # CASE NEW REFERRAL USER
            user_role = user_role or ReferralUserLinkRoles.REQUESTER
            notifications_type = (
                notifications_type
                or ReferralUserLink.get_default_notifications_type_for_role(user_role)
            )
            if notifications_type not in ReferralUserLinkNotificationsTypes.values:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            f"Notification type {notifications_type} does not exist."
                        ]
                    },
                )
            try:
                referral.add_user_by_role(
                    user=user,
                    created_by=request.user,
                    role=user_role,
                    notifications=notifications_type,
                )
            except TransitionNotAllowed:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            f"Transition ADD_USER not allowed from state {referral.state}."
                        ]
                    },
                )
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[
            UserIsReferralUnitMember
            | UserIsReferralRequester
            | UserIsFromUnitReferralRequesters
            | UserIsObserverAndReferralIsNotDraft
        ],
    )
    # pylint: disable=invalid-name
    def invite(self, request, pk):
        """
        Invite by email (i.e. the user never connected to the app i.e. not registered
        as user in our database) a person as a requester or observer in a referral.
        """
        invitation_email = request.data.get("email")
        try:
            validate_email(invitation_email)
        except ValidationError:
            return Response(
                status=400,
                data={"errors": [f"Email {invitation_email} not valid"]},
            )

        invitation_role = request.data.get("role")

        if invitation_role not in ReferralUserLinkRoles.values:
            return Response(
                status=400,
                data={"errors": [f"Invitation role {invitation_role} not allowed"]},
            )

        user_model = get_user_model()
        referral = self.get_object()

        try:
            # The guest already exists in our DB, just need to add him as a referral user
            # (requester or observer)
            guest = user_model.objects.get(
                email=invitation_email, username=invitation_email
            )
        except User.DoesNotExist:
            guest = user_model.objects.create(
                email=invitation_email, username=invitation_email
            )
            UserMapping.objects.create(id=guest.id, user=guest)

        try:
            referral_user_link = models.ReferralUserLink.objects.get(
                referral=referral, user__id=guest.id
            )
            if referral_user_link.role != invitation_role:
                referral_user_link.role = invitation_role
                referral_user_link.notifications = (
                    ReferralUserLink.get_default_notifications_type_for_role(
                        role=invitation_role
                    )
                )
                referral_user_link.save()

                if invitation_role == ReferralUserLinkRoles.REQUESTER:
                    signals.observer_deleted.send(
                        sender="api.referral.invite",
                        referral=referral,
                        created_by=request.user,
                        observer=guest,
                    )
                    signals.requester_added.send(
                        sender="api.referral.invite",
                        referral=referral,
                        requester=guest,
                        created_by=request.user,
                    )
                else:
                    signals.requester_deleted.send(
                        sender="api.referral.invite",
                        referral=referral,
                        created_by=request.user,
                        requester=guest,
                    )
                    signals.observer_added.send(
                        sender="api.referral.invite",
                        referral=referral,
                        observer=guest,
                        created_by=request.user,
                    )

        except models.ReferralUserLink.DoesNotExist:
            # CASE NEW REQUESTER
            try:
                referral.add_user_by_role(
                    user=guest,
                    created_by=request.user,
                    role=invitation_role,
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
        referral.save()

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
        permission_classes=[
            UserIsReferralUnitMember
            | UserIsFromUnitReferralRequesters
            | UserIsObserverAndReferralIsNotDraft
        ],
    )
    # pylint: disable=invalid-name
    def remove_user(self, request, pk):
        """
        Remove a user from referral observers.
        """
        referral = self.get_object()
        user_id = request.data.get("user")
        try:
            User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"User {user_id} does not exist."]},
            )

        # If the user is already a requester, transform the ReferralUserLink to observer role
        try:
            referral_user_link = models.ReferralUserLink.objects.get(
                referral=referral,
                user__id=user_id,
            )
            user_role = referral_user_link.role

            if (
                user_role == ReferralUserLinkRoles.REQUESTER
                and len(referral.get_requesters()) < 2
            ):
                return Response(
                    status=400,
                    data={
                        "errors": [
                            "The requester cannot be removed from the referral "
                            "if there is only one."
                        ]
                    },
                )
            try:
                referral.remove_user(referral_user_link, request.user)
            except TransitionNotAllowed:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            f"Transition REMOVE_USER with role {referral_user_link.role} "
                            f"not allowed from state {referral.state}."
                        ]
                    },
                )

        except models.ReferralUserLink.DoesNotExist:
            # No ReferralUserLink yet, create it
            return Response(
                status=400,
                data={
                    "errors": [
                        f"User {user_id} is not linked " f"to referral {referral.id}."
                    ]
                },
            )
        # At the end save the referral in order to reindex it into ES
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
        detail=True, methods=["post"], permission_classes=[UserIsReferralUnitMember]
    )
    # pylint: disable=invalid-name
    def update_topic(self, request, pk):
        """
        Change a referral's topic
        """

        # check topic not empty
        if not request.data.get("topic"):
            return Response(
                status=400,
                data={"errors": "topic is mandatory"},
            )

        # Get the new topic
        try:
            new_topic = models.Topic.objects.get(id=request.data.get("topic"))
        except models.Topic.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"topic {request.data['topic']} does not exist"]},
            )

        # Get the referral itself
        referral = self.get_object()
        try:
            referral.update_topic(new_topic=new_topic)

        except TransitionNotAllowed:
            return Response(
                status=400,
                data={"errors": [f"Cannot change topic from state {referral.state}."]},
            )

        return Response(data=ReferralSerializer(referral).data)

    @action(detail=True, methods=["post"], permission_classes=[UserIsStaff])
    # pylint: disable=invalid-name
    def update_answer_properties(self, request, pk):
        """
        Change a referral's answer properties for notes export purpose
        """
        value = request.data.get("value")
        # check topic not empty
        if not value:
            return Response(
                status=400,
                data={"errors": "value is mandatory"},
            )

        # Get the referral itself
        referral = self.get_object()
        referral.answer_properties = value
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True, methods=["post"], permission_classes=[UserIsReferralUnitMember]
    )
    # pylint: disable=invalid-name
    def update_status(self, request, pk):
        """
        Update a referral's status
        """

        # check status not empty
        if (
            not request.data.get("status")
            or not request.data.get("status") in models.ReferralStatus
        ):
            return Response(
                status=400,
                data={"errors": "status  is missing or doesn't exist"},
            )

        # Get the referral itself
        referral = self.get_object()

        try:
            referral.update_status(status=request.data.get("status"))

        except TransitionNotAllowed:
            return Response(
                status=400,
                data={"errors": [f"Cannot change status from state {referral.state}."]},
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

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember],
    )
    # pylint: disable=invalid-name
    def update_title(self, request, pk):
        """
        Update referral's title.
        """
        # Get the referral itself
        referral = self.get_object()

        # check title not empty
        if not request.data.get("title"):
            return Response(
                status=400,
                data={"errors": "Title is missing"},
            )
        try:
            referral.update_title(title=request.data.get("title"))
            referral.save()
        except TransitionNotAllowed:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Cannot update referral's title from state {referral.state}."
                    ]
                },
            )

        return Response(data=ReferralSerializer(referral).data)
