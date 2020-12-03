from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class TaskApiTestCase(TestCase):
    """
    Test API routes and actions related to Task endpoints.
    """

    def test_list_tasks_to_process_by_anonymous_user(self):
        """
        Anonymous users cannot make requests for tasks to process.
        """
        response = self.client.get("/api/tasks/to_process/")

        self.assertEqual(response.status_code, 401)

    def test_list_tasks_to_process_by_unit_member(self):
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
            "/api/tasks/to_process/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"][0]["id"], expected_referrals[0].id,
        )
        self.assertEqual(
            response.json()["results"][1]["id"], expected_referrals[1].id,
        )

    def test_list_tasks_to_proccess_by_unit_owner(self):
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
            "/api/tasks/to_process/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], expected_referral.id)
