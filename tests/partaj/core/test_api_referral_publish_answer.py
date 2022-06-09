from unittest import mock
import uuid

from django.conf import settings
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiPublishAnswerTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "publish_answer" endpoint.
    """

    def test_publish_referral_answer_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot publish an answer for a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/publish_answer/",
            {"answer": answer.id},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_by_random_logged_in_user(self, mock_mailer_send):
        """
        Any random logged in user cannot publish an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_by_linked_user(self, mock_mailer_send):
        """
        The referral's creator cannot publish a draft answer themselves.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.PROCESSING, post__users=[user]
        )
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_by_linked_unit_member(self, mock_mailer_send):
        """
        Members of the linked unit can publish a draft answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        attachment_1 = factories.ReferralAnswerAttachmentFactory()
        attachment_1.referral_answers.add(answer)
        attachment_2 = factories.ReferralAnswerAttachmentFactory()
        attachment_2.referral_answers.add(answer)
        answer.refresh_from_db()
        self.assertEqual(answer.attachments.count(), 2)

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ANSWERED)
        self.assertEqual(response.json()["answers"][0]["content"], answer.content)
        self.assertEqual(
            response.json()["answers"][0]["state"], models.ReferralAnswerState.PUBLISHED
        )
        self.assertEqual(
            len(response.json()["answers"][0]["attachments"]),
            2,
        )
        self.assertEqual(response.json()["answers"][1]["content"], answer.content)
        self.assertEqual(
            response.json()["answers"][1]["state"], models.ReferralAnswerState.DRAFT
        )
        # Make sure the published answer was added to the related draft
        published_answer = models.ReferralAnswer.objects.get(
            id=response.json()["answers"][0]["id"]
        )
        answer.refresh_from_db()
        self.assertEqual(answer.published_answer, published_answer)
        self.assertEqual(published_answer.attachments.count(), 2)
        # An activity was created for this published answer
        self.assertEqual(
            str(
                models.ReferralActivity.objects.get(
                    verb=models.ReferralActivityVerb.ANSWERED
                ).item_content_object.id
            ),
            response.json()["answers"][0]["id"],
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)

        self.assertEqual(mock_mailer_send.call_count, 2)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "answer_sender": user.get_full_name(),
                            "case_number": referral.id,
                            "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}/answer",
                            "referral_topic_name": referral.topic.name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[1]),
            (
                (  # args
                    {
                        "params": {
                            "answer_sender": user.get_full_name(),
                            "case_number": referral.id,
                            "link_to_referral": (
                                f"https://partaj/app/unit/{referral.units.get().id}"
                                f"/referrals-list/referral-detail/{referral.id}/answer"
                            ),
                            "title": referral.object,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_ANSWERED_UNIT_OWNER_TEMPLATE_ID"
                        ],
                        "to": [{"email": unit_owner.email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_publish_nonexistent_referral_answer_by_linked_unit_member(
        self, mock_mailer_send
    ):
        """
        When a user (like a unit member) attempts to publish an answer that does not exist,
        they receive an error with an appropriate message.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        referral.units.get().members.add(user)
        some_uuid = uuid.uuid4()
        self.assertEqual(models.ReferralAnswer.objects.count(), 0)

        response = self.client.post(
            f"/api/referrals/{referral.id}/publish_answer/",
            {"answer": some_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"], [f"answer {some_uuid} does not exist"]
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 0)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_from_in_validation_state(self, mock_mailer_send):
        """
        A referral in the IN_VALIDATION state can go through the publish answer transition.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ANSWERED)
        self.assertEqual(response.json()["answers"][0]["content"], answer.content)
        self.assertEqual(
            response.json()["answers"][0]["state"], models.ReferralAnswerState.PUBLISHED
        )
        self.assertEqual(response.json()["answers"][1]["content"], answer.content)
        self.assertEqual(
            response.json()["answers"][1]["state"], models.ReferralAnswerState.DRAFT
        )
        # Make sure the published answer was added to the related draft
        published_answer = models.ReferralAnswer.objects.get(
            id=response.json()["answers"][0]["id"]
        )
        answer.refresh_from_db()
        self.assertEqual(answer.published_answer, published_answer)
        # An activity was created for this published answer
        self.assertEqual(
            str(
                models.ReferralActivity.objects.get(
                    verb=models.ReferralActivityVerb.ANSWERED
                ).item_content_object.id
            ),
            response.json()["answers"][0]["id"],
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "answer_sender": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}/answer",
                    "referral_topic_name": referral.topic.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID"
                ],
                "to": [{"email": referral.users.first().email}],
            }
        )

    def test_publish_referral_answer_from_received_state(self, mock_mailer_send):
        """
        A referral in the RECEIVED state cannot go through the publish answer transition.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition PUBLISH_ANSWER not allowed from state received."]},
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_from_assigned_state(self, mock_mailer_send):
        """
        A referral in the ASSIGNED state cannot go through the publish answer transition.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition PUBLISH_ANSWER not allowed from state assigned."]},
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_from_answered_state(self, mock_mailer_send):
        """
        A referral in the ANSWERED state cannot go through the publish answer transition.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition PUBLISH_ANSWER not allowed from state answered."]},
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_not_called()

    def test_publish_referral_answer_from_closed_state(self, mock_mailer_send):
        """
        A referral in the CLOSED state cannot go through the publish answer transition.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition PUBLISH_ANSWER not allowed from state closed."]},
        )
        self.assertEqual(models.ReferralAnswer.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()
