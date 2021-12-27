import datetime
import uuid
from datetime import timedelta
from time import perf_counter
from unittest import mock

from django.test import TestCase
from django.utils import translation

import arrow
from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralLiteApiTestCase(TestCase):
    """
    Test API routes and actions related to ReferralLite endpoints.
    """

    # GENERIC LIST TESTS
    def test_list_referrals_by_anonymous_user(self):
        """
        Anonymous users cannot make list requests on the referral endpoints without passing
        any parameters.
        """
        response = self.client.get("/api/referrallites/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_by_random_logged_in_user(self):
        """
        Logged-in users can make requests for referrals, but will not receive referrals they have
        no permission to see.
        """
        user = factories.UserFactory()
        factories.ReferralFactory()
        response = self.client.get(
            "/api/referrallites/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_referrals_by_admin_user(self):
        """
        Admin users can make requests for referrals, but will not receive referrals they have
        no permission to see.
        """
        user = factories.UserFactory(is_staff=True)
        factories.ReferralFactory()
        response = self.client.get(
            "/api/referrallites/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    # LIST BY UNIT
    def test_list_referrals_for_unit_by_anonymous_user(self):
        """
        Anonymous users cannot request lists of referrals for a unit.
        """
        unit = factories.UnitFactory()
        response = self.client.get(f"/api/referrallites/?unit={unit.id}")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_for_unit_by_random_logged_in_user(self):
        """
        Random logged-in users can request lists of referral for a unit they are
        not a part of, but they will get an empty response as they are not allowed to
        see them.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        response = self.client.get(
            f"/api/referrallites/?unit={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

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

    def test_list_referrals_for_unit_by_unit_member_with_changed_assignment(self):
        """
        Make sure list referral lite requests also get units that are not associated
        with the referral topic.
        """
        user = factories.UserFactory()
        unit_2 = factories.UnitFactory()
        unit_2.members.add(user)
        referral = factories.ReferralFactory()
        referral.units.add(unit_2)

        response = self.client.get(
            f"/api/referrallites/?unit={unit_2.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], referral.id)

    def test_list_referrals_for_unit_by_unit_member_performance(self):
        """
        Make the request with a large number of referrals to make sure the number of queries
        is not overwhelming and the duration stays in the acceptable range.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)
        factories.ReferralFactory.create_batch(100, topic=topic)

        unit_id = topic.unit.id
        token = Token.objects.get_or_create(user=user)[0]
        with self.assertNumQueries(5):
            pre_response = perf_counter()
            response = self.client.get(
                f"/api/referrallites/?unit={unit_id}",
                HTTP_AUTHORIZATION=f"Token {token}",
            )
            post_response = perf_counter()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 100)
        self.assertLess(post_response - pre_response, 0.4)

    def test_list_referrals_for_more_than_one_unit(self):
        """
        Referral lists can be filtered for more than one unit, given the current user
        has permission to access all relevant referrals.
        """
        user = factories.UserFactory()
        topic_1 = factories.TopicFactory()
        topic_1.unit.members.add(user)
        topic_2 = factories.TopicFactory()
        topic_2.unit.members.add(user)
        referrals = [
            factories.ReferralFactory(
                topic=topic_1,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                topic=topic_2,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        response = self.client.get(
            f"/api/referrallites/?unit={topic_1.unit.id},{topic_2.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[2].id)

    def test_list_referrals_for_nonexistent_unit(self):
        """
        The API returns an empty result set when the request filters on a nonexistent unit.
        """
        user = factories.UserFactory()
        id = uuid.uuid4()
        factories.ReferralFactory()
        response = self.client.get(
            f"/api/referrallites/?unit={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_referrals_for_unit_for_one_assignee(self):
        """
        A filter for one unit can be combined with a filter for one assignee.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)

        assignee = factories.UserFactory()
        topic.unit.members.add(assignee)

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
        referrals[1].assignees.add(assignee)

        response = self.client.get(
            f"/api/referrallites/?unit={topic.unit.id}&assignee={assignee.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)

    def test_list_referrals_for_unit_by_two_assignees(self):
        """
        A filter for more one unit can be combined with a filter for more than one assignee.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)

        assignee_1 = factories.UserFactory()
        topic.unit.members.add(assignee_1)

        assignee_2 = factories.UserFactory()
        topic.unit.members.add(assignee_2)

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
            factories.ReferralFactory(
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]
        referrals[0].assignees.add(assignee_1)
        referrals[1].assignees.add(assignee_2)

        response = self.client.get(
            f"/api/referrallites/?unit={topic.unit.id}&assignee={assignee_1.id},{assignee_2.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_for_unit_for_one_nonexistent_assignee(self):
        """
        Attempts to filter with a UUID that does not belong to a user result in an empty
        list of results.
        We don't check for the existence of a user with this UUID as that would required
        an additional DB query just to raise a specific exception.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)

        id = uuid.uuid4()

        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )

        response = self.client.get(
            f"/api/referrallites/?unit={topic.unit.id}&assignee={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_referrals_for_unit_for_one_state(self):
        """
        A filter for one unit can be combined with a filter for one state.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)

        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.IN_VALIDATION,
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
            f"/api/referrallites/?unit={topic.unit.id}&state={models.ReferralState.IN_VALIDATION}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)

    def test_list_referrals_for_unit_for_more_than_one_state(self):
        """
        A filter for one unit can be combined with a filter for more than one state.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)

        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.IN_VALIDATION,
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
            factories.ReferralFactory(
                state=models.ReferralState.ANSWERED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        response = self.client.get(
            (
                f"/api/referrallites/?unit={topic.unit.id}"
                f"&state={models.ReferralState.IN_VALIDATION},{models.ReferralState.ANSWERED}"
            ),
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[2].id)

    def test_list_referrals_for_unit_for_invalid_state(self):
        """
        A filter for one unit can be combined with a filter for more than one state.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        topic.unit.members.add(user)

        factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )

        with translation.override("en"):
            response = self.client.get(
                f"/api/referrallites/?unit={topic.unit.id}&state=nonexistent",
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
                HTTP_ACCEPT_LANGUAGE="en",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": {
                    "state": [
                        "Select a valid choice. nonexistent is not one of the available choices."
                    ]
                }
            },
        )

    # LIST BY USER
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
        factories.ReferralFactory(
            post__users=[user],
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        response = self.client.get(
            f"/api/referrallites/?user={other_user.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_referrals_for_user_by_themselves(self):
        """
        Users can get the list of referrals for themselves.
        """
        user = factories.UserFactory()
        referrals = [
            factories.ReferralFactory(
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                post__users=[user],
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
        factories.ReferralFactory.create_batch(100, post__users=[user])

        user_id = user.id
        token = Token.objects.get_or_create(user=user)[0]
        with self.assertNumQueries(5):
            pre_response = perf_counter()
            response = self.client.get(
                f"/api/referrallites/?user={user_id}",
                HTTP_AUTHORIZATION=f"Token {token}",
            )
            post_response = perf_counter()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 100)
        self.assertLess(post_response - pre_response, 0.4)

    def test_list_referrals_for_more_than_one_user(self):
        """
        Referral list requests can be filtered by more than one user,
        provided the current user has permission to access the relevant referrals.
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
            (
                f"/api/referrallites/?user={referrals[0].users.first().id},"
                f"{referrals[1].users.first().id},{referrals[2].users.first().id}"
            ),
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[2].id)

    def test_list_referrals_for_nonexistent_user(self):
        """
        The API returns an empty result set when the request filters for
        a nonexistent user.
        """
        user = factories.UserFactory()
        id = uuid.uuid4()
        factories.ReferralFactory()
        response = self.client.get(
            f"/api/referrallites/?user={id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    # ANSWER SOON
    def test_list_referrals_to_answer_soon_by_anonymous_user(self):
        """
        Anonymous users cannot make requests for tasks to answer soon.
        """
        response = self.client.get("/api/referrallites/?task=answer_soon/")

        self.assertEqual(response.status_code, 401)

    def test_list_referrals_to_answer_soon_by_unit_member(self):
        """
        Unit members should receive only referrals for which they have been assigned
        that are due soon, no matter the current state of the referral.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, member of the unit
        user = factories.UserFactory()
        unit.members.add(user)
        # Another member of the unit
        colleague = factories.UserFactory()
        unit.members.add(colleague)
        # Referral to our user's unit with no assignee, to answer soon
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        # Referrals to our user's unit assigned to them, to answer soon
        expected_referral_1 = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=expected_referral_1, unit=unit, assignee=user
        )
        with mock.patch(
            "django.utils.timezone.now",
            mock.Mock(return_value=arrow.utcnow().shift(days=-14).datetime),
        ):
            expected_referral_2 = factories.ReferralFactory(
                state=models.ReferralState.ASSIGNED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=datetime.timedelta(days=21)
                ),
            )
        factories.ReferralAssignmentFactory(
            referral=expected_referral_2, unit=unit, assignee=user
        )
        # Referral to our user's unit, assigned to them, to answer at a later date
        late_referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=21)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=late_referral, unit=unit, assignee=user
        )
        # Referral to our user's unit, assigned to another member, to answer soon
        colleague_referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=colleague_referral, unit=unit, assignee=colleague
        )
        # Referral to our user's unit, assigned to them, with an associated validation request,
        # to answer soon
        expected_referral_3 = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=expected_referral_3, unit=unit, assignee=user
        )
        answer = factories.ReferralAnswerFactory(referral=expected_referral_3)
        factories.ReferralAnswerValidationRequestFactory(answer=answer)
        # Referral to answer soon, assigned to our user, already answered
        factories.ReferralFactory(
            state=models.ReferralState.ANSWERED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )

        self.assertEqual(models.Referral.objects.count(), 7)
        response = self.client.get(
            "/api/referrallites/?task=answer_soon",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(
            response.json()["results"][0]["id"],
            expected_referral_1.id,
        )
        self.assertEqual(
            response.json()["results"][1]["id"],
            expected_referral_3.id,
        )
        self.assertEqual(
            response.json()["results"][2]["id"],
            expected_referral_2.id,
        )

    def test_list_referrals_to_answer_soon_by_unit_owner(self):
        """
        Unit owners should receive all referrals whose due dates are close that are still open,
        and belong to their unit.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, owner of the unit
        user = factories.UserFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.OWNER
        )
        # Another member of the unit
        colleague = factories.UserFactory()
        unit.members.add(colleague)
        # Referral to our user's unit with no assignee, to answer soon
        expected_referral_1 = factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        # Referral to our user's unit with no assignee, to answer at a later date
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=21)
            ),
        )
        # Referrals to our user's unit assigned to them, to answer soon
        expected_referral_2 = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=expected_referral_2, unit=unit, assignee=user
        )
        # Referral to our user's unit, assigned to another member, to answer soon
        expected_referral_3 = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=expected_referral_3, unit=unit, assignee=colleague
        )
        # Referral to our user's unit, assigned to them, with an associated validation request,
        # to answer soon
        expected_referral_4 = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )
        answer = factories.ReferralAnswerFactory(referral=expected_referral_4)
        factories.ReferralAnswerValidationRequestFactory(answer=answer)
        # Referral to answer soon, assigned to our user, already answered
        factories.ReferralFactory(
            state=models.ReferralState.ANSWERED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=1)
            ),
        )

        self.assertEqual(models.Referral.objects.count(), 6)
        response = self.client.get(
            "/api/referrallites/?task=answer_soon",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(
            response.json()["results"][0]["id"],
            expected_referral_2.id,
        )
        self.assertEqual(
            response.json()["results"][1]["id"],
            expected_referral_3.id,
        )
        self.assertEqual(
            response.json()["results"][2]["id"],
            expected_referral_4.id,
        )
        self.assertEqual(
            response.json()["results"][3]["id"],
            expected_referral_1.id,
        )

    # ASSIGN
    def test_list_referrals_to_assign_by_anonymous_user(self):
        """
        Anonymous users cannot make requests for tasks to assign.
        """
        response = self.client.get("/api/referrallites/?task=assign")

        self.assertEqual(response.status_code, 401)

    def test_list_referrals_to_assign_by_unit_member(self):
        """
        Unit members can make requests for tasks to assign, but should have no such task.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, member of the unit
        user = factories.UserFactory()
        unit.members.add(user)
        # Referral to our user's unit with no assignee
        factories.ReferralFactory(topic=topic)

        self.assertEqual(models.Referral.objects.count(), 1)
        response = self.client.get(
            "/api/referrallites/?task=assign",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_referrals_to_assign_by_unit_owner(self):
        """
        Unit owners can request tasks to assign and get all referrals to their unit that are
        awaiting assignment.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, member of the unit
        user = factories.UserFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.OWNER
        )
        # Another member of the unit
        colleague = factories.UserFactory()
        unit.members.add(colleague)
        # Referrals to our user's unit with no assignee
        expected_referrals = [
            factories.ReferralFactory(
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=datetime.timedelta(days=7)
                ),
            ),
            factories.ReferralFactory(
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=datetime.timedelta(days=21)
                ),
            ),
        ]
        # Referral to our user's unit, assigned to them
        assigned_referral = factories.ReferralFactory(
            topic=topic,
            state=models.ReferralState.ASSIGNED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=assigned_referral, unit=unit, assignee=user
        )
        # Referral to our user's unit, assigned to a colleague
        colleague_referral = factories.ReferralFactory(
            topic=topic,
            state=models.ReferralState.ASSIGNED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=colleague_referral, unit=unit, assignee=colleague
        )
        # Referral where our user has a validation to perform
        validation_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        answer = factories.ReferralAnswerFactory(referral=validation_referral)
        factories.ReferralAnswerValidationRequestFactory(answer=answer, validator=user)

        self.assertEqual(models.Referral.objects.count(), 5)
        response = self.client.get(
            "/api/referrallites/?task=assign",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"][0]["id"],
            expected_referrals[0].id,
        )
        self.assertEqual(
            response.json()["results"][1]["id"],
            expected_referrals[1].id,
        )

    # PROCESS
    def test_list_referrals_to_process_by_anonymous_user(self):
        """
        Anonymous users cannot make requests for tasks to process.
        """
        response = self.client.get("/api/referrallites/?task=process")

        self.assertEqual(response.status_code, 401)

    def test_list_referrals_to_process_by_unit_member(self):
        """
        Unit members should receive only active referrals that are assigned to them
        and not yet submitted to validation.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, member of the unit
        user = factories.UserFactory()
        unit.members.add(user)
        # Another member of the unit
        colleague = factories.UserFactory()
        unit.members.add(colleague)
        # Referral to our user's unit with no assignee
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        # Referrals to our user's unit assigned to them
        expected_referrals = [
            factories.ReferralFactory(
                topic=topic,
                state=models.ReferralState.ASSIGNED,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=datetime.timedelta(days=7)
                ),
            ),
            factories.ReferralFactory(
                topic=topic,
                state=models.ReferralState.ASSIGNED,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=datetime.timedelta(days=21)
                ),
            ),
        ]
        for referral in expected_referrals:
            factories.ReferralAssignmentFactory(
                referral=referral, unit=unit, assignee=user
            )
        # Referral to our user's unit, assigned to another member
        colleague_referral = factories.ReferralFactory(
            topic=topic,
            state=models.ReferralState.ASSIGNED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=colleague_referral, unit=unit, assignee=colleague
        )
        # Referral to our user's unit, assigned to them, with an associated validation request
        validation_referral = factories.ReferralFactory(
            topic=topic,
            state=models.ReferralState.ASSIGNED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        answer = factories.ReferralAnswerFactory(referral=validation_referral)
        factories.ReferralAnswerValidationRequestFactory(answer=answer)

        self.assertEqual(models.Referral.objects.count(), 5)
        response = self.client.get(
            "/api/referrallites/?task=process",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"][0]["id"],
            expected_referrals[0].id,
        )
        self.assertEqual(
            response.json()["results"][1]["id"],
            expected_referrals[1].id,
        )

    def test_list_referrals_to_proccess_by_unit_owner(self):
        """
        Make sure other tasks for unit owners (such as assignments & validations) do not appear
        in the endpoint for processing tasks.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, owner of the unit
        user = factories.UserFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.OWNER
        )
        # Referral our user has to assign
        factories.ReferralFactory(topic=topic)
        # Referral our user has to process
        expected_referral = factories.ReferralFactory(
            topic=topic, state=models.ReferralState.ASSIGNED
        )
        factories.ReferralAssignmentFactory(
            referral=expected_referral, unit=unit, assignee=user
        )
        # Referral our user has to validate
        referral_to_validate = factories.ReferralFactory()
        answer = factories.ReferralAnswerFactory(referral=referral_to_validate)
        factories.ReferralAnswerValidationRequestFactory(answer=answer, validator=user)

        self.assertEqual(models.Referral.objects.count(), 3)
        response = self.client.get(
            "/api/referrallites/?task=process",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], expected_referral.id)

    # TO VALIDATE
    def test_list_referrals_to_validate_by_anonymous_user(self):
        """
        Anonymous users cannot make requests for tasks to validate.
        """
        response = self.client.get("/api/referrallites/?task=validate")

        self.assertEqual(response.status_code, 401)

    def test_list_referrals_to_validate_by_validator(self):
        """
        Logged-in users can get a list of the validations that are expected of them.

        NB: our user is part of a unit so we can make sure unit related referrals where
        their validation is not expected are not returned as validation tasks.
        """
        # Unit with a topic to match the referrals to it
        unit = factories.UnitFactory()
        topic = factories.TopicFactory(unit=unit)
        # Our logged in user, owner of the unit
        user = factories.UserFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.OWNER
        )
        # Referral our user has to assign
        factories.ReferralFactory(
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        # Referral our user has to process
        assigned_referral = factories.ReferralFactory(
            topic=topic,
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        factories.ReferralAssignmentFactory(
            referral=assigned_referral, unit=unit, assignee=user
        )
        # Referral from their own unit our user has to validate
        expected_referral_1 = factories.ReferralFactory(
            topic=topic,
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        answer_1 = factories.ReferralAnswerFactory(referral=expected_referral_1)
        factories.ReferralAnswerValidationRequestFactory(
            answer=answer_1, validator=user
        )
        # Referral from a separate unit our user has to validate
        expected_referral_2 = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=21)
            ),
        )
        answer_2 = factories.ReferralAnswerFactory(referral=expected_referral_2)
        factories.ReferralAnswerValidationRequestFactory(
            answer=answer_2, validator=user
        )
        # Referral our user already validated
        validated_referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        validated_answer = factories.ReferralAnswerFactory(referral=validated_referral)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=validated_answer, validator=user
        )
        factories.ReferralAnswerValidationResponseFactory(
            validation_request=validation_request
        )
        # Answered referral with a validation left open
        # Make sure it is not part of the referrals to validate list as it is already answered
        answered_referral = factories.ReferralFactory(
            state=models.ReferralState.ANSWERED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=datetime.timedelta(days=7)
            ),
        )
        answer_3 = factories.ReferralAnswerFactory(referral=answered_referral)
        factories.ReferralAnswerValidationRequestFactory(
            answer=answer_3, validator=user
        )

        self.assertEqual(models.Referral.objects.count(), 6)
        response = self.client.get(
            "/api/referrallites/?task=validate",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], expected_referral_1.id)
        self.assertEqual(response.json()["results"][1]["id"], expected_referral_2.id)

    def test_list_referrals_to_validate__by_logged_in_user_without_requests(self):
        """
        Logged-in users can get a list of the validations that are expected of them.
        The list just happens to be empty for a regular user with no validations.
        """
        user = factories.UserFactory()

        response = self.client.get(
            "/api/referrallites/?task=validate",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
