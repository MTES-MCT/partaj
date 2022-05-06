from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.indexers import ANALYSIS_SETTINGS, TopicsIndexer
from partaj.core.index_manager import partaj_bulk


ES_CLIENT = ElasticsearchClientCompat7to6(["elasticsearch"])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


class TopicApiTestCase(TestCase):
    """
    Test API routes and actions related to Topic endpoints.
    """

    @staticmethod
    def setup_elasticsearch():
        """
        Set up ES indices and their settings with existing instances.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index=TopicsIndexer.index_name)
        ES_INDICES_CLIENT.close(index=TopicsIndexer.index_name)
        ES_INDICES_CLIENT.put_settings(
            body=ANALYSIS_SETTINGS, index=TopicsIndexer.index_name
        )
        ES_INDICES_CLIENT.open(index=TopicsIndexer.index_name)

        # Use the default topics mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=TopicsIndexer.mapping, index=TopicsIndexer.index_name
        )

        # Actually insert our topics in the index
        partaj_bulk(actions=TopicsIndexer.get_es_documents())
        ES_INDICES_CLIENT.refresh()

    # LIST TESTS
    def test_list_topiclites_from_anonymous_user(self):
        """
        Anonymous users cannot list existing topics through the topic lite list endpoint.
        """
        root_topics = [
            factories.TopicFactory(name="First root topic"),
            factories.TopicFactory(name="Second root topic"),
        ]
        factories.TopicFactory(is_active=False)
        factories.TopicFactory(name="Child topic", parent=root_topics[0])

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/topiclites/?limit=999",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_topiclites_from_logged_in_user(self):
        """
        Logged-in users can list existing topics through the topic lite list endpoint.
        """
        user = factories.UserFactory()
        root_topics = [
            factories.TopicFactory(name="First root topic"),
            factories.TopicFactory(name="Second root topic"),
        ]
        factories.TopicFactory(is_active=False)
        factories.TopicFactory(name="Child topic", parent=root_topics[0])

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/topiclites/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(response.json()["results"][0]["name"], "First root topic")
        self.assertEqual(response.json()["results"][1]["name"], "Child topic")
        self.assertEqual(response.json()["results"][2]["name"], "Second root topic")

    def test_list_topiclites_by_id_from_logged_in_user(self):
        """
        Logged-in users can filter topics by id through the topic lite list endpoint.
        """
        user = factories.UserFactory()
        root_topics = [
            factories.TopicFactory(name="First root topic"),
            factories.TopicFactory(name="Second root topic"),
        ]
        factories.TopicFactory(is_active=False)
        child_topic = factories.TopicFactory(name="Child topic", parent=root_topics[0])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/topiclites/?limit=999&id={str(root_topics[0].id)}&id={str(child_topic.id)}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["name"], "First root topic")
        self.assertEqual(response.json()["results"][1]["name"], "Child topic")

    # AUTOCOMPLETE TESTS
    def test_autocomplete_topiclites_from_anonymous_user(self):
        """
        Anonymous users cannot make autocompletion search requests for existing topics.
        """
        root_topics = [
            factories.TopicFactory(name="First root topic"),
            factories.TopicFactory(name="Second root topic"),
        ]
        factories.TopicFactory(is_active=False)
        factories.TopicFactory(name="Child topic", parent=root_topics[0])

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/topiclites/autocomplete/?limit=999&query=root",
        )
        self.assertEqual(response.status_code, 401)

    def test_autocomplete_topiclites_from_logged_in_user(self):
        """
        Logged-in users can make autocompletion search requests for existing topics.
        """
        user = factories.UserFactory()
        root_topics = [
            factories.TopicFactory(name="First root topic"),
            factories.TopicFactory(name="Second root topic"),
        ]
        factories.TopicFactory(is_active=False)
        factories.TopicFactory(name="Child topic", parent=root_topics[0])

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/topiclites/autocomplete/?limit=999&query=second",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["name"], "Second root topic")
