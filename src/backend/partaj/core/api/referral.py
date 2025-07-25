# pylint: disable=C0302
# Too many lines in module

# pylint: disable=R0904, consider-using-set-comprehension
# Too many  public methods
"""
Referral related API endpoints.
"""
import copy
from datetime import datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q
from django.db.utils import IntegrityError

from django_cas_ng.models import UserMapping
from django_fsm import TransitionNotAllowed
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from sentry_sdk import capture_message

from partaj.core.models import (
    MemberRoleAccess,
    ReferralGroup,
    ReferralSection,
    ReferralSectionType,
    ReferralState,
    ReferralUserLink,
    RequesterUnitType,
    Topic,
)

from .. import models, signals
from ..forms import NewReferralForm, ReferralForm
from ..indexers import ES_INDICES_CLIENT
from ..serializers import ReferralSerializer, TopicSerializer
from .permissions import NotAllowed

from ..models import (  # isort:skip
    ReferralReport,
    ReferralUserLinkNotificationsTypes,
    ReferralUserLinkRoles,
    ReferralSatisfactionChoice,
    ReferralSatisfactionType,
    ReferralSatisfaction,
    is_central_unit,
)

User = get_user_model()


class UserIsReferralUnitMemberAndIsAllowed(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to referrals linked to their unit.
    """

    def has_permission(self, request, view):
        referral = view.get_object()

        if (
            request.user.is_authenticated
            and referral.units.filter(members__id=request.user.id).exists()
        ):
            unit_memberships = models.UnitMembership.objects.filter(
                user=request.user,
            ).all()

            roles = list(
                set([unit_membership.role for unit_membership in unit_memberships])
            )

            if len(roles) > 1:
                if not request.user.is_staff:
                    capture_message(
                        f"User {request.user.id} has been found with multiple roles",
                        "error",
                    )

            role = roles[0]

            # Unit members with member role has access to RECEIVED Referral depending on unit config
            if (
                role == models.UnitMembershipRole.MEMBER
                and referral.state == ReferralState.RECEIVED
            ):
                unit_member_role_accesses = list(
                    set(
                        [
                            unit_membership.unit.member_role_access
                            for unit_membership in unit_memberships
                        ]
                    )
                )

                if len(unit_member_role_accesses) > 1:
                    if not request.user.is_staff:
                        capture_message(
                            f"User {request.user.id} has been found with multiple "
                            f"member roles in units",
                            "error",
                        )

                if unit_member_role_accesses[0] == MemberRoleAccess.RESTRICTED:
                    return False

            return True
        return False


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
                    models.UnitMembershipRole.SUPERADMIN,
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


class ReferralIsDraftAndUserIsReferralRequester(BasePermission):
    """
    Permission class to authorize the referral author on API routes and/or actions related
    to a referral they request.
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return (
            referral.state == ReferralState.DRAFT
            and request.user
            in referral.users.filter(
                referraluserlink__role__in=[
                    ReferralUserLinkRoles.REQUESTER,
                    ReferralUserLinkRoles.OBSERVER,
                ]
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


class ReferralStateIsActive(BasePermission):
    """
    Permission class to authorize only if referral is in an active states
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return referral.state in [
            models.ReferralState.RECEIVED,
            models.ReferralState.RECEIVED_VISIBLE,
            models.ReferralState.RECEIVED_SPLITTING,
            models.ReferralState.SPLITTING,
            models.ReferralState.ASSIGNED,
            models.ReferralState.IN_VALIDATION,
            models.ReferralState.PROCESSING,
        ]


class ReferralStateIsSplitting(BasePermission):
    """
    Permission class to authorize only if referral is in a splitting state
    """

    def has_permission(self, request, view):
        referral = view.get_object()
        return referral.state in [
            models.ReferralState.SPLITTING,
            models.ReferralState.RECEIVED_SPLITTING,
        ]


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
                UserIsReferralUnitMemberAndIsAllowed
                | (UserIsObserverAndReferralIsNotDraft & ~ReferralStateIsSplitting)
                | (UserIsReferralRequester & ~ReferralStateIsSplitting)
                | (UserIsFromUnitReferralRequesters & ~ReferralStateIsSplitting)
            ]
        elif self.action in ["update", "send"]:
            permission_classes = [UserIsReferralRequester | UserIsReferralUnitMember]
        elif self.action in ["partial_update"]:
            permission_classes = [
                UserIsReferralRequester
                | (UserIsReferralUnitMember & ReferralStateIsActive)
            ]
        elif self.action in ["send_new"]:
            permission_classes = []
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
        Create an empty referral as the client issues a POST on the referral endpoint.
        """
        referral = models.Referral.objects.create()
        referral.users.set([request.user])
        referral.requester_unit_type = (
            RequesterUnitType.CENTRAL_UNIT
            if is_central_unit(request.user)
            else RequesterUnitType.DECENTRALISED_UNIT
        )
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
        referral.requester_unit_type = request.data.get("requester_unit_type")
        referral.requester_unit_contact = request.data.get("requester_unit_contact")

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

    def partial_update(self, request, *args, **kwargs):
        referral = self.get_object()
        serializer = ReferralSerializer(referral, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            referral.refresh_from_db()

            if "sub_title" in request.data:
                referral.update_subtitle(request.user)
            if "sub_question" in request.data:
                referral.update_subquestion(request.user)

            return Response(data=ReferralSerializer(referral).data)

        return Response(data="wrong parameters", status=400)

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
                referral.report = ReferralReport.objects.create()
                referral.sent_at = datetime.now()
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
        methods=["put"],
    )
    # pylint: disable=invalid-name
    def send_new(self, request, pk):
        """
        Validate, Update and Send a draft referral.
        """
        instance = self.get_object()
        users = instance.users.all()

        form = NewReferralForm(
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
                referral.report = ReferralReport.objects.create()
                referral.sent_at = datetime.now()
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
        permission_classes=[UserIsReferralUnitMember & ReferralStateIsActive],
    )
    # pylint: disable=invalid-name,too-many-locals
    def split(self, request, pk):
        """
        Subdivide a referral multiple parts
        """
        try:
            feature_flag = models.FeatureFlag.objects.get(tag="split_referral")
            if not datetime.now().date() >= feature_flag.limit_date:
                return Response(
                    status=400,
                    data={"errors": [("Not able to split the referral")]},
                )
        except models.FeatureFlag.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [("Unable to split the referral")]},
            )

        main_referral = self.get_object()

        try:
            # Meaning if the referral has not been split yet, it is a main referral
            referral_section = models.ReferralSection.objects.get(
                referral=main_referral
            )

            if referral_section.type == ReferralSectionType.SECONDARY:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            (f"Cannot split the secondary {main_referral.id} referral ")
                        ]
                    },
                )

            referral_group = referral_section.group

        except models.ReferralSection.DoesNotExist:
            # Create group
            referral_group = ReferralGroup.objects.create()

            # Create section for main Referral
            ReferralSection.objects.create(
                referral=main_referral,
                group=referral_group,
                type=ReferralSectionType.MAIN,
            )

        # Create a duplicated referral and add it to a section
        secondary_referral = copy.deepcopy(main_referral)
        secondary_referral.id = None

        if main_referral.state == ReferralState.RECEIVED:
            secondary_referral.state = ReferralState.RECEIVED_SPLITTING
        else:
            secondary_referral.state = ReferralState.SPLITTING

        secondary_referral.report = ReferralReport.objects.create()
        secondary_referral.save()

        for userlink in main_referral.referraluserlink_set.all():
            userlink_copy = copy.deepcopy(userlink)
            userlink_copy.id = None
            userlink_copy.referral = secondary_referral
            userlink_copy.save()

        for attachment in main_referral.attachments.all():
            attachment_copy = copy.deepcopy(attachment)
            attachment_copy.id = None
            attachment_copy.referral = secondary_referral
            attachment_copy.save()

        for unit_assignment in main_referral.referralunitassignment_set.all():
            unit_assignment_copy = copy.deepcopy(unit_assignment)
            unit_assignment_copy.id = None
            unit_assignment_copy.referral = secondary_referral
            unit_assignment_copy.save()

        secondary_referral.save()

        ReferralSection.objects.create(
            referral=secondary_referral,
            group=referral_group,
            type=ReferralSectionType.SECONDARY,
        )

        secondary_referral.create_split(request.user)

        return Response(data={"secondary_referral": secondary_referral.id}, status=201)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember & ReferralStateIsSplitting],
    )
    # pylint: disable=invalid-name
    def confirm_split(self, request, pk):
        """
        Confirm splitting referral
        """
        referral = self.get_object()

        try:
            referral.confirm_split(request.user)
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

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember & ReferralStateIsSplitting],
    )
    # pylint: disable=invalid-name
    def cancel_split(self, request, pk):
        """
        Cancel split referral
        """
        secondary_referral = self.get_object()

        try:
            # Meaning if the referral has not been split yet, it is a main referral
            referral_section = models.ReferralSection.objects.get(
                referral=secondary_referral
            )

            if referral_section.type == ReferralSectionType.MAIN:
                return Response(
                    status=400,
                    data={
                        "errors": [
                            (
                                "Cannot cancel split "
                                f"from this main {secondary_referral.id} referral "
                            )
                        ]
                    },
                )

            referral_group = referral_section.group

        except models.ReferralSection.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        (
                            "Unable to cancel split "
                            f"of an ungrouped {secondary_referral.id} referral "
                        )
                    ]
                },
            )

        secondary_referral.cancel_split(request.user)

        for attachment in secondary_referral.attachments.all():
            attachment.detach_file()

        secondary_referral.report.delete()
        secondary_referral.delete()

        if len(referral_group.sections.all()) == 1:
            referral_group.delete()

        ES_INDICES_CLIENT.refresh()

        return Response(status=200, data={"status": "DELETED"})

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
            guest = user_model.objects.get(email=invitation_email)
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
        unit = referral.units.filter(members__id=request.user.id).first()
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
        detail=True,
        methods=["patch"],
        permission_classes=[ReferralIsDraftAndUserIsReferralRequester],
    )
    # pylint: disable=invalid-name
    def patch_urgency_level(self, request, pk):
        """
        Change a referral's urgency level, keeping track of history and adding a new explanation.
        """

        if not request.data.get("urgency_level"):
            return Response(
                status=400,
                data={"errors": "new urgencylevel is mandatory"},
            )

        # Get the new urgencylevel
        try:
            new_referral_urgency = models.ReferralUrgency.objects.get(
                id=request.data.get("urgency_level")
            )
        except models.ReferralUrgency.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"urgencylevel {request.data['urgency_level']} does not exist"
                    ]
                },
            )

        # Get the referral itself
        referral = self.get_object()
        referral.urgency_level = new_referral_urgency
        referral.save()

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[
            UserIsReferralUnitMember | ReferralIsDraftAndUserIsReferralRequester
        ],
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
            referral.update_topic(new_topic=new_topic, created_by=request.user)

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
            referral.update_title(
                title=request.data.get("title"),
                created_by=request.user,
            )
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

    @action(
        detail=True,
        permission_classes=[UserIsReferralUnitMember],
    )
    # pylint: disable=invalid-name
    def topics(self, request, pk):
        """
        Get available referral's topics.
        """
        # Get the referral itself
        referral = self.get_object()

        # Get all active referral units' topics and current referral topic
        topics = (
            Topic.objects.filter(
                Q(unit__in=referral.units.all()) | Q(id=referral.topic.id)
            )
            .exclude(~Q(id=referral.topic.id) & Q(is_active=False))
            .order_by("path")
        )

        return Response(data=TopicSerializer(topics, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember],
    )
    # pylint: disable=invalid-name
    def satisfaction_request(self, request, pk):
        """
        Add a notation to the referral
        """
        # Get the referral itself
        referral = self.get_object()
        user = request.user
        user_role = referral.get_user_role(user)

        referral_satisfaction_choice = str(request.data.get("choice"))

        if referral_satisfaction_choice not in [
            choice[0] for choice in ReferralSatisfactionChoice.choices
        ]:
            return Response(
                status=400,
                data={
                    "errors": "Answer note is wrong. Please check your note parameter"
                },
            )

        if user in referral.satisfaction_survey_participants.all():
            return Response(
                status=400,
                data={"errors": "User has already send satisfaction survey"},
            )

        referral.satisfaction_survey_participants.add(user)
        referral.save()

        ReferralSatisfaction.objects.create(
            referral=referral,
            type=ReferralSatisfactionType.REQUEST,
            choice=referral_satisfaction_choice,
            role=user_role,
        )

        return Response(data=ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralRequester],
    )
    # pylint: disable=invalid-name
    def satisfaction_response(self, request, pk):
        """
        Add a notation to the referral
        """
        # Get the referral itself
        referral = self.get_object()
        user = request.user

        referral_satisfaction_choice = str(request.data.get("choice"))

        if referral_satisfaction_choice not in [
            choice[0] for choice in ReferralSatisfactionChoice.choices
        ]:
            return Response(
                status=400,
                data={
                    "errors": "Answer note is wrong. Please check your note parameter"
                },
            )

        if user in referral.satisfaction_survey_participants.all():
            return Response(
                status=400,
                data={"errors": "User has already send satisfaction survey"},
            )

        referral.satisfaction_survey_participants.add(user)
        referral.save()

        ReferralSatisfaction.objects.create(
            referral=referral,
            type=ReferralSatisfactionType.ANSWER,
            choice=referral_satisfaction_choice,
            role=ReferralUserLinkRoles.REQUESTER,
        )

        return Response(data=ReferralSerializer(referral).data)
