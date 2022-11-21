from datetime import datetime, timedelta, date
from unittest import mock

from django.test import TestCase
from partaj.core.models import ReferralState

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

    def test_retrieve_referral_by_requester(self, _):
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

    def test_retrieve_referral_by_a_requester_unit_partner(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = factories.UserFactory(
            unit_name="T1/T2/T3"
        )
        second_user = factories.UserFactory(
            unit_name="T1/T2/T3"
        )
        referral = factories.ReferralFactory(post__users=[user])

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=second_user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_draft_referral_by_a_requester(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = factories.UserFactory(
            unit_name="T1/T2/T3"
        )
        referral = factories.ReferralFactory(
            state=ReferralState.DRAFT,
            post__users=[user]
        )
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_a_requester_unit_chief(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = factories.UserFactory(
            unit_name="T1/T2/T3"
        )
        chief_user = factories.UserFactory(
            unit_name="T1/T2"
        )
        referral = factories.ReferralFactory(post__users=[user])

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief_user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_a_member_for_a_chief_requester(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = factories.UserFactory(
            unit_name="T1/T2/T3"
        )

        chief_user = factories.UserFactory(
            unit_name="T1/T2"
        )
        referral = factories.ReferralFactory(post__users=[chief_user])

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_retrieve_referral_by_an_observer(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=user,
            role=models.ReferralUserLinkRoles.OBSERVER
        )
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_user_with_same_unit_name_as_observer(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        observer_user = factories.UserFactory(
            unit_name="T1/T2/T3"
        )
        user = factories.UserFactory(
            unit_name="T1/T2"
        )
        referral = factories.ReferralFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=observer_user,
            role=models.ReferralUserLinkRoles.OBSERVER
        )

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

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
        self.assertEqual(referral.report, None)

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
        self.assertIsNotNone(referral.report.id)

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
        self.assertIsNone(referral.report)

    # FEATURE FLAG
    def test_retrieve_when_feature_flag_limit_day_is_today(self, _):
        """
        The feature starts today, it should be ON (i.e. return 1)
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(sent_at=datetime.now())
        referral.units.get().members.add(user)

        factories.FeatureFlagFactory(tag='referral_version', limit_date=date.today())

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)
        self.assertEqual(response.json()["feature_flag"], 1)

    def test_retrieve_when_feature_flag_limit_day_is_passed(self, _):
        """
        The feature started two days before, it should be OFF (i.e. return 0)
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(sent_at=datetime.now())
        referral.units.get().members.add(user)

        factories.FeatureFlagFactory(tag='referral_version', limit_date=date.today() - timedelta(days=2))

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)
        self.assertEqual(response.json()["feature_flag"], 1)

    def test_retrieve_when_feature_flag_limit_day_is_after(self, _):
        """
        The feature will start in two days, it should be OFF (i.e. return 0)
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(sent_at=datetime.now())
        referral.units.get().members.add(user)

        factories.FeatureFlagFactory(tag='referral_version', limit_date=date.today() + timedelta(days=2))

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)
        self.assertEqual(response.json()["feature_flag"], 0)

    def test_retrieve_when_feature_flag_do_not_exists(self, _):
        """
        There is no feature flag in DB, it should be OFF (i.e. return 0)
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(sent_at=datetime.now())
        referral.units.get().members.add(user)

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)
        self.assertEqual(response.json()["feature_flag"], 0)

    def test_retrieve_when_referral_is_not_sent_yet(self, _):
        """
        Referral is not sent yet, feature flag should be OFF (i.e. return 0)
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        referral.units.get().members.add(user)

        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)
        self.assertEqual(response.json()["feature_flag"], 0)
