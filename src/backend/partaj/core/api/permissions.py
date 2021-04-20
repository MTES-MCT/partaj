"""
DRF-based permissions to allow and deny requests to Partaj API endpoints.
"""
from django.http import Http404

from rest_framework.permissions import BasePermission

from .. import models


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


# GETTER MIXINS
# Provide shared helpers to get the needed information for the permissions
class RequestReferralGetMixin:
    """
    Mixin to enable permission classes to get the related referral, from its ID in the
    query params or as a property in the payload.
    """

    def get_referral(self, request, view):
        """
        Get the related referral for a given request, raise an error if it does not exist.
        """
        referral_id = request.data.get("referral") or request.query_params.get(
            "referral"
        )
        try:
            referral = models.Referral.objects.get(id=referral_id)
        except models.Referral.DoesNotExist as error:
            raise Http404(
                f"Referral {request.data.get('referral')} not found"
            ) from error

        return referral


class LinkedReferralGetMixin:
    """
    Mixins to enable permission classes to get the linked referral, as a foreign key
    on the current relevant object for the view.
    """

    def get_referral(self, request, view):
        """
        Use the current relevant object to get the referral.
        """
        return view.get_object().referral


# PERMISSION MIXINS
# Perform the actual permission check, without worrying about the source of the object
class ReferralLinkedUserPermissionMixin:
    """
    Mixin to grant permission to the referral's linked user.
    """

    def has_permission(self, request, view):
        """
        The exact user who created the referral has permission.
        """
        if not request.user.is_authenticated:
            return False

        referral = self.get_referral(request, view)
        return referral.user == request.user


class ReferralLinkedUnitMemberPermissionMixin:
    """
    Mixin to grant permissions to all members of all units linked to the referral.
    """

    def has_permission(self, request, view):
        """
        All members of any of the units linked to the referral have permission.
        """
        if not request.user.is_authenticated:
            return False

        referral = self.get_referral(request, view)
        return referral.units.filter(members__id=request.user.id).exists()


# API PERMISSIONS
# Combine getter and permission mixins to produce functioning DRF permission classes
class IsLinkedReferralLinkedUser(
    ReferralLinkedUserPermissionMixin,
    LinkedReferralGetMixin,
    BasePermission,
):
    """
    Permission that applies to a referral linked user, where the referral is found
    as a foreign key on the current relevant object.
    """


class IsRequestReferralLinkedUser(
    ReferralLinkedUserPermissionMixin,
    RequestReferralGetMixin,
    BasePermission,
):
    """
    Permission that applies to a referral linked user, where the referral is found
    through the `"referral"` field in a payload of the `"referral"` key in query params.
    """


class IsLinkedReferralLinkedUnitMember(
    ReferralLinkedUnitMemberPermissionMixin, LinkedReferralGetMixin, BasePermission
):
    """
    Permission that applies to all members of units linked to a referral, where the referral
    is found as a foreign key on the current relevant object.
    """


class IsRequestReferralLinkedUnitMember(
    ReferralLinkedUnitMemberPermissionMixin, RequestReferralGetMixin, BasePermission
):
    """
    Permission that applies to all members of units linked to a referral, where the
    referral is found through the `"referral"` field in a payload of the `"referral"`
    key in query params.
    """
