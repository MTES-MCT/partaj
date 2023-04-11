from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token

from partaj.core import factories
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.indexers import UsersIndexer
from partaj.core.index_manager import partaj_bulk

User = get_user_model()

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
        ES_INDICES_CLIENT.create(index=UsersIndexer().index_name)
        ES_INDICES_CLIENT.close(index=UsersIndexer().index_name)
        ES_INDICES_CLIENT.put_settings(
            body=UsersIndexer.ANALYSIS_SETTINGS, index=UsersIndexer().index_name
        )
        ES_INDICES_CLIENT.open(index=UsersIndexer().index_name)

        # Use the default users mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=UsersIndexer.mapping, index=UsersIndexer().index_name
        )

        # Actually insert our users in the index
        partaj_bulk(actions=UsersIndexer.get_es_documents())
        ES_INDICES_CLIENT.refresh()

    # LIST TESTS
    def test_list_userlites_from_anonymous_user(self):
        """
        Anonymous users cannot list existing users through the user lite list endpoint.
        """
        factories.UserFactory(first_name="Pierrick", last_name="Dupont")
        factories.UserFactory(first_name="Jean Pierre", last_name="Duchêne")
        factories.UserFactory(first_name="Henri", last_name="Pierret")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/userlites/?limit=999",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_userlites_from_logged_in_user(self):
        """
        Logged-in users can list existing users through the user lite list endpoint.
        """
        # Delete the admin user so we get a clean slate for our test
        User.objects.first().delete()
        current_user = factories.UserFactory(first_name="Jean", last_name="Doe")

        user_1 = factories.UserFactory(first_name="Pierrick", last_name="Dupont")
        user_2 = factories.UserFactory(first_name="Jean Pierre", last_name="Duchêne")
        user_3 = factories.UserFactory(first_name="Henri", last_name="Pierret")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/userlites/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=current_user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(response.json()["results"][0]["id"], str(user_3.id))
        self.assertEqual(response.json()["results"][1]["id"], str(current_user.id))
        self.assertEqual(response.json()["results"][2]["id"], str(user_2.id))
        self.assertEqual(response.json()["results"][3]["id"], str(user_1.id))

    def test_list_userlites_by_id_from_logged_in_user(self):
        """
        Logged-in users can filter users by id through the user lite list endpoint.
        """
        # Delete the admin user so we get a clean slate for our test
        User.objects.first().delete()
        current_user = factories.UserFactory(first_name="Jean", last_name="Doe")

        user_1 = factories.UserFactory(first_name="Pierrick", last_name="Dupont")
        factories.UserFactory(first_name="Jean Pierre", last_name="Duchêne")
        user_3 = factories.UserFactory(first_name="Henri", last_name="Pierret")

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/userlites/?limit=999&id={user_1.id}&id={user_3.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=current_user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], str(user_3.id))
        self.assertEqual(response.json()["results"][1]["id"], str(user_1.id))

    # AUTOCOMPLETE TESTS
    def test_autocomplete_users_from_anonymous_user(self):
        """
        Anonymous users cannot make autocompletion search requests for users.
        """
        factories.UserFactory(first_name="Pierrick", last_name="Dupont")
        factories.UserFactory(first_name="Jean Pierre", last_name="Duchêne")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/userlites/autocomplete/?limit=999&query=pierr",
        )
        self.assertEqual(response.status_code, 401)

    def test_autocomplete_users_from_logged_in_user(self):
        """
        Logged-in users can make autocompletion search requests for users.
        """
        current_user = factories.UserFactory(first_name="Jean", last_name="Doe")

        user_1 = factories.UserFactory(first_name="Pierrick", last_name="Dupont")
        user_2 = factories.UserFactory(first_name="Jean Pierre", last_name="Duchêne")
        user_3 = factories.UserFactory(first_name="Henri", last_name="Pierret")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/userlites/autocomplete/?limit=999&query=pierr",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=current_user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(response.json()["results"][0]["id"], str(user_2.id))
        self.assertEqual(response.json()["results"][1]["id"], str(user_3.id))
        self.assertEqual(response.json()["results"][2]["id"], str(user_1.id))
