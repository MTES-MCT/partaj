from datetime import datetime, timedelta
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiTestCase(TestCase):
    """
    Test API routes and actions related to Referral endpoints.
    """

    # LIST TESTS
    def test_list_referrals_by_anonymous_user(self, _):
        """
        LIST requests for referrals are not allowed.
        """
        response = self.client.get("/api/referrals/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_by_random_logged_in_user(self, _):
        """
        LIST requests for referrals are not allowed.
        """
        user = factories.UserFactory()
        response = self.client.get(
            "/api/referrals/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    # RETRIEVE TESTS
    def test_retrieve_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot get a referral with the retrieve endpoint.
        """
        referral = factories.ReferralFactory()
        response = self.client.get(f"/api/referrals/{referral.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot get a referral with the retrieve endpoint.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory()
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_retrieve_referral_by_linked_user(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(post__users=[user])

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_linked_unit_member(self, _):
        """
        Members of the linked unit (through topic) can retrieve the referral.
        """
        user = factories.UserFactory()
        referral_urgency = factories.ReferralUrgencyFactory(duration=timedelta(days=7))
        with mock.patch(
            "django.utils.timezone.now",
            mock.Mock(return_value=datetime(2019, 9, 3, 11, 15, 0)),
        ):
            referral = factories.ReferralFactory(urgency_level=referral_urgency)

        referral.units.get().members.add(user)
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)
        # Make sure the urgency level and expected date are matching
        self.assertEqual(
            response.json()["urgency_level"],
            {
                "duration": "7 00:00:00",
                "id": referral_urgency.id,
                "index": referral_urgency.index,
                "name": referral_urgency.name,
                "requires_justification": referral_urgency.requires_justification,
            },
        )
        self.assertEqual(response.json()["created_at"], "2019-09-03T11:15:00Z")
        self.assertEqual(response.json()["due_date"], "2019-09-10T11:15:00Z")

    # CREATE TESTS
    def test_create_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot create a referral.
        """
        response = self.client.post("/api/referrals/")
        self.assertEqual(response.status_code, 401)

    def test_create_referral_by_random_logged_in_user(self, _):
        """
        Any logged-in user can create a referral using the CREATE endpoint.
        """
        user = factories.UserFactory()
        response = self.client.post(
            "/api/referrals/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)

        referral = models.Referral.objects.get(id=response.json()["id"])
        self.assertEqual([*referral.users.all()], [user])

    # SEND TESTS
    def test_send_referral_by_random_logged_in_user(self, _):
        """
        Any logged-in user can create a referral using the CREATE endpoint.
        """

        user = factories.UserFactory()
        topic = factories.TopicFactory()
        referral = factories.ReferralFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        form_data = {
            "object": "l'object",
            "context": "le contexte",
            "prior_work": "le travail prÃ©alable",
            "topic": str(topic.id),
            "urgency_level": str(urgency_level.id),
            "urgency_explanation": "la justification de l'urgence",
        }
        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_send_referral_by_requester_with_invalid_form(self, _):
        """
        If the form is invalid (for example, missing a required field), referral creation
        should fail.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)

        referral.users.set([user.id])
        form_data = {
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(topic.id),
            "urgency_level": str(urgency_level.id),
            "urgency_explanation": "la justification de l'urgence",
        }
        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"question": ["Ce champ est obligatoire."]},
        )
        self.assertEqual(referral.state, models.ReferralState.DRAFT)

    def test_send_referral_by_requester(self, _):
        """
        save referral and send it.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()

        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([user.id])
        form_data = {
            "question": "la question",
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(topic.id),
            "urgency_level": str(urgency_level.id),
            "urgency_explanation": "la justification de l'urgence",
        }
        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.question, "la question")
        self.assertEqual(referral.context, "le contexte")
        self.assertEqual(referral.object, "l'object")
        self.assertEqual(referral.prior_work, "le travail prÃ©alable")
        self.assertEqual(referral.urgency_explanation, "la justification de l'urgence")
        self.assertEqual(referral.urgency_level, urgency_level)
        self.assertEqual(referral.topic, topic)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    # UPDATE TESTS

    def test_update_referral_by_random_logged_in_user(self, _):
        """
        A random logged in users cannot update a referral.
        """
        user = factories.UserFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        topic = factories.TopicFactory()

        referral = factories.ReferralFactory(
            question="initial question",
            context="initial context",
            object=" initial object",
            topic=topic,
            prior_work=" initial prior_work",
            urgency_level=urgency_level,
            urgency_explanation="initial urgency_explanation",
            state=models.ReferralState.DRAFT,
        )

        response = self.client.put(
            f"/api/referrals/{referral.id}/",
            {
                "question": "updated question",
                "context": "updated context",
                "object": "updated object",
                "prior_work": "updated prior_work",
                "topic": str(topic.id),
                "urgency_level": str(urgency_level.id),
                "urgency_explanation": "updated urgency_explanation",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_update_referral_by_requester(self, _):
        """
        A random logged in users cannot update a referral.
        """
        user = factories.UserFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        new_urgency_level = factories.ReferralUrgencyFactory()
        topic = factories.TopicFactory()
        new_topic = factories.TopicFactory()

        referral = factories.ReferralFactory(
            question="initial question",
            context="initial context",
            object=" initial object",
            topic=topic,
            prior_work=" initial prior_work",
            urgency_level=urgency_level,
            urgency_explanation="initial urgency_explanation",
            state=models.ReferralState.DRAFT,
        )
        referral.users.set([user.id])

        response = self.client.put(
            f"/api/referrals/{referral.id}/",
            {
                "question": "updated question",
                "context": "updated context",
                "object": "updated object",
                "prior_work": "updated prior_work",
                "topic": str(new_topic.id),
                "urgency_level": str(new_urgency_level.id),
                "urgency_explanation": "updated urgency_explanation",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()

        self.assertEqual(referral.question, "updated question")
        self.assertEqual(referral.context, "updated context")
        self.assertEqual(referral.object, "updated object")
        self.assertEqual(referral.prior_work, "updated prior_work")
        self.assertEqual(referral.urgency_explanation, "updated urgency_explanation")
        self.assertEqual(referral.urgency_level, new_urgency_level)
        self.assertEqual(referral.topic, new_topic)
        self.assertEqual(referral.state, models.ReferralState.DRAFT)
