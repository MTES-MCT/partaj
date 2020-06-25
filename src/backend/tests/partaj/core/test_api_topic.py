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
    def test_list_topics(self):
        """
        Logged-in users can list existing topics.
        """
        user = factories.UserFactory()
        factories.TopicFactory.create_batch(11)

        response = self.client.get(
            "/api/topics/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 11)
        self.assertEqual(len(response.json()["results"]), 11)

    def test_list_topics_by_anonymous_user(self):
        """
        Anonymous users cannot list existing topics.
        """
        factories.TopicFactory()
        response = self.client.get("/api/topics/?limit=999")

        self.assertEqual(response.status_code, 401)

    # RETRIEVE TESTS
    def test_retrieve_topic(self):
        """
        Logged-in users can retrieve an existing topic.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()

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
