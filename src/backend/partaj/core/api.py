from django.contrib.auth import get_user_model

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .forms import ReferralForm
from . import models, serializers


class NotAllowed(BasePermission):
    """
    Utility permission class to deny all requests. This is used as a default to close
    requests to unsupported actions.
    """

    def has_permission(self, request, view):
        """
        Always deny permission.
        """
        return False


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
        return request.user in referral.topic.unit.get_organizers()


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
    serializer_class = serializers.ReferralSerializer

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
            return Response(
                status=201, data=serializers.ReferralSerializer(referral).data
            )

        else:
            return Response(status=400, data=form.errors)

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
        User = get_user_model()
        assignee = User.objects.get(id=request.data["assignee_id"])
        # Get the referral itself and call the assign transition
        referral = self.get_object()
        referral.assign(assignee=assignee, created_by=request.user)
        referral.save()

        return Response(data=serializers.ReferralSerializer(referral).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[UserIsReferralUnitMember | IsAdminUser],
    )
    def draft_answer(self, request, pk):
        """
        Create a draft answer to the referral.
        """
        # Get the referral and call the draft answer transition
        referral = self.get_object()
        referral.draft_answer(
            attachments=request.data.getlist("files"),
            content=request.data["content"],
            created_by=request.user,
        )
        referral.save()

        return Response(data=serializers.ReferralSerializer(referral).data)

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

        return Response(data=serializers.ReferralSerializer(referral).data)

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

        return Response(data=serializers.ReferralSerializer(referral).data)

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
        User = get_user_model()
        try:
            validator = User.objects.get(id=request.data["validator"])
        except User.DoesNotExist:
            return Response(
                status=400,
                data={"errors": [f"user {request.data['validator']} does not exist"]},
            )

        referral.request_answer_validation(
            answer=answer, requested_by=request.user, validator=validator
        )
        referral.save()

        return Response(data=serializers.ReferralSerializer(referral).data)

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
        User = get_user_model()
        assignee = User.objects.get(id=request.data["assignee_id"])
        # Get the referral itself and call the unassign transition
        referral = self.get_object()
        referral.unassign(assignee=assignee, created_by=request.user)
        referral.save()

        return Response(data=serializers.ReferralSerializer(referral).data)


class ReferralActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for referral activity.

    """

    permission_classes = [IsAuthenticated]
    queryset = models.ReferralActivity.objects.all()
    serializer_class = serializers.ReferralActivitySerializer

    def list(self, request, *args, **kwargs):
        """
        Let users get a list of referral activities. Allow users to filter them by their related
        referral, and use the queryset & filter to manage what a given user is allowed to see.
        """
        referral_id = self.request.query_params.get("referral", None)
        if referral_id is None:
            return Response(
                status=400,
                data={
                    "errors": [
                        "ReferralActivity list requests need a referral parameter"
                    ]
                },
            )

        try:
            referral = models.Referral.objects.get(id=referral_id)
        except models.Referral.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        "ReferralActivity list requests must reference an existing referral"
                    ]
                },
            )

        # Filter the queryset to match the referral from the request parameters.
        queryset = self.queryset.filter(referral=referral)

        if request.user == referral.user:
            linked_user_visible_activities = [
                models.ReferralActivityVerb.ANSWERED,
                models.ReferralActivityVerb.ASSIGNED,
                models.ReferralActivityVerb.CREATED,
                models.ReferralActivityVerb.UNASSIGNED,
            ]
            queryset = queryset.filter(verb__in=linked_user_visible_activities)
        elif (
            request.user.is_staff
            or referral.topic.unit.members.filter(id=request.user.id).exists()
        ):
            # Unit members can see all activity types, there is no need to
            # further filter the queryset
            pass
        else:
            return Response(status=403)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        At the moment, we do not have an expected use case for retrieval requests on referral
        activity. Just reject the requests with a 400 error.
        """
        return Response(status=400)


class TopicViewSet(viewsets.ModelViewSet):
    """
    API endpoints for topics.
    """

    permission_classes = [NotAllowed]
    queryset = models.Topic.objects.all().order_by("name")
    serializer_class = serializers.TopicSerializer

    def get_queryset(self):
        """
        Enable filtering of topics by their linked unit.
        """
        queryset = self.queryset

        unit_id = self.request.query_params.get("unit", None)
        if unit_id is not None:
            queryset = queryset.filter(unit__id=unit_id)

        return queryset

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]


class UrgencyViewSet(viewsets.ModelViewSet):
    """
    API endpoints for urgencies.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralUrgency.objects.all().order_by("duration")
    serializer_class = serializers.ReferralUrgencySerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoints for users.
    """

    @action(detail=False)
    def whoami(self, request):
        """
        Get information on the current user. This is the only implemented user-related endpoint.
        """
        # If the user is not logged in, the request has no object. Return a 401 so the caller
        # knows they need to log in first.
        if not request.user.is_authenticated:
            return Response(status=401)

        # Serialize the user with a minimal subset of existing fields and return it.
        serialized_user = serializers.UserSerializer(request.user)
        return Response(data=serialized_user.data)
