from datetime import datetime, timedelta
from unittest import mock
import uuid

from django.conf import settings
from django.db import transaction
from django.test import TestCase
from django.utils import dateformat

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

    # REQUEST ANSWER VALIDATION TESTS
    def test_referral_request_answer_validation_by_anonymous_user(
        self, mock_mailer_send
    ):
        """
        Anonymous users cannot request a validation on an answer for a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_by_random_logged_in_user(
        self, mock_mailer_send
    ):
        """
        Any random logged in user cannot request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_by_linked_user(self, mock_mailer_send):
        """
        The linked user cannot request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.PROCESSING, post__users=[user]
        )
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_by_linked_unit_member(
        self, mock_mailer_send
    ):
        """
        Linked unit members can request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 1)
        # Make sure the validation request was built with the data we expect
        validation_request = models.ReferralAnswerValidationRequest.objects.get(
            answer=answer,
            validator=validator,
        )
        # An activity was created for this validation request
        self.assertEqual(
            models.ReferralActivity.objects.get(
                verb=models.ReferralActivityVerb.VALIDATION_REQUESTED
            ).item_content_object.id,
            validation_request.id,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID"
                ],
                "to": [{"email": validator.email}],
            }
        )

    def test_referral_request_duplicate_answer_validation(self, mock_mailer_send):
        """
        An error should be raised if a user attempts to request a validation for an answer from
        a user who was already requested one.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory(first_name="Alfred", last_name="Borden")

        # Create an existing validation request for the same answer and validator
        factories.ReferralAnswerValidationRequestFactory(
            answer=answer, validator=validator
        )
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 1
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Alfred Borden was already requested to validate this answer"]},
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 1)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_request_nonexistent_answer_validation_by_linked_unit_member(
        self, mock_mailer_send
    ):
        """
        An explicit error is raised when a unit member attempts to request a validation for an
        answer that does not exist.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        referral.units.get().members.add(user)
        random_uuid = uuid.uuid4()
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": random_uuid, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"], [f"answer {random_uuid} does not exist"]
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_by_linked_unit_member_from_nonexistent_user(
        self, mock_mailer_send
    ):
        """
        An explicit error is raised when a unit member attempts to request a validation from a
        user that does not exist.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        random_uuid = uuid.uuid4()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": random_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"], [f"user {random_uuid} does not exist"]
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_from_in_validation_state(
        self, mock_mailer_send
    ):
        """
        New answer validations can be requested for a referral already in the
        IN_VALIDATION state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 1)
        # Make sure the validation request was built with the data we expect
        validation_request = models.ReferralAnswerValidationRequest.objects.get(
            answer=answer,
            validator=validator,
        )
        # An activity was created for this validation request
        self.assertEqual(
            models.ReferralActivity.objects.get(
                verb=models.ReferralActivityVerb.VALIDATION_REQUESTED
            ).item_content_object.id,
            validation_request.id,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID"
                ],
                "to": [{"email": validator.email}],
            }
        )

    def test_referral_request_answer_validation_from_received_state(
        self, mock_mailer_send
    ):
        """
        New answer validations cannot be requested for a referral in the
        RECEIVED state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition REQUEST_ANSWER_VALIDATION not allowed from state received."
                ]
            },
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_from_assigned_state(
        self, mock_mailer_send
    ):
        """
        New answer validations cannot be requested for a referral in the
        ASSIGNED state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition REQUEST_ANSWER_VALIDATION not allowed from state assigned."
                ]
            },
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_from_answered_state(
        self, mock_mailer_send
    ):
        """
        New answer validations cannot be requested for a referral in the
        ANSWERED state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition REQUEST_ANSWER_VALIDATION not allowed from state answered."
                ]
            },
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_not_called()

    def test_referral_request_answer_validation_from_closed_state(
        self, mock_mailer_send
    ):
        """
        New answer validations cannot be requested for a referral in the
        CLOSED state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition REQUEST_ANSWER_VALIDATION not allowed from state closed."
                ]
            },
        )
        self.assertEqual(models.ReferralAnswerValidationRequest.objects.count(), 0)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()

    # PERFORM ANSWER VALIDATION TESTS
    def test_referral_perform_answer_validation_by_anonymous_user(
        self, mock_mailer_send
    ):
        """
        Anonymous users cannot perform a validation on an answer for a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_by_random_logged_in_user(
        self, mock_mailer_send
    ):
        """
        Any random logged in user cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_by_linked_user(self, mock_mailer_send):
        """
        The linked user cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION, post__users=[user]
        )
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_by_linked_unit_member(
        self, mock_mailer_send
    ):
        """
        Linked unit members cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        referral.units.get().members.add(user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_by_requested_validator_does_validate(
        self, mock_mailer_send
    ):
        """
        The user who is linked with the validation can validate the answer, regardless of
        their membership of the linked unit.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        # Add an assignee to make sure they receive the relevant email
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user
        referral.assignees.set([assignee])
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 1
        )
        # Make sure the validation response was built with the data we expect
        validation_request.refresh_from_db()
        self.assertEqual(
            validation_request.response.state,
            models.ReferralAnswerValidationResponseState.VALIDATED,
        )
        self.assertEqual(validation_request.response.comment, "some comment")
        self.assertEqual(
            models.ReferralActivity.objects.get(
                verb=models.ReferralActivityVerb.VALIDATED
            ).item_content_object.id,
            validation_request.id,
        )
        self.assertIsNotNone(validation_request.response)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "validator": validation_request.validator.get_full_name(),
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_VALIDATED_TEMPLATE_ID"
                ],
                "to": [{"email": assignee.email}],
            }
        )

    def test_referral_perform_answer_validation_by_requested_validator_does_not_validate(
        self, mock_mailer_send
    ):
        """
        The user who is linked with the validation can deny validation of the answer, regardless
        of their membership of the linked unit.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        # Add an assignee to make sure they receive the relevant email
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user
        referral.assignees.set([assignee])
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 1
        )
        # Make sure the validation response was built with the data we expect
        validation_request.refresh_from_db()
        self.assertEqual(
            validation_request.response.state,
            models.ReferralAnswerValidationResponseState.NOT_VALIDATED,
        )
        self.assertEqual(validation_request.response.comment, "some other comment")
        self.assertEqual(
            models.ReferralActivity.objects.get(
                verb=models.ReferralActivityVerb.VALIDATION_DENIED
            ).item_content_object.id,
            validation_request.id,
        )
        self.assertIsNotNone(validation_request.response)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "validator": validation_request.validator.get_full_name(),
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_NOT_VALIDATED_TEMPLATE_ID"
                ],
                "to": [{"email": assignee.email}],
            }
        )

    def test_referral_perform_answer_validation_with_nonexistent_request(
        self, mock_mailer_send
    ):
        """
        Validation cannot be performed (even by a linked unit member) when there is no existing
        validation request.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        answer = factories.ReferralAnswerFactory(
            referral=referral,
            state=models.ReferralAnswerState.DRAFT,
        )
        answer.referral.units.get().members.add(user)
        random_uuid = uuid.uuid4()
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": random_uuid,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"],
            [f"validation request {random_uuid} does not exist"],
        )
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_from_received_state(
        self, mock_mailer_send
    ):
        """
        Answer validations cannot be performed for referrals in the RECEIVED state, even
        if a validation request exists.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition PERFORM_ANSWER_VALIDATION not allowed from state received."
                ]
            },
        )
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(hasattr(validation_request, "response"), False)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_from_assigned_state(
        self, mock_mailer_send
    ):
        """
        Answer validations cannot be performed for referrals in the ASSIGNED state, even
        if a validation request exists.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition PERFORM_ANSWER_VALIDATION not allowed from state assigned."
                ]
            },
        )
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(hasattr(validation_request, "response"), False)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_from_processing_state(
        self, mock_mailer_send
    ):
        """
        Answer validations cannot be performed for referrals in the PROCESSING state, even
        if a validation request exists.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition PERFORM_ANSWER_VALIDATION not allowed from state processing."
                ]
            },
        )
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(hasattr(validation_request, "response"), False)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_from_answered_state(
        self, mock_mailer_send
    ):
        """
        Answer validations cannot be performed for referrals in the ANSWERED state, even
        if a validation request exists.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition PERFORM_ANSWER_VALIDATION not allowed from state answered."
                ]
            },
        )
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(hasattr(validation_request, "response"), False)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_not_called()

    def test_referral_perform_answer_validation_from_closed_state(
        self, mock_mailer_send
    ):
        """
        Answer validations cannot be performed for referrals in the CLOSED state, even
        if a validation request exists.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=referral,
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition PERFORM_ANSWER_VALIDATION not allowed from state closed."
                ]
            },
        )
        self.assertEqual(
            models.ReferralAnswerValidationResponse.objects.all().count(), 0
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(hasattr(validation_request, "response"), False)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()

    # PUBLISH ANSWER TESTS
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
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "answer_author": answer.created_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}",
                    "referral_topic_name": referral.topic.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ANSWERED_TEMPLATE_ID"],
                "to": [{"email": referral.users.first().email}],
            }
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
                    "answer_author": answer.created_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}",
                    "referral_topic_name": referral.topic.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ANSWERED_TEMPLATE_ID"],
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

    # ASSIGN TESTS
    def test_assign_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot perform actions, including assignments.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": "42", "unit": str(referral.units.get().id)},
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_referral_by_random_logged_in_user(self, mock_mailer_send):
        """
        Any random logged in user cannot assign a referral.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": "42", "unit": str(referral.units.get().id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_referral_by_linked_user(self, mock_mailer_send):
        """
        The referral's creator cannot assign it.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(
            post__users=[user], state=models.ReferralState.RECEIVED
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": "42", "unit": str(referral.units.get().id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_referral_by_linked_unit_member(self, mock_mailer_send):
        """
        Regular members of the linked unit cannot assign a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": "42", "unit": str(referral.units.get().id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_referral_by_linked_unit_organizer(self, mock_mailer_send):
        """
        Organizers of the linked unit can assign a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(response.json()["assignees"][0]["id"], str(assignee.id))
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"],
                "to": [{"email": assignee.email}],
            },
        )

    def test_assign_already_assigned_referral(self, mock_mailer_send):
        """
        A referral which was assigned to one user can be assigned to an additional one,
        staying in the ASSIGNED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        exsting_assignee = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.units.get()
        ).assignee
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 2)
        self.assertEqual(
            response.json()["assignees"][0]["id"],
            str(exsting_assignee.id),
        )
        self.assertEqual(
            response.json()["assignees"][1]["id"],
            str(assignee.id),
        )
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"],
                "to": [{"email": assignee.email}],
            },
        )

    def test_assign_referral_from_processing_state(self, mock_mailer_send):
        """
        New assignments can be added on a referral in the PROCESSING state, the referral
        then stays in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.PROCESSING)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(response.json()["assignees"][0]["id"], str(assignee.id))
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"],
                "to": [{"email": assignee.email}],
            },
        )

    def test_assign_referral_from_in_validation_state(self, mock_mailer_send):
        """
        New assignments can be added on a referral in the IN_VALIDATION state, the
        referral then stays in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(response.json()["assignees"][0]["id"], str(assignee.id))
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}"
                    ),
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"],
                "to": [{"email": assignee.email}],
            },
        )

    def test_assign_referral_from_answered_state(self, mock_mailer_send):
        """
        No new assignments can be added on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ASSIGN not allowed from state answered."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_referral_from_closed_state(self, mock_mailer_send):
        """
        No new assignments can be added on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.units.get()).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ASSIGN not allowed from state closed."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.assignees.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    # UNASSIGN TESTS
    def test_unassign_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot perform actions, including assignment removals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.units.get()
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignment": assignment.id},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot unassign an assignee from a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.units.get()
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignment": assignment.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot unassign an assignee from it.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, post__user=[user]
        )
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.units.get()
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignment": assignment.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot unassign anyone (incl. themselves)
        from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignee = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER
        ).user
        assignment = factories.ReferralAssignmentFactory(
            assignee=assignee,
            referral=referral,
            unit=referral.units.get(),
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignment": assignment.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment.assignee)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_by_linked_unit_organizer(self, _):
        """
        Organizers of the linked unit can unassign a member from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment.created_by

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.RECEIVED)
        self.assertEqual(response.json()["assignees"], [])
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(referral.assignees.count(), 0)

    def test_unassign_referral_still_assigned_state(self, _):
        """
        When a member is unassigned from a referral which has other assignees, the
        referral remains in state ASSIGNED instead of moving to RECEIVED.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment_to_remove = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment_to_remove.created_by
        assignment_to_keep = factories.ReferralAssignmentFactory(referral=referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment_to_remove.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(
            response.json()["assignees"][0]["id"], str(assignment_to_keep.assignee.id)
        )
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_from_processing_state(self, _):
        """
        Users can be unassigned from units in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment.created_by

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.PROCESSING)
        self.assertEqual(response.json()["assignees"], [])
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(referral.assignees.count(), 0)

    def test_unassign_referral_from_in_validation_state(self, _):
        """
        Users can be unassigned from units in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment.created_by

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(response.json()["assignees"], [])
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(referral.assignees.count(), 0)

    def test_unassign_referral_from_received_state(self, _):
        """
        Users cannot be unassigned from units in the RECEIVED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment.created_by

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition UNASSIGN not allowed from state received."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_from_answered_state(self, _):
        """
        Users cannot be unassigned from units in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment.created_by

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition UNASSIGN not allowed from state answered."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_from_closed_state(self, _):
        """
        Users cannot be unassigned from units in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral,
            unit=referral.units.get(),
        )
        user = assignment.created_by

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition UNASSIGN not allowed from state closed."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(referral.assignees.count(), 1)

    # ASSIGN UNIT TESTS

    def test_assign_unit_with_missing_explanation(self, mock_mailer_send):
        """
        Assign unit explanation is mandatory. Make sure the API returns an error when
        it is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.RECEIVED,
        )
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot assign units to referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot assign units to referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_linked_user(self, mock_mailer_send):
        """
        A referral's linked user cannot assign units to their referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, post__users=[user]
        )
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_linked_unit_member(self, mock_mailer_send):
        """
        A member of a referral's linked unit cannot assign units to referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_linked_unit_organizer(self, mock_mailer_send):
        """
        An organizer of a referral's linked unit can assign units to referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_nonexistent_unit(self, mock_mailer_send):
        """
        The request returns an error response when the user attempts to assign a unit
        that does not exist.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        random_uuid = uuid.uuid4()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": random_uuid,
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [f"Unit {random_uuid} does not exist."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_redundant_assignment(self, mock_mailer_send):
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        with transaction.atomic():
            response = self.client.post(
                f"/api/referrals/{referral.id}/assign_unit/",
                {
                    "unit": str(referral.units.get().id),
                    "assignunit_explanation": "La justification de l'affectation.",
                },
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"Unit {referral.units.get().id} is already assigned to referral."
                ]
            },
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_from_received_state(self, mock_mailer_send):
        """
        New unit assignments can be added on a referral in the RECEIVED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.RECEIVED)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_from_processing_state(self, mock_mailer_send):
        """
        New unit assignments can be added on a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.PROCESSING)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_from_in_validation_state(self, mock_mailer_send):
        """
        New unit assignments can be added on a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_from_answered_state(self, mock_mailer_send):
        """
        No new unit assignments can be added on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ASSIGN_UNIT not allowed from state answered."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_from_closed_state(self, mock_mailer_send):
        """
        No new unit assignments can be added on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ASSIGN_UNIT not allowed from state closed."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    # UNASSIGN UNIT TESTS
    def test_unassign_unit_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot unassign unit from referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/", {"unit": str(other_unit.id)}
        )

        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot unassign unit from referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_by_linked_user(self, mock_mailer_send):
        """
        A referral's linked user cannot unassign unit from referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, post__users=[user]
        )
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_by_linked_unit_member(self, mock_mailer_send):
        """
        A member of a referral's linked unit cannot unassign unit from referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_own_unit_referral_by_linked_unit_organizer(
        self, mock_mailer_send
    ):
        """
        An organizer in a referral's linked unit can unassign their own unit
        from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_another_unit_referral_by_linked_unit_organizer(
        self, mock_mailer_send
    ):
        """
        An organizer in a referral's linked unit can unassign another linked unit
        from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_with_only_one_linked_unit(self, mock_mailer_send):
        """
        A unit that is the only one assigned to a referral cannot be unassigned
        from said referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_with_assigned_member(self, mock_mailer_send):
        """
        A unit that has a member assigned to a referral cannot be unassigned
        from said referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user
        referral.assignees.add(user)

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_received_state(self, mock_mailer_send):
        """
        A referral in the RECEIVED state can have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_processing_state(self, mock_mailer_send):
        """
        A referral in the PROCESSING state can have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_in_validation_state(self, mock_mailer_send):
        """
        A referral in the IN_VALIDATION state can have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )

    def test_unassign_unit_referral_from_answered_state(self, mock_mailer_send):
        """
        A referral in the ANSWERED state cannot have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_closed_state(self, mock_mailer_send):
        """
        A referral in the CLOSED state cannot have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    # CHANGE URGENCY LEVEL TESTS
    def test_change_urgencylevel_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot change a referral's urgency level.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        new_urgencylevel = factories.ReferralUrgencyFactory()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
        )
        self.assertEqual(response.status_code, 401)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot change a referral's urgency level.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        new_urgencylevel = factories.ReferralUrgencyFactory()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_by_referral_linked_user(self, mock_mailer_send):
        """
        A referral's linked user cannot change the referral's urgency level.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )
        new_urgencylevel = factories.ReferralUrgencyFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_by_unit_member(self, mock_mailer_send):
        """
        A regular unit member cannot change a referral's urgency level.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_by_unit_admin(self, mock_mailer_send):
        """
        A unit admin can change a referral's urgency level.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        old_urgencylevel = referral.urgency_level
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the  urgency level is changed
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(new_urgencylevel.id, referral.urgency_level.id)

        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "created_by": user.get_full_name(),
                            "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}",
                            "message": "La justification du changement.",
                            "new_due_date": dateformat.format(
                                referral.get_due_date(), "j F Y"
                            ),
                            "old_due_date": dateformat.format(
                                referral.created_at + old_urgencylevel.duration, "j F Y"
                            ),
                            "topic": referral.topic.name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CHANGED_URGENCYLEVEL_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )

        # Check the urgencylevel history instance that was created
        urgencylevel_history = models.ReferralUrgencyLevelHistory.objects.get(
            referral=referral, new_referral_urgency=new_urgencylevel
        )
        self.assertEqual(
            "La justification du changement.",
            urgencylevel_history.explanation,
        )
        self.assertEqual(new_urgencylevel, urgencylevel_history.new_referral_urgency)
        self.assertEqual(old_urgencylevel, urgencylevel_history.old_referral_urgency)

    def test_change_urgencylevel_by_unit_owner(self, mock_mailer_send):
        """
        Unit owners can change a referral's urgency level.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        old_urgencylevel = referral.urgency_level
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the urgency level is changed
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(new_urgencylevel.id, referral.urgency_level.id)

        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "created_by": user.get_full_name(),
                            "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}",
                            "message": "La justification du changement.",
                            "new_due_date": dateformat.format(
                                referral.get_due_date(), "j F Y"
                            ),
                            "old_due_date": dateformat.format(
                                referral.created_at + old_urgencylevel.duration, "j F Y"
                            ),
                            "topic": referral.topic.name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CHANGED_URGENCYLEVEL_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )
        # Check the urgencylevel history instance that was created
        urgencylevel_history = models.ReferralUrgencyLevelHistory.objects.get(
            referral=referral, new_referral_urgency=new_urgencylevel
        )
        self.assertEqual(
            "La justification du changement.",
            urgencylevel_history.explanation,
        )
        self.assertEqual(new_urgencylevel, urgencylevel_history.new_referral_urgency)
        self.assertEqual(old_urgencylevel, urgencylevel_history.old_referral_urgency)

    def test_change_urgencylevel_wrong_urgencylevel_id(self, mock_mailer_send):
        """
        The urgency level parameter must point to an actual existing urgency level,
        otherwise the request errors out.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        new_urgencylevel_id = 0
        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel_id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(referral.urgency_level.id, 0)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_missing_urgencylevel_id(self, mock_mailer_send):
        """
        The request errors out when the urgency level ID parameter is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(""),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_missing_urgencylevel_explanation(
        self, mock_mailer_send
    ):
        """
        Urgencylevel explanation is mandatory
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()

        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_from_processing_state(self, mock_mailer_send):
        """
        The urgency level can be changed on a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        old_urgencylevel = referral.urgency_level
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the urgency level is changed
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(new_urgencylevel.id, referral.urgency_level.id)
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "created_by": user.get_full_name(),
                            "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}",
                            "message": "La justification du changement.",
                            "new_due_date": dateformat.format(
                                referral.get_due_date(), "j F Y"
                            ),
                            "old_due_date": dateformat.format(
                                referral.created_at + old_urgencylevel.duration, "j F Y"
                            ),
                            "topic": referral.topic.name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CHANGED_URGENCYLEVEL_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )
        # Check the urgencylevel history instance that was created
        urgencylevel_history = models.ReferralUrgencyLevelHistory.objects.get(
            referral=referral, new_referral_urgency=new_urgencylevel
        )
        self.assertEqual(
            "La justification du changement.",
            urgencylevel_history.explanation,
        )
        self.assertEqual(new_urgencylevel, urgencylevel_history.new_referral_urgency)
        self.assertEqual(old_urgencylevel, urgencylevel_history.old_referral_urgency)

    def test_change_urgencylevel_from_in_validation_state(self, mock_mailer_send):
        """
        The urgency level can be changed on a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        old_urgencylevel = referral.urgency_level
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the urgency level is changed
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.URGENCYLEVEL_CHANGED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(new_urgencylevel.id, referral.urgency_level.id)
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "created_by": user.get_full_name(),
                            "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}",
                            "message": "La justification du changement.",
                            "new_due_date": dateformat.format(
                                referral.get_due_date(), "j F Y"
                            ),
                            "old_due_date": dateformat.format(
                                referral.created_at + old_urgencylevel.duration, "j F Y"
                            ),
                            "topic": referral.topic.name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CHANGED_URGENCYLEVEL_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )
        # Check the urgencylevel history instance that was created
        urgencylevel_history = models.ReferralUrgencyLevelHistory.objects.get(
            referral=referral, new_referral_urgency=new_urgencylevel
        )
        self.assertEqual(
            "La justification du changement.",
            urgencylevel_history.explanation,
        )
        self.assertEqual(new_urgencylevel, urgencylevel_history.new_referral_urgency)
        self.assertEqual(old_urgencylevel, urgencylevel_history.old_referral_urgency)

    def test_change_urgencylevel_from_answered_state(self, mock_mailer_send):
        """
        The urgency level can be changed on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        old_urgencylevel = referral.urgency_level
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot change urgency level from state answered."]},
        )
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(referral.urgency_level.id, old_urgencylevel.id)
        mock_mailer_send.assert_not_called()

    def test_change_urgencylevel_from_closed_state(self, mock_mailer_send):
        """
        The urgency level can be changed on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()
        old_urgencylevel = referral.urgency_level
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot change urgency level from state closed."]},
        )
        # Make sure the urgency level is unchanged
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        self.assertEqual(models.ReferralUrgencyLevelHistory.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(referral.urgency_level.id, old_urgencylevel.id)
        mock_mailer_send.assert_not_called()

    # CLOSE REFERRAL TESTS
    def test_close_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot refuse a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification du refus."},
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.RECEIVED,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_close_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged in users cannot close a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification du refus."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.RECEIVED,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_close_by_linked_user(self, mock_mailer_send):
        """
        A referral's linked user can close their own referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )
        unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        activity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            activity.message,
            "La justification de la cloture.",
        )

        self.assertEqual(activity.actor, user)
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "closed_by": user.get_full_name(),
                            "link_to_referral": (
                                f"https://partaj/app/unit/{referral.units.get().id}"
                                f"/referrals-list/referral-detail/{referral.id}"
                            ),
                            "message": "La justification de la cloture.",
                            "referral_authors": referral.users.first().get_full_name(),
                            "topic": referral.topic.name,
                            "units": referral.units.get().name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CLOSED_FOR_UNIT_MEMBER_TEMPLATE_ID"
                        ],
                        "to": [{"email": unit_owner.user.email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_close_by_unit_member(self, mock_mailer_send):
        """
        A regular unit member cannot close a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification du refus."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.RECEIVED,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_close_by_unit_admin(self, mock_mailer_send):
        """
        Unit admins can close referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        activity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            activity.message,
            "La justification de la cloture.",
        )
        self.assertEqual(activity.actor, user)
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "closed_by": user.get_full_name(),
                            "link_to_referral": (
                                f"https://partaj/app/sent-referrals/referral-detail/{referral.id}"
                            ),
                            "message": "La justification de la cloture.",
                            "referral_authors": referral.users.first().get_full_name(),
                            "topic": referral.topic.name,
                            "units": referral.units.get().name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CLOSED_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_close_by_unit_owner(self, mock_mailer_send):
        """
        Unit owners can close referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        activity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            activity.message,
            "La justification de la cloture.",
        )
        self.assertEqual(activity.actor, user)
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "closed_by": user.get_full_name(),
                            "link_to_referral": (
                                f"https://partaj/app/sent-referrals/referral-detail/{referral.id}"
                            ),
                            "message": "La justification de la cloture.",
                            "referral_authors": referral.users.first().get_full_name(),
                            "topic": referral.topic.name,
                            "units": referral.units.get().name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CLOSED_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_close_with_missing_explanation(self, mock_mailer_send):
        """
        Closure explanation is mandatory. Make sure the API returns an error when
        it is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": ""},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.RECEIVED,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_close_from_received_state(self, mock_mailer_send):
        """
        Referrals in the RECEIVED state can be closed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        activity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            activity.message,
            "La justification de la cloture.",
        )
        self.assertEqual(activity.actor, user)
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "closed_by": user.get_full_name(),
                            "link_to_referral": (
                                f"https://partaj/app/sent-referrals/referral-detail/{referral.id}"
                            ),
                            "message": "La justification de la cloture.",
                            "referral_authors": referral.users.first().get_full_name(),
                            "topic": referral.topic.name,
                            "units": referral.units.get().name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CLOSED_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_close_from_processing_state(self, mock_mailer_send):
        """
        Referrals in the PROCESSING state can be closed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        activity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            activity.message,
            "La justification de la cloture.",
        )
        self.assertEqual(activity.actor, user)
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "closed_by": user.get_full_name(),
                            "link_to_referral": (
                                f"https://partaj/app/sent-referrals/referral-detail/{referral.id}"
                            ),
                            "message": "La justification de la cloture.",
                            "referral_authors": referral.users.first().get_full_name(),
                            "topic": referral.topic.name,
                            "units": referral.units.get().name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CLOSED_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_close_from_in_validation_state(self, mock_mailer_send):
        """
        Referrals in the IN_VALIDATION state can be closed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        activity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            activity.message,
            "La justification de la cloture.",
        )
        self.assertEqual(activity.actor, user)
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "closed_by": user.get_full_name(),
                            "link_to_referral": (
                                f"https://partaj/app/sent-referrals/referral-detail/{referral.id}"
                            ),
                            "message": "La justification de la cloture.",
                            "referral_authors": referral.users.first().get_full_name(),
                            "topic": referral.topic.name,
                            "units": referral.units.get().name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_CLOSED_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.users.first().email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_close_from_answered_state(self, mock_mailer_send):
        """
        Referrals in the ANSWERED state cannot be closed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Cannot close referral from state answered."]}
        )
        referral.refresh_from_db()
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(
            referral.state,
            models.ReferralState.ANSWERED,
        )
        mock_mailer_send.assert_not_called()

    def test_close_from_closed_state(self, mock_mailer_send):
        """
        Referrals in the CLOSED state cannot be closed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Cannot close referral from state closed."]}
        )
        referral.refresh_from_db()
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(mock_mailer_send.call_count, 0)
