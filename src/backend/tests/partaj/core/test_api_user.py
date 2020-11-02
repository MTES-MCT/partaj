from django.test import TestCase
from rest_framework.authtoken.models import Token

from partaj.core import factories


class UserApiTestCase(TestCase):
    """
    Test API routes and actions related to User endpoints.
    """

    # LIST TESTS
    def test_list_users_by_anonymous_user(self):
        """
        Anonymous users cannot make list requests on user endpoints.
        """
        factories.UserFactory(
            first_name="Sherlock", last_name="Holmes", email="s.holmes@gmail.com"
        )
        factories.UserFactory(
            first_name="John", last_name="Watson", email="jwatson3@gmail.com"
        )
        response = self.client.get("/api/users/", {"query": "Sherlock"},)
        self.assertEqual(response.status_code, 401)

    def test_list_users_by_logged_in_user(self):
        """
        Anonymous users cannot make list requests on user endpoints.
        """
        user = factories.UserFactory()
        sherlock = factories.UserFactory(
            first_name="Sherlock", last_name="Holmes", email="s.holmes@gmail.com"
        )
        watson = factories.UserFactory(
            first_name="John", last_name="Watson", email="jwatson3@gmail.com"
        )

        # The search request returns the user from their first name
        response = self.client.get(
            "/api/users/",
            {"query": "Sherlock"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "first_name": "Sherlock",
                        "id": str(sherlock.id),
                        "last_name": "Holmes",
                    }
                ],
            },
        )

        # The earch request returns the user from their first & last name (even though they are
        # in two separate fields on the user object)
        response = self.client.get(
            "/api/users/",
            {"query": "John Watson"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], (str(watson.id)))

        # The earch request returns the user from their first & last name in another order (even
        # if the query is only partial)
        response = self.client.get(
            "/api/users/",
            {"query": "Holmes Sh"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], (str(sherlock.id)))

        # The earch request returns the user from just a part of their first name
        response = self.client.get(
            "/api/users/",
            {"query": "Sherl"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], (str(sherlock.id)))

        # The search request returns the user from their email address
        response = self.client.get(
            "/api/users/",
            {"query": "jwat"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], (str(watson.id)))
