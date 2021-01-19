from datetime import timedelta
from time import perf_counter
import uuid

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralLiteApiTestCase(TestCase):
    """
    Test API routes and actions related to ReferralLite endpoints.
    """

    # LIST TESTS
    def test_list_referrals_by_anonymous_user(self):
        """
        Anonymous users cannot make list requests on the referral endpoints without passing
        any parameters.
        """
        response = self.client.get("/api/referrallites/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_by_random_logged_in_user(self):
        """
        Logged-in users cannot make list requests on the referral endpoints without passing
        any parameters.
        """
        user = factories.UserFactory()
        response = self.client.get(
            "/api/referrallites/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Referral list requests require parameters"]}
        )

    def test_list_referrals_by_admin_user(self):
        """
        Admin users cannot make list requests on the referral endpoints without passing
        any parameters.
        """
        user = factories.UserFactory(is_staff=True)
        response = self.client.get(
            "/api/referrallites/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Referral list requests require parameters"]}
        )

    def test_list_referrals_for_unit_by_anonymous_user(self):
        """
        Anonymous users cannot request lists of referrals for a unit.
        """
        unit = factories.UnitFactory()
        response = self.client.get(f"/api/referrallites/?unit={unit.id}")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_for_unit_by_random_logged_in_user(self):
        """
        Random logged-in users cannot request lists of referral for a unit they are
        not a part of.
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        response = self.client.get(
            f"/api/referrallites/?unit={unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referrals_for_unit_by_unit_member(self):
        """
        Unit members can get the list of referrals for their unit.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)
        referrals = [
            factories.ReferralFactory(
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        response = self.client.get(
            f"/api/referrallites/?unit={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_for_unit_by_unit_member_performance(self):
        """
        Make the request with a large number of referrals to make sure the number of queries
        is not overwhelming and the duration stays in the acceptable range.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)
        factories.ReferralFactory.create_batch(100, topic=topic)

        with self.assertNumQueries(10):
            pre_response = perf_counter()
            response = self.client.get(
                f"/api/referrallites/?unit={topic.unit.id}",
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
            )
            post_response = perf_counter()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 100)
        self.assertLess(post_response - pre_response, 0.4)

    def test_list_referrals_for_nonexistent_unit(self):
        """
        The API returns a 400 error when the unit in the parameters cannot be found.
        """
        user = factories.UserFactory()
        id = uuid.uuid4()
        response = self.client.get(
            f"/api/referrallites/?unit={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"errors": [f"Unit {id} does not exist."]})

    def test_list_referrals_for_user_by_anonymous_user(self):
        """
        Anonymous users cannot request lists of referrals for a user.
        """
        user = factories.UserFactory()
        response = self.client.get(f"/api/referrallites/?user={user.id}")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_for_user_by_random_logged_in_user(self):
        """
        Random logged-in users cannot request lists of referral for a user who
        is not them.
        """
        user = factories.UserFactory()
        other_user = factories.UserFactory()
        response = self.client.get(
            f"/api/referrallites/?user={other_user.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referrals_for_user_by_themselves(self):
        """
        Users members can get the list of referrals for themselves.
        """
        user = factories.UserFactory()
        referrals = [
            factories.ReferralFactory(
                user=user,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                user=user,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        response = self.client.get(
            f"/api/referrallites/?user={user.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_for_user_by_themselves_performance(self):
        """
        Make the request with a large number of referrals to make sure the number of queries
        is not overwhelming and the duration stays in the acceptable range.
        """
        user = factories.UserFactory()
        factories.ReferralFactory.create_batch(100, user=user)

        with self.assertNumQueries(9):
            pre_response = perf_counter()
            response = self.client.get(
                f"/api/referrallites/?user={user.id}",
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
            )
            post_response = perf_counter()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 100)
        self.assertLess(post_response - pre_response, 0.4)

    def test_list_referrals_for_nonexistent_user(self):
        """
        The API returns a 400 error when the user in the parameters cannot be found.
        """
        user = factories.UserFactory()
        id = uuid.uuid4()
        response = self.client.get(
            f"/api/referrallites/?user={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"errors": [f"User {id} does not exist."]})
