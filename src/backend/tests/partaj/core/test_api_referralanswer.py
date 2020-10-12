from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models, serializers


class ReferralApiTestCase(TestCase):
    """
    Test API routes related to ReferralAnswer endpoints.
    """

    # CREATE TESTS
    def test_create_referralanswer_by_anonymous_user(self):
        """
        Anonymous users cannot create referral answers.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)

    def test_create_referralanswer_by_random_logged_in_user(self):
        """
        A random logged in user cannot create referral answers.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)

    def test_create_referralanswer_by_referral_linked_user(self):
        """
        The referral linked user cannot create referral answers.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)

    def test_create_referralanswer_by_referral_linked_unit_member(self):
        """
        Members of the relevant referral's linked unit can create a referral answer.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        referral.topic.unit.members.add(user)
        factories.ReferralActivityFactory(
            actor=user, referral=referral, verb=models.ReferralActivityVerb.ASSIGNED
        )
        self.assertEqual(models.ReferralActivity.objects.all().count(), 1)

        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # The referral answer was created
        self.assertEqual(response.status_code, 201)
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 1)
        answer = models.ReferralAnswer.objects.get(id=response.json()["id"])
        self.assertEqual(answer.state, models.ReferralAnswerState.DRAFT)
        self.assertEqual(answer.referral, referral)
        self.assertEqual(answer.created_by, user)
        # An activity object (and only one) was generated with the draft action
        self.assertEqual(models.ReferralActivity.objects.all().count(), 2)
        draft_activity = models.ReferralActivity.objects.get(
            verb=models.ReferralActivityVerb.DRAFT_ANSWERED
        )
        self.assertEqual(draft_activity.referral, referral)
        self.assertEqual(draft_activity.actor, user)
        self.assertEqual(
            str(draft_activity.item_content_object.id), response.json()["id"]
        )

    def test_create_referralanswer_with_content(self):
        """
        Make sure content is handled during referral answer creation.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        referral.topic.unit.members.add(user)
        factories.ReferralActivityFactory(
            actor=user, referral=referral, verb=models.ReferralActivityVerb.ASSIGNED
        )

        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id), "content": "some content string"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # The referral answer was created along with its attachments
        self.assertEqual(response.status_code, 201)
        answer = models.ReferralAnswer.objects.get(id=response.json()["id"])
        self.assertEqual(answer.content, "some content string")

    def test_create_referralanswer_from_received_state(self):
        """
        When an answer is created for a referral in the RECEIVED state, it is first assigned to
        the user who wrote that answer.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        referral.topic.unit.members.add(user)
        self.assertEqual(models.ReferralActivity.objects.all().count(), 0)

        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # The referral answer was created
        self.assertEqual(response.status_code, 201)
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 1)
        # An assignment object was created too
        assignment = models.ReferralAssignment.objects.get(referral=referral)
        self.assertEqual(assignment.assignee, user)
        self.assertEqual(assignment.created_by, user)
        self.assertEqual(assignment.unit, referral.topic.unit)
        # The referral was moved to state ASSIGNED
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        # Two activity objects were created: the assignment and the draft answer itself
        self.assertEqual(models.ReferralActivity.objects.all().count(), 2)
        assignment_activity = models.ReferralActivity.objects.get(
            verb=models.ReferralActivityVerb.ASSIGNED
        )
        self.assertEqual(assignment_activity.referral, referral)
        self.assertEqual(assignment_activity.actor, user)
        self.assertEqual(assignment_activity.item_content_object, user)
        draft_activity = models.ReferralActivity.objects.get(
            verb=models.ReferralActivityVerb.DRAFT_ANSWERED
        )
        self.assertEqual(draft_activity.referral, referral)
        self.assertEqual(draft_activity.actor, user)
        self.assertEqual(
            str(draft_activity.item_content_object.id), response.json()["id"]
        )

    def test_create_referralanswer_for_nonexistent_referral(self):
        """
        The request fails with a 404 when a user attempts to create an answer and provides
        a referral id that does not match an existing referral.
        """
        user = factories.UserFactory()
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": "42"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)
        self.assertEqual(models.ReferralActivity.objects.all().count(), 0)

    # UPDATE TESTS
    def test_update_referralanswer_by_anonymous_user(self):
        """
        Anonymous users cannot update referral answers.
        """
        answer = factories.ReferralAnswerFactory(
            content="initial content", state=models.ReferralAnswerState.DRAFT
        )
        response = self.client.put(
            f"/api/referralanswers/{answer.id}/",
            {
                **serializers.ReferralAnswerSerializer(answer).data,
                "content": "updated content",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        answer.refresh_from_db()
        self.assertEqual(answer.content, "initial content")

    def test_update_referralanswer_by_random_logged_in_user(self):
        """
        A random logged in users cannot update a referral answer.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            content="initial content", state=models.ReferralAnswerState.DRAFT
        )
        response = self.client.put(
            f"/api/referralanswers/{answer.id}/",
            {
                **serializers.ReferralAnswerSerializer(answer).data,
                "content": "updated content",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        answer.refresh_from_db()
        self.assertEqual(answer.content, "initial content")

    def test_update_referralanswer_by_referral_linked_user(self):
        """
        A linked user who is not the answer author cannot update a referral answer.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            content="initial content", state=models.ReferralAnswerState.DRAFT
        )
        answer.referral.topic.unit.members.add(answer.created_by)
        response = self.client.put(
            f"/api/referralanswers/{answer.id}/",
            {
                **serializers.ReferralAnswerSerializer(answer).data,
                "content": "updated content",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        answer.refresh_from_db()
        self.assertEqual(answer.content, "initial content")

    def test_update_referralanswer_by_author(self):
        """
        An answer's original author can update it.
        """
        answer = factories.ReferralAnswerFactory(
            content="initial content", state=models.ReferralAnswerState.DRAFT
        )
        answer.referral.topic.unit.members.add(answer.created_by)
        response = self.client.put(
            f"/api/referralanswers/{answer.id}/",
            {
                **serializers.ReferralAnswerSerializer(answer).data,
                "content": "updated content",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=answer.created_by)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        answer.refresh_from_db()
        self.assertEqual(answer.content, "updated content")

    def test_update_nonexistent_referralanswer(self):
        pass
