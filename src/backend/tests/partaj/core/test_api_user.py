from django.test import TestCase
from rest_framework.authtoken.models import Token

from partaj.core import factories
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.indexers import ANALYSIS_SETTINGS, UsersIndexer
from partaj.core.index_manager import partaj_bulk

ES_CLIENT = ElasticsearchClientCompat7to6(["elasticsearch"])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


class UserApiTestCase(TestCase):
    """
    Test API routes and actions related to User endpoints.
    """

    @staticmethod
    def setup_elasticsearch():
        """
        Set up ES indices and their settings with existing instances.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="partaj_users")
        ES_INDICES_CLIENT.close(index="partaj_users")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="partaj_users")
        ES_INDICES_CLIENT.open(index="partaj_users")

        # Use the default users mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(body=UsersIndexer.mapping, index="partaj_users")

        # Actually insert our users in the index
        partaj_bulk(actions=UsersIndexer.get_es_documents())
        ES_INDICES_CLIENT.refresh()

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
        response = self.client.get(
            "/api/users/",
            {"query": "Sherlock"},
        )
        self.assertEqual(response.status_code, 401)

    def test_list_users_by_logged_in_user(self):
        """
        Anonymous users cannot make list requests on user endpoints.
        """
        user = factories.UserFactory()
        sherlock = factories.UserFactory(
            first_name="Sherlock",
            last_name="Holmes",
            email="s.holmes@gmail.com",
            unit_name="unite_1",
        )
        watson = factories.UserFactory(
            first_name="John",
            last_name="Watson",
            email="jwatson3@gmail.com",
            unit_name="unite_2",
        )

        # The search request returns the user from their unit_name
        response = self.client.get(
            "/api/users/",
            {"query": "unite_1", "type": "unit_name"},
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
                        "unit_name": sherlock.unit_name,
                    }
                ],
            },
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
                        "unit_name": sherlock.unit_name,
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

        # The search request returns the user when the case does not match
        response = self.client.get(
            "/api/users/",
            {"query": "sHerL"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], (str(sherlock.id)))

    # WHOAMI TESTS
    def test_whoami_by_anonymous_user(self):
        """
        Anonymous users can make `whoami` requests, and receive a 401 response confirming they
        are not logged in.
        """
        response = self.client.get("/api/users/whoami/")
        self.assertEqual(response.status_code, 401)

    def test_whoami_by_logged_in_user(self):
        """
        Logged-in users can make `whoami` requests and receive their own user object.
        """
        user = factories.UserFactory()
        factories.UnitMembershipFactory(user=user)
        response = self.client.get(
            "/api/users/whoami/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(user.id))
        self.assertEqual(
            response.json()["memberships"][0]["id"],
            user.unitmembership_set.first().id,
        )
        self.assertEqual(
            response.json()["memberships"][0]["unit_name"],
            user.unitmembership_set.first().unit.name,
        )
