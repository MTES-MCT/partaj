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

    # LIST TESTS
    def test_list_units_from_anonymous_user(self):
        """
        Anonymous users cannot list existing units.
        """
        factories.UnitFactory()

        response = self.client.get("/api/units/")

        self.assertEqual(response.status_code, 401)

    def test_list_units_from_random_logged_in_user(self):
        """
        Any logged-in user can query the list of units and get a complete list.
        """
        user = factories.UserFactory()
        unit_1 = factories.UnitFactory(name="First unit")
        unit_2 = factories.UnitFactory(name="Second unit")

        response = self.client.get(
            "/api/units/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(unit_1.id),
                        "members": [],
                        "created_at": unit_1.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "name": "First unit",
                    },
                    {
                        "id": str(unit_2.id),
                        "members": [],
                        "created_at": unit_2.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "name": "Second unit",
                    },
                ],
            },
        )

    def test_list_units_with_autocomplete_query(self):
        """
        Lists of units can be filtered down, autocomplete-style, with a query parameter.
        """
        user = factories.UserFactory()
        unit_1 = factories.UnitFactory(name="First unit")
        factories.UnitFactory(name="Second unit")
        unit_3 = factories.UnitFactory(name="Fifth unit")

        response = self.client.get(
            "/api/units/?query=fi",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(unit_3.id),
                        "members": [],
                        "created_at": unit_3.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "name": "Fifth unit",
                    },
                    {
                        "id": str(unit_1.id),
                        "members": [],
                        "created_at": unit_1.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "name": "First unit",
                    },
                ],
            },
        )
