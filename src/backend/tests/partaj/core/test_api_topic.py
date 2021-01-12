import uuid

from django.test import TestCase
from rest_framework.authtoken.models import Token

from partaj.core import factories
from partaj.core.models import Topic
from partaj.core.serializers import TopicSerializer


class TopicApiTestCase(TestCase):
    """
    Test API routes and actions related to Topic endpoints.
    """

    # CREATE, UPDATE and DESTROY are not supported
    def test_create_topic(self):
        """
        The topic API does not support topic creation.
        """
        user = factories.UserFactory(is_staff=True)
        unit = factories.UnitFactory()

        response = self.client.post(
            "/api/topics/",
            {"name": "Example topic", "unit": unit.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Topic.objects.count(), 0)

    def test_update_topic(self):
        """
        The topic API does not support topic update.
        """
        user = factories.UserFactory(is_staff=True)
        topic = factories.TopicFactory(name="old topic name")

        response = self.client.put(
            f"/api/topics/{topic.id}/",
            {**TopicSerializer(topic).data, "name": "new topic name"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        topic.refresh_from_db()
        self.assertEqual(topic.name, "old topic name")

    def test_destroy_topic(self):
        """
        The topic API does not support topic deletion.
        """
        user = factories.UserFactory(is_staff=True)
        topic = factories.TopicFactory()

        response = self.client.delete(
            f"/api/topics/{topic.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Topic.objects.count(), 1)

    # LIST TESTS
    def test_list_topics_from_anonymous_user(self):
        """
        Anonymous users cannot list existing topics.
        """
        factories.TopicFactory()
        response = self.client.get("/api/topics/?limit=999")

        self.assertEqual(response.status_code, 401)

    def test_list_topics(self):
        """
        Logged-in users can list existing topics.
        """
        user = factories.UserFactory()
        root_topics = [
            factories.TopicFactory(name="First root topic"),
            factories.TopicFactory(name="Second root topic"),
        ]
        factories.TopicFactory(is_active=False)
        factories.TopicFactory(name="Child topic", parent=root_topics[0])

        response = self.client.get(
            "/api/topics/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(response.json()["results"][0]["name"], "First root topic")
        self.assertEqual(len(response.json()["results"][0]["children"]), 1)
        self.assertEqual(
            response.json()["results"][0]["children"][0]["name"], "Child topic"
        )
        self.assertEqual(response.json()["results"][1]["name"], "Child topic")
        self.assertEqual(len(response.json()["results"][1]["children"]), 0)
        self.assertEqual(response.json()["results"][2]["name"], "Second root topic")
        self.assertEqual(len(response.json()["results"][2]["children"]), 0)

    def test_list_topics_by_unit(self):
        """
        Logged-in users can list topics for a given unit.
        """
        user = factories.UserFactory()
        factories.TopicFactory.create_batch(2)

        unit = factories.UnitFactory()
        expected_topics = [
            factories.TopicFactory(name="First topic", unit=unit),
            factories.TopicFactory(name="Second topic", unit=unit),
        ]

        response = self.client.get(
            f"/api/topics/?limit=999&unit={unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"][0]["id"], str(expected_topics[0].id)
        )
        self.assertEqual(
            response.json()["results"][1]["id"], str(expected_topics[1].id)
        )

    def test_list_topics_by_search_query(self):
        """
        Logged-in users can search through topics with an arbitrary text query.
        """
        user = factories.UserFactory()

        factories.TopicFactory(name="The amazing topic")
        factories.TopicFactory(name="The topic that amazes")
        factories.TopicFactory(name="The boring old topic")

        response = self.client.get(
            "/api/topics/?limit=999&query=amaz",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["name"], "The amazing topic")
        self.assertEqual(response.json()["results"][1]["name"], "The topic that amazes")

    def test_list_topics_by_nonexistent_unit(self):
        """
        An appropriate error message is returned when a user attempts to list topics for a unit
        that does not exist.
        """
        user = factories.UserFactory()
        factories.TopicFactory.create_batch(2)

        id = uuid.uuid4()
        response = self.client.get(
            f"/api/topics/?limit=999&unit={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"errors": [f"Unit {id} does not exist."]})

    # RETRIEVE TESTS
    def test_retrieve_topic(self):
        """
        Logged-in users can retrieve an existing topic.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.refresh_from_db()

        response = self.client.get(
            f"/api/topics/{topic.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), TopicSerializer(topic).data)

    def test_retrieve_topic_by_anonymous_user(self):
        """
        Anonymous users cannot retrieve an existing topic.
        """
        topic = factories.TopicFactory()

        response = self.client.get(f"/api/topics/{topic.id}/",)

        self.assertEqual(response.status_code, 401)
