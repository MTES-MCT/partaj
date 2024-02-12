import uuid

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class UnitMembershipApiTestCase(TestCase):
    """
    Test API routes and actions related to UnitMembership endpoints.
    """

    # LIST TESTS
    def test_list_unitmemberships_from_random_logged_in_user(self):
        """
        Unit memberships cannot be listed without a unit param.
        """
        factories.UnitMembershipFactory()
        user = factories.UserFactory()

        response = self.client.get(
            "/api/unitmemberships/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 404)

    def test_list_unitmemberships_for_unit_from_anonymous_user(self):
        """
        Anonymous users cannot list existing unit memberships.
        """
        membership = factories.UnitMembershipFactory()
        response = self.client.get(
            f"/api/unitmemberships/?limit=999&unit={membership.unit.id}"
        )

        self.assertEqual(response.status_code, 401)

    def test_list_unitmemberships_for_unit_from_random_logged_in_user(self):
        """
        Random logged in users can list existing unit memberships.
        """
        membership = factories.UnitMembershipFactory()
        other_memberships = factories.UnitMembershipFactory.create_batch(
            2, unit=membership.unit
        )
        user = factories.UserFactory()

        response = self.client.get(
            f"/api/unitmemberships/?limit=999&unit={membership.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(response.json()["results"][0]["id"], membership.id)
        self.assertEqual(response.json()["results"][1]["id"], other_memberships[0].id)
        self.assertEqual(response.json()["results"][2]["id"], other_memberships[1].id)

    def test_list_unitmemberships_for_unit_from_unit_member(self):
        """
        Unit members can list memberships for their unit.
        """
        membership = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER
        )
        other_memberships = factories.UnitMembershipFactory.create_batch(
            2, unit=membership.unit
        )

        response = self.client.get(
            f"/api/unitmemberships/?limit=999&unit={membership.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=membership.user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(response.json()["results"][0]["id"], membership.id)
        self.assertEqual(response.json()["results"][1]["id"], other_memberships[0].id)
        self.assertEqual(response.json()["results"][2]["id"], other_memberships[1].id)

    def test_list_unitmemberships_for_nonexistent_unit(self):
        """
        The request errors out when a user attempts to list memberships for a unit that
        does not exist.
        """
        membership = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER
        )

        id = uuid.uuid4()
        response = self.client.get(
            f"/api/unitmemberships/?limit=999&unit={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=membership.user)[0]}",
        )

        self.assertEqual(response.status_code, 404)
