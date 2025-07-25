from django.test import TestCase

from django_cas_ng.signals import cas_user_authenticated

from partaj.core.factories import UnitFactory, UnitMembershipFactory, UserFactory
from partaj.core.models.unit import UnitMembership, UnitMembershipRole
from partaj.users import signals  # noqa: F401 # pylint: disable=unused-import


class UsersTestCase(TestCase):
    """
    User model related tests.
    """

    def test_signal_assign_new_user_to_unit_owner(self):
        """
        if unit membersip is empty the new user is assigned as member
        """
        unit = UnitFactory()
        user = UserFactory(unit_name=unit.name)

        cas_user_authenticated.send(
            sender="manual",
            user=user,
            created=True,
            username=user.username,
        )

        membership = UnitMembership.objects.get(user=user, unit=unit)
        self.assertEqual(membership.role, UnitMembershipRole.OWNER)

    def test_signal_assign_new_user_to_unit_member(self):
        """
        If unit membership is not empty the new user is assigned as member
        """
        unit = UnitFactory(name="SG/DAJ/AJAG/AJAG1")
        UnitMembershipFactory(role=UnitMembershipRole.OWNER, unit=unit)
        new_member = UserFactory(unit_name=unit.name)

        cas_user_authenticated.send(
            sender="manual",
            user=new_member,
            created=True,
            username=new_member.username,
        )
        membership = UnitMembership.objects.get(user=new_member, unit=unit)

        self.assertEqual(membership.role, UnitMembershipRole.MEMBER)

    def test_signal_assign_new_user_to_unit_notexists(self):
        """
        if new user's unit doesn't exist: no assignment
        """
        UnitFactory()
        user = UserFactory()

        cas_user_authenticated.send(
            sender="manual",
            user=user,
            created=True,
            username=user.username,
        )
        self.assertEqual(UnitMembership.objects.exists(), False)

    def test_signal_not_assign_new_user_to_unit_member(self):
        """
        If user is from another ministry, he is not assigned to a unit
        """
        unit = UnitFactory(name="SG/DAJ/AJAG/AJAG1")
        UnitMembershipFactory(role=UnitMembershipRole.OWNER, unit=unit)
        new_member = UserFactory(unit_name="[AGRI]SG/DAJ/AJAG/AJAG1")

        cas_user_authenticated.send(
            sender="manual",
            user=new_member,
            created=True,
            username=new_member.username,
        )

        memberships = UnitMembership.objects.filter(user=new_member, unit=unit)

        self.assertEqual(len(memberships), 0)
