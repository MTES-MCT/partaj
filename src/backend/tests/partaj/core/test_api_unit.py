from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories


class UnitApiTestCase(TestCase):
    """
    Test API routes and actions related to Unit endpoints.
    """

    # RETRIEVE TESTS
    def test_retrieve_unit_from_anonymous_user(self):
        """
        Anonymous users cannot retrieve an existing unit.
        """
        unit = factories.UnitFactory()

        response = self.client.get(f"/api/units/{unit.id}/")

        self.assertEqual(response.status_code, 401)

    def test_retrieve_unit_from_random_logged_in_user(self):
        """
        Random logged-in users cannot retrieve an existing unit.
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()

        response = self.client.get(
            f"/api/units/{unit.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)

    def test_retrieve_unit_from_unit_member(self):
        """
        Members of a given unit can retrieve it.
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        unit.members.add(user)

        response = self.client.get(
            f"/api/units/{unit.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(unit.id))
