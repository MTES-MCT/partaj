"""
User related API endpoints.
"""
from django.contrib.auth import get_user_model
from django.db.models import F, Q, Value
from django.db.models.functions import Concat
from django.http import Http404

from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from .. import models
from ..serializers import UserLiteSerializer, UserSerializer
from .permissions import NotAllowed

User = get_user_model()


class UserViewSet(ReadOnlyModelViewSet):
    """
    API endpoints for users.
    """

    permission_classes = [NotAllowed]
    queryset = User.objects.all()
    serializer_class = UserLiteSerializer

    def get_permissions(self):
        """
        Manage permissions for built-in DRF methods, defaulting to the actions self defined
        permissions if applicable or to the ViewSet's default permissions.
        """
        if self.action in ["list"]:
            permission_classes = [IsAuthenticated]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """
        This endpoint is intended to allow search requests that target users. The purpose is
        to then use those users in actions.
        This means we need their ID and enough data to make the users recognizable, but nothing
        more than strictly necessary for this purpose.
        """
        query = request.query_params.get("query")
        search_type = request.query_params.get("type")

        if not query:
            return Response(
                status=400,
                data={"errors": ["list requests on users require a query parameter."]},
            )
        if search_type == "unit_name":
            queryset = (
                self.queryset.filter(unit_name__icontains=query)
                .distinct("unit_name")
                .exclude(Q(first_name=""))
            )

        else:
            # Filter on partial matches, "autocomplete style", but creating agregates of first name
            # and last name, and filtering on their first characters (as well as email's).
            queryset = (
                self.queryset.annotate(
                    first_then_last=Concat(F("first_name"), Value(" "), F("last_name")),
                    last_then_first=Concat(F("last_name"), Value(" "), F("first_name")),
                )
                .filter(
                    Q(first_then_last__istartswith=query)
                    | Q(last_then_first__istartswith=query)
                    | Q(email__istartswith=query)
                )
                .exclude(Q(first_then_last__exact=" "))
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, permission_classes=[])
    def list_unit_members(self, request):
        """
        Used for search requests in report conversation in order to notify a referral unit member
        """
        query = request.query_params.get("query")
        referral_id = request.query_params.get("referral")
        if not referral_id:
            return Response(
                status=400,
                data={"errors": ["list requests on users require a query parameter."]},
            )

        try:
            referral_units = models.Referral.objects.get(id=referral_id).units.all()

            def to_string(value):
                return str(value.id)

            user_ids = []
            for referral_unit in referral_units.iterator():
                yes = map(to_string, referral_unit.members.all())

                user_ids.extend(yes)

            user_unit_queryset = User.objects.filter(id__in=list(set(user_ids)))

            queryset = (
                user_unit_queryset.annotate(
                    first_then_last=Concat(F("first_name"), Value(" "), F("last_name")),
                    last_then_first=Concat(F("last_name"), Value(" "), F("first_name")),
                )
                .filter(
                    Q(first_then_last__istartswith=query)
                    | Q(last_then_first__istartswith=query)
                    | Q(email__istartswith=query)
                )
                .exclude(Q(first_then_last__exact=" "))
            )

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except models.Referral.DoesNotExist as error:
            raise Http404(
                f"Referral {request.data.get('referral')} not found"
            ) from error

    @action(detail=False, permission_classes=[])
    def whoami(self, request):
        """
        Get information on the current user. This is the only implemented user-related endpoint.
        """
        # If the user is not logged in, the request has no object. Return a 401 so the caller
        # knows they need to log in first.
        if not request.user.is_authenticated:
            return Response(status=401)

        # Serialize the user with a minimal subset of existing fields and return it.
        serialized_user = UserSerializer(request.user)
        return Response(data=serialized_user.data)
