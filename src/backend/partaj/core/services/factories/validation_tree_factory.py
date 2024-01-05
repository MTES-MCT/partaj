"""
ValidationTreeFactory handling version validators shown to the user
"""
from django.contrib.auth import get_user_model

from partaj.core.models import Referral, UnitMembership, UnitMembershipRole

User = get_user_model()


class ValidationTree:
    """
    Create a hierarchy tree displayed to a user for a referral report version
    """

    prioritized_roles = [
        UnitMembershipRole.MEMBER,
        UnitMembershipRole.OWNER,
        UnitMembershipRole.ADMIN,
        UnitMembershipRole.SUPERADMIN,
    ]

    def __init__(self, role):
        """
        A user can't ask for validation to a lower role as his own, we removed these.
        """
        index = ValidationTree.prioritized_roles.index(role)
        self.tree = {}
        self.roles = ValidationTree.prioritized_roles[
            index + 1 : len(self.prioritized_roles)
        ]

    def add_membership(self, membership: UnitMembership):
        """
        Method used to add a membership to a tree sorted by unit
        """
        role = membership.role

        if role in self.roles:
            if role not in self.tree:
                self.tree[role] = {}

            if membership.user.unit_name not in self.tree[role]:
                self.tree[role][membership.user.unit_name] = []

            self.tree[role][membership.user.unit_name] = list(
                set(
                    self.tree[role][membership.user.unit_name]
                    + [membership.user.get_full_name()]
                )
            )


class ValidationTreeFactory:
    """ValidationTreeFactory class"""

    @classmethod
    def create_from_referral(cls, referral: Referral, user: User):
        """
        Create a validation tree
        """
        validation_tree = ValidationTree(referral.get_user_role(user))
        print(validation_tree.roles)

        memberships = UnitMembership.objects.filter(
            role__in=validation_tree.roles,
            unit__in=referral.units.all(),
        )

        for membership in memberships:
            validation_tree.add_membership(membership)

        return validation_tree
