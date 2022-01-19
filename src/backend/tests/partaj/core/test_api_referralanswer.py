from unittest import mock
import uuid

from django.test import TestCase

import arrow
from rest_framework.authtoken.models import Token

from partaj.core import factories, models, serializers


@mock.patch("partaj.core.email.Mailer.send")
class ReferralAnswerApiTestCase(TestCase):
    """
    Test API routes related to ReferralAnswer endpoints.
    """

    # CREATE TESTS
    def test_create_referralanswer_by_anonymous_user(self, _):
        """
        Anonymous users cannot create referral answers.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_create_referralanswer_by_random_logged_in_user(self, _):
        """
        A random logged in user cannot create referral answers.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_create_referralanswer_by_referral_linked_user(self, _):
        """
        The referral linked user cannot create referral answers.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_create_referralanswer_by_referral_linked_unit_member(self, _):
        """
        Members of the relevant referral's linked unit can create a referral answer.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        referral.units.get().members.add(user)
        factories.ReferralActivityFactory(
            actor=user, referral=referral, verb=models.ReferralActivityVerb.ASSIGNED
        )
        factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
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
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)

    def test_create_referralanswer_with_content(self, _):
        """
        Make sure content is handled during referral answer creation.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        referral.units.get().members.add(user)
        factories.ReferralActivityFactory(
            actor=user, referral=referral, verb=models.ReferralActivityVerb.ASSIGNED
        )

        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id), "content": "some content string"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 201)
        answer = models.ReferralAnswer.objects.get(id=response.json()["id"])
        self.assertEqual(answer.content, "some content string")

    def test_create_referralanswer_with_attachments(self, _):
        """
        Make sure attachments are handled during referral answer creatin (for revisions).
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        referral.units.get().members.add(user)
        existing_answer = factories.ReferralAnswerFactory(
            state=models.ReferralAnswerState.DRAFT
        )
        attachments = factories.ReferralAnswerAttachmentFactory.create_batch(3)
        for attachment in attachments:
            attachment.referral_answers.add(existing_answer)
        existing_answer.refresh_from_db()
        self.assertEqual(existing_answer.attachments.count(), 3)

        response = self.client.post(
            "/api/referralanswers/",
            {
                "referral": str(referral.id),
                "content": existing_answer.content,
                "attachments": [
                    serializers.ReferralAnswerAttachmentSerializer(
                        existing_answer.attachments.all()[0]
                    ).data,
                    serializers.ReferralAnswerAttachmentSerializer(
                        existing_answer.attachments.all()[1]
                    ).data,
                ],
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 201)
        new_answer = models.ReferralAnswer.objects.get(id=response.json()["id"])
        self.assertEqual(new_answer.attachments.count(), 2)
        self.assertEqual(response.json()["content"], existing_answer.content)
        self.assertEqual(
            response.json()["attachments"][0]["id"],
            str(existing_answer.attachments.all()[0].id),
        )
        self.assertEqual(
            response.json()["attachments"][1]["id"],
            str(existing_answer.attachments.all()[1].id),
        )
        self.assertNotEqual(existing_answer.id, new_answer.id)

    def test_create_referralanswer_from_received_state(self, _):
        """
        When an answer is created for a referral in the RECEIVED state, it is first assigned to
        the user who wrote that answer.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        referral.units.get().members.add(user)
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
        self.assertEqual(assignment.unit, referral.units.get())
        # The referral was moved to state PROCESSING
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
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

    def test_create_referralanswer_from_processing_state(self, _):
        """
        Answers can be created for referrals in the PROCESSING state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        referral.units.get().members.add(user)
        factories.ReferralActivityFactory(
            actor=user, referral=referral, verb=models.ReferralActivityVerb.ASSIGNED
        )
        factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
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
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)

    def test_create_referralanswer_from_in_validation_state(self, _):
        """
        Answers can be created for referrals in the IN_VALIDATION state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        referral.units.get().members.add(user)
        factories.ReferralActivityFactory(
            actor=user, referral=referral, verb=models.ReferralActivityVerb.ASSIGNED
        )
        factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
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
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)

    def test_create_referralanswer_from_answered_state(self, _):
        """
        Answers cannot be created for referrals in the ANSWERED state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        referral.units.get().members.add(user)
        self.assertEqual(models.ReferralActivity.objects.all().count(), 0)

        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # Neither the referral answer nor the activity were created
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition DRAFT_ANSWER not allowed from state answered."]},
        )
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)
        self.assertEqual(models.ReferralActivity.objects.all().count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)

    def test_create_referralanswer_from_closed_state(self, _):
        """
        Answers cannot be created for referrals in the CLOSED state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        referral.units.get().members.add(user)
        self.assertEqual(models.ReferralActivity.objects.all().count(), 0)

        response = self.client.post(
            "/api/referralanswers/",
            {"referral": str(referral.id)},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # Neither the referral answer nor the activity were created
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition DRAFT_ANSWER not allowed from state closed."]},
        )
        self.assertEqual(models.ReferralAnswer.objects.all().count(), 0)
        self.assertEqual(models.ReferralActivity.objects.all().count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)

    def test_create_referralanswer_for_nonexistent_referral(self, _):
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

    # LIST TESTS
    def test_list_referralanswers_by_anonymous_user(self, _):
        """
        Anonymous users cannot make list request for referral answers.
        """
        answer = factories.ReferralAnswerFactory(
            state=models.ReferralAnswerState.PUBLISHED
        )
        response = self.client.get(
            f"/api/referralanswers/?referral={answer.referral.id}"
        )
        self.assertEqual(response.status_code, 401)

    def test_list_referralanswers_by_random_logged_in_user(self, _):
        """
        Random logged-in users can make list requests for referral answers, will receive an
        empty response.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            state=models.ReferralAnswerState.PUBLISHED
        )

        response = self.client.get(
            f"/api/referralanswers/?referral={answer.referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"count": 0, "next": None, "previous": None, "results": []}
        )

    def test_list_referralanswers_by_referral_author(self, _):
        """
        Referral authors can get published answers for their referrals, but not
        the draft answers.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(post__users=[user])
        factories.ReferralAnswerFactory(
            referral=referral, state=models.ReferralAnswerState.DRAFT
        )
        published_answer = factories.ReferralAnswerFactory(
            referral=referral, state=models.ReferralAnswerState.PUBLISHED
        )

        response = self.client.get(
            f"/api/referralanswers/?referral={referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["id"], str(published_answer.id))

    def test_list_referralanswers_by_referral_author_missing_referral_param(self, _):
        """
        The API returns an error response when the referral parameter is missing.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(post__users=[user])
        factories.ReferralAnswerFactory(
            referral=referral, state=models.ReferralAnswerState.PUBLISHED
        )
        factories.ReferralAnswerFactory(state=models.ReferralAnswerState.PUBLISHED)

        response = self.client.get(
            "/api/referralanswers/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["ReferralAnswer list requests need a referral parameter"]},
        )

    def test_list_referralanswers_by_unit_member(self, _):
        """
        Referral unit members can get both draft & published answers for referrals
        their unit is linked with.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        referral.units.first().members.add(user)
        draft_answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
            created_at=arrow.utcnow().shift(days=-15).datetime,
        )
        published_answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.PUBLISHED,
            created_at=arrow.utcnow().shift(days=-7).datetime,
        )

        response = self.client.get(
            f"/api/referralanswers/?referral={referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], str(published_answer.id))
        self.assertEqual(response.json()["results"][1]["id"], str(draft_answer.id))

    def test_list_referralanswers_by_unit_member_missing_referral_param(self, _):
        """
        The API returns an error response when the referral parameter is missing.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        referral.units.first().members.add(user)
        factories.ReferralAnswerFactory(
            referral=referral, state=models.ReferralAnswerState.DRAFT
        )
        factories.ReferralAnswerFactory(
            referral=referral, state=models.ReferralAnswerState.PUBLISHED
        )

        response = self.client.get(
            "/api/referralanswers/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["ReferralAnswer list requests need a referral parameter"]},
        )

    # UPDATE TESTS
    def test_update_referralanswer_by_anonymous_user(self, _):
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

    def test_update_referralanswer_by_random_logged_in_user(self, _):
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

    def test_update_referralanswer_by_referral_linked_user(self, _):
        """
        A linked user who is not the answer author cannot update a referral answer.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            content="initial content", state=models.ReferralAnswerState.DRAFT
        )
        answer.referral.units.get().members.add(answer.created_by)
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

    def test_update_referralanswer_by_author(self, _):
        """
        An answer's original author can update it.
        """
        answer = factories.ReferralAnswerFactory(
            content="initial content", state=models.ReferralAnswerState.DRAFT
        )
        answer.referral.units.get().members.add(answer.created_by)
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

    def test_update_nonexistent_referralanswer(self, _):
        """
        An appropriate error is returned when a user attempts to update an answer
        that does not exist.
        """
        user = factories.UserFactory()
        nonexistent_answer_id = uuid.uuid4()
        response = self.client.put(
            f"/api/referralanswers/{nonexistent_answer_id}/",
            {"content": "updated content"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 404)

    # REMOVE ATTACHMENT TESTS
    def test_remove_attachment_by_anonymous_user(self, _):
        """
        Anonymous users cannot remove attachments from answers.
        """
        answer = factories.ReferralAnswerFactory(state=models.ReferralAnswerState.DRAFT)
        attachment = factories.ReferralAnswerAttachmentFactory()
        attachment.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

        response = self.client.post(
            f"/api/referralanswers/{answer.id}/remove_attachment/",
            {"attachment": attachment.id},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

    def test_remove_attachment_by_random_logged_in_user(self, _):
        """
        Random logged-in users cannot remove attachments from answers they did not author.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(state=models.ReferralAnswerState.DRAFT)
        attachment = factories.ReferralAnswerAttachmentFactory()
        attachment.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

        response = self.client.post(
            f"/api/referralanswers/{answer.id}/remove_attachment/",
            {"attachment": attachment.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

    def test_remove_attachment_by_referral_linked_user(self, _):
        """
        A given referral's linked user cannot remove attachments from answers to their referral.
        """
        answer = factories.ReferralAnswerFactory(state=models.ReferralAnswerState.DRAFT)
        user = answer.referral.users.first()
        attachment = factories.ReferralAnswerAttachmentFactory()
        attachment.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

        response = self.client.post(
            f"/api/referralanswers/{answer.id}/remove_attachment/",
            {"attachment": attachment.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

    def test_remove_attachment_by_referral_linked_unit_members(self, _):
        """
        Other unit members who are not the author cannot remove attachments from answers to
        a referral their unit is linked with.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(state=models.ReferralAnswerState.DRAFT)
        answer.referral.units.get().members.add(user)
        attachment = factories.ReferralAnswerAttachmentFactory()
        attachment.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

        response = self.client.post(
            f"/api/referralanswers/{answer.id}/remove_attachment/",
            {"attachment": attachment.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)

    def test_remove_attachment_by_author(self, _):
        """
        An answer's author can unattach an attachment from their answer.
        This does not delete the attachment object itself as it could be linked to other answers.
        """
        answer = factories.ReferralAnswerFactory(state=models.ReferralAnswerState.DRAFT)
        answer.referral.units.get().members.add(answer.created_by)
        (
            attachment_1,
            attachment_2,
        ) = factories.ReferralAnswerAttachmentFactory.create_batch(2)
        attachment_1.referral_answers.add(answer)
        attachment_2.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 2)

        response = self.client.post(
            f"/api/referralanswers/{answer.id}/remove_attachment/",
            {"attachment": attachment_1.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=answer.created_by)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["attachments"]), 1)
        self.assertEqual(response.json()["attachments"][0]["id"], str(attachment_2.id))
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 1)
        # The attachment object was not deleted, only unlinked from the answer
        self.assertEqual(
            models.ReferralAnswerAttachment.objects.filter(id=attachment_1.id).exists(),
            True,
        )

    def test_remove_attachment_from_published_answer(self, _):
        """
        Attachments cannot be removed from a published answer, even by the answer's author.
        """
        answer = factories.ReferralAnswerFactory(
            state=models.ReferralAnswerState.PUBLISHED
        )
        answer.referral.units.get().members.add(answer.created_by)
        (
            attachment_1,
            attachment_2,
        ) = factories.ReferralAnswerAttachmentFactory.create_batch(2)
        attachment_1.referral_answers.add(answer)
        attachment_2.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 2)

        response = self.client.post(
            f"/api/referralanswers/{answer.id}/remove_attachment/",
            {"attachment": attachment_1.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=answer.created_by)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["attachments cannot be removed from a published answer"]},
        )
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 2)

    def test_remove_non_linked_attachment(self, _):
        """
        An appropriate error is returned when a user attempts to remove an attachment from
        an answer that does not exist.
        """
        user = factories.UserFactory()
        nonexistent_answer_id = uuid.uuid4()
        attachment = factories.ReferralAnswerAttachmentFactory()
        response = self.client.post(
            f"/api/referralanswers/{nonexistent_answer_id}/remove_attachment/",
            {"attachment": attachment.id},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 404)
