from datetime import datetime, timedelta
from io import BytesIO
from unittest import mock
import uuid

from django.db import transaction
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

        referral = factories.ReferralFactory(user=user)
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
                "is_default": referral_urgency.is_default,
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
        topic = factories.TopicFactory()

        form_data = {
            "context": "le contexte",
            "prior_work": "le travail préalable",
            "question": "la question posée",
            "requester": "le demandeur ou la demandeuse",
            "topic": str(topic.id),
        }
        response = self.client.post(
            "/api/referrals/",
            form_data,
        )
        self.assertEqual(response.status_code, 401)

    def test_create_referral_by_random_logged_in_user(self, _):
        """
        Any logged-in user can create a referral using the CREATE endpoint.
        """
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        user = factories.UserFactory()

        file1 = BytesIO(b"firstfile")
        file1.name = "the first file name"
        file2 = BytesIO(b"secondfile")
        file2.name = "the second file name"
        form_data = {
            "context": "le contexte",
            "files": (file1, file2),
            "object": "l'objet de cette saisine",
            "prior_work": "le travail préalable",
            "question": "la question posée",
            "requester": "le demandeur ou la demandeuse",
            "topic": str(topic.id),
            "urgency_level": urgency_level.id,
            "urgency_explanation": "la justification de l'urgence",
        }
        response = self.client.post(
            "/api/referrals/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 201)

        referral = models.Referral.objects.get(id=response.json()["id"])
        # All simple fields match the incoming request
        self.assertEqual(referral.context, "le contexte")
        self.assertEqual(referral.object, "l'objet de cette saisine")
        self.assertEqual(referral.prior_work, "le travail préalable")
        self.assertEqual(referral.question, "la question posée")
        self.assertEqual(referral.requester, "le demandeur ou la demandeuse")
        self.assertEqual(referral.urgency_level, urgency_level)
        self.assertEqual(referral.urgency_explanation, "la justification de l'urgence")
        # The correct foreign keys were added to the referral
        self.assertEqual(referral.topic, topic)
        self.assertEqual(referral.user, user)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.units.first(), topic.unit)
        # The attachments for the referral were created and linked with it
        self.assertEqual(referral.attachments.count(), 2)
        self.assertEqual(referral.attachments.all()[0].file.read(), b"firstfile")
        self.assertEqual(referral.attachments.all()[0].name, "the first file name")
        self.assertEqual(referral.attachments.all()[1].file.read(), b"secondfile")
        self.assertEqual(referral.attachments.all()[1].name, "the second file name")
        # The "create" activity for the Referral is generated
        activities = models.ReferralActivity.objects.filter(referral__id=referral.id)
        self.assertEqual(len(activities), 1)
        self.assertEqual(activities[0].referral, referral)
        self.assertEqual(activities[0].actor, user)
        self.assertEqual(activities[0].verb, models.ReferralActivityVerb.CREATED)

    def test_create_referral_by_random_logged_in_user_with_invalid_form(self, _):
        """
        If the form is invalid (for example, missing a required field), referral creation
        should fail.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()

        form_data = {
            "context": "le contexte",
            "prior_work": "le travail préalable",
            "requester": "le demandeur ou la demandeuse",
            "topic": str(topic.id),
            "urgency": models.Referral.URGENCY_2,
            "urgency_explanation": "la justification de l'urgence",
        }
        response = self.client.post(
            "/api/referrals/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"question": ["Ce champ est obligatoire."]},
        )

    # REQUEST ANSWER VALIDATION TESTS
    def test_referral_request_answer_validation_by_anonymous_user(self, _):
        """
        Anonymous users cannot request a validation on an answer for a referral.
        """
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 0
        )

    def test_referral_request_answer_validation_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 0
        )

    def test_referral_request_answer_validation_by_linked_user(self, _):
        """
        The linked user cannot request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(
                state=models.ReferralState.ASSIGNED, user=user
            ),
            state=models.ReferralAnswerState.DRAFT,
        )
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 0
        )

    def test_referral_request_answer_validation_by_linked_unit_member(self, _):
        """
        Linked unit members can request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        answer.referral.units.get().members.add(user)
        validator = factories.UserFactory()
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 1
        )
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

    def test_referral_request_duplicate_answer_validation(self, _):
        """
        An error should be raised if a user attempts to request a validation for an answer from
        a user who was already requested one.
        """
        """
        Linked unit members can request a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        answer.referral.units.get().members.add(user)
        validator = factories.UserFactory(first_name="Alfred", last_name="Borden")

        # Create an existing validation request for the same answer and validator
        factories.ReferralAnswerValidationRequestFactory(
            answer=answer, validator=validator
        )
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 1
        )

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": validator.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Alfred Borden was already requested to validate this answer"]},
        )
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 1
        )

    def test_referral_request_nonexistent_answer_validation_by_linked_unit_member(
        self, _
    ):
        """
        An explicit error is raised when a unit member attempts to request a validation for an
        answer that does not exist.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
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
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 0
        )

    def test_referral_request_answer_validation_by_linked_unit_member_from_nonexistent_user(
        self, _
    ):
        """
        An explicit error is raised when a unit member attempts to request a validation from a
        user that does not exist.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        answer.referral.units.get().members.add(user)
        random_uuid = uuid.uuid4()
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/request_answer_validation/",
            {"answer": answer.id, "validator": random_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"], [f"user {random_uuid} does not exist"]
        )
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 0
        )

    # PERFORM ANSWER VALIDATION TESTS
    def test_referral_perform_answer_validation_by_anonymous_user(self, _):
        """
        Anonymous users cannot perform a validation on an answer for a referral.
        """
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
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

    def test_referral_perform_answer_validation_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
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

    def test_referral_perform_answer_validation_by_linked_user(self, _):
        """
        The linked user cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=factories.ReferralFactory(
                    state=models.ReferralState.ASSIGNED, user=user
                ),
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
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

    def test_referral_perform_answer_validation_by_linked_unit_member(self, _):
        """
        Linked unit members cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory()
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        validation_request.answer.referral.units.get().members.add(user)
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
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

    def test_referral_perform_answer_validation_by_requested_validator_does_validate(
        self, _
    ):
        """
        The user who is linked with the validation can validate the answer, regardless of
        their membership of the linked unit.
        """
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
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

    def test_referral_perform_answer_validation_by_requested_validator_does_not_validate(
        self, _
    ):
        """
        The user who is linked with the validation can deny validation of the answer, regardless
        of their membership of the linked unit.
        """
        validation_request = factories.ReferralAnswerValidationRequestFactory(
            answer=factories.ReferralAnswerFactory(
                referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
                state=models.ReferralAnswerState.DRAFT,
            )
        )
        user = validation_request.validator
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
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

    def test_referral_perform_answer_validation_with_nonexistent_request(self, _):
        """
        Validation cannot be performed (even by a linked unit member) when there is no existing
        validation request.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
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

    # PUBLISH ANSWER TESTS
    def test_publish_referral_answer_by_anonymous_user(self, _):
        """
        Anonymous users cannot publish an answer for a referral.
        """
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_publish_referral_answer_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot publish an answer for a referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_publish_referral_answer_by_linked_user(self, _):
        """
        The referral's creator cannot publish a draft answer themselves.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(
                state=models.ReferralState.ASSIGNED, user=user
            ),
            state=models.ReferralAnswerState.DRAFT,
        )

        response = self.client.post(
            f"/api/referrals/{answer.referral.id}/publish_answer/",
            {"answer": answer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_publish_referral_answer_by_linked_unit_member(self, _):
        """
        Members of the linked unit can publish a draft answer for a referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
        answer.referral.units.get().members.add(user)

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

    def test_publish_nonexistent_referral_answer_by_linked_unit_member(self, _):
        """
        When a user (like a unit member) attempts to publish an answer that does not exist,
        they receive an error with an appropriate message.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        referral.units.get().members.add(user)
        some_uuid = uuid.uuid4()

        response = self.client.post(
            f"/api/referrals/{referral.id}/publish_answer/",
            {"answer": some_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["errors"], [f"answer {some_uuid} does not exist"]
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)

    # ASSIGN TESTS
    def test_assign_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot perform actions, including assignments.
        """
        referral = factories.ReferralFactory()
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

        referral = factories.ReferralFactory()
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

        referral = factories.ReferralFactory(user=user)
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
        referral = factories.ReferralFactory()
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
        referral = factories.ReferralFactory()
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
                    "requester": referral.requester,
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
                    "requester": referral.requester,
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
                    "requester": referral.requester,
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
                    "requester": referral.requester,
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

    def test_unassign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot unassign an assignee from it.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, user=user
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

    def test_unassign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot unassign anyonce (incl. themselves)
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

    # ASSIGN UNIT TESTS
    def test_assign_unit_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot assign units to referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {"unit": str(other_unit.id)},
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
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
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
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
            state=models.ReferralState.ASSIGNED, user=user
        )
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
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
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
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
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
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
                    "requester": referral.requester,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": 12,
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
            {"unit": random_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [f"Unit {random_uuid} does not exist."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
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
                {"unit": str(referral.units.get().id)},
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
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    # UNASSIGN UNIT TESTS
    def test_unassign_unit_referral_by_anonymous_user(self, _):
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
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_unassign_unit_referral_by_random_logged_in_user(self, _):
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
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_unassign_unit_referral_by_linked_user(self, _):
        """
        A referral's linked user cannot unassign unit from referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, user=user
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
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_unassign_unit_referral_by_linked_unit_member(self, _):
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
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_unassign_own_unit_referral_by_linked_unit_organizer(self, _):
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
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )

    def test_unassign_another_unit_referral_by_linked_unit_organizer(self, _):
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
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )

    def test_unassign_unit_referral_with_only_one_linked_unit(self, _):
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
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_unassign_unit_referral_with_assigned_member(self, _):
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
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_unassign_unit_referral_from_invalid_state(self, _):
        """
        A referral in a state more advanced than RECEIVED or ASSIGNED cannot have
        units unassigned from it.
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
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

    def test_change_urgencylevel_by_owner(self, _):
        """
        Unit owners can change a referral urgency level.
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

        referral.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(new_urgencylevel.id, referral.urgency_level.id)

        # check urgencylevel history
        ReferralUrgencyLevelHistory = models.ReferralUrgencyLevelHistory.objects.get(
            referral=referral, new_referral_urgency=new_urgencylevel
        )
        self.assertEqual(
            "La justification du changement.",
            ReferralUrgencyLevelHistory.explanation,
        )
        self.assertEqual(
            new_urgencylevel, ReferralUrgencyLevelHistory.new_referral_urgency
        )
        self.assertEqual(
            old_urgencylevel, ReferralUrgencyLevelHistory.old_referral_urgency
        )

    def test_change_urgencylevel_by_anonymous_user(self, _):
        """
        Anonymous users cannot change  urgencylevel.
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

        # Assert urgency level is unchanged
        referral.refresh_from_db()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

    def test_change_urgencylevel_by_random_logged_in_user(self, _):
        """
        Random logged-in users cannot change urgencylevel.
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

        # Assert urgency level is unchanged
        referral.refresh_from_db()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

    def test_change_urgencylevel_unit_member(self, _):
        """
        A regular unit member cannot change urgencylevel.
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

        # Assert urgency level is unchanged
        referral.refresh_from_db()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

    def test_change_urgencylevel_unit_admin(self, _):
        """
        A admin unit  member can change urgencylevel.
        """
        referral = factories.ReferralFactory()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
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
        referral.refresh_from_db()
        self.assertEqual(response.status_code, 200)

        # Assert urgency level is changed
        self.assertEqual(new_urgencylevel.id, referral.urgency_level.id)

    def test_change_urgencylevel_wrong_urgencylevel_id(self, _):
        """
        Urgencylevel id must be valid.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        # check wrong urgencylevel id
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

        # Assert urgency level is unchanged
        referral.refresh_from_db()
        self.assertNotEqual(new_urgencylevel_id, referral.urgency_level.id)

        # check missing urgencylevel id
        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(""),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

        # Assert urgency level is unchanged
        referral.refresh_from_db()
        self.assertNotEqual(new_urgencylevel_id, referral.urgency_level.id)

    def test_change_urgencylevel_missing_urgencylevelexplanation(self, _):
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

    def test_change_urgencylevel_by_linked_user(self, _):
        """
        A referral's linked user cannot change urgencylevel.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            user=user, state=models.ReferralState.RECEIVED
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

        # Assert urgency level is unchanged
        referral.refresh_from_db()
        self.assertNotEqual(new_urgencylevel.id, referral.urgency_level.id)

    def test_change_urgencylevel_bad_state(self, _):
        """
        A referral's linked user cannot change urgencylevel.
        """
        # Test Answered INCOMPLETE
        referral = factories.ReferralFactory(state=models.ReferralState.INCOMPLETE)

        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_urgencylevel = factories.ReferralUrgencyFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

        # Test Answered state
        referral.state = models.ReferralState.ANSWERED
        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

        # Test Closed State
        referral.state = models.ReferralState.CLOSED
        response = self.client.post(
            f"/api/referrals/{referral.id}/change_urgencylevel/",
            {
                "urgencylevel_explanation": "La justification du changement.",
                "urgencylevel": str(new_urgencylevel.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

    def test_close_by_anonymous_user(self, _):
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

    def test_close_by_random_logged_in_user(self, _):
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

    def test_close_by_linked_user(self, _):
        """
        A referral's linked user cannot close a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            user=user, state=models.ReferralState.RECEIVED
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": "La justification de la cloture."},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)

        referral.refresh_from_db()

        # check referral activity
        ReferralActivity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            "La justification de la cloture.",
            ReferralActivity.message,
        )

    def test_close_by_unit_owner(self, _):
        """
        Unit owners can close a referral (state RECEIVED or ASSIGNED)
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

        # check referral activity
        ReferralActivity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            "La justification de la cloture.",
            ReferralActivity.message,
        )
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )

    def test_close_by_unit_member(self, _):
        """
        A regular unit member cannot close a referral
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

    def test_close_by_unit_admin(self, _):
        """
        A admin unit member can close a referral
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

        # check referral activity
        ReferralActivity = models.ReferralActivity.objects.get(referral=referral)
        self.assertEqual(
            "La justification de la cloture.",
            ReferralActivity.message,
        )
        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )

    def test_close_with_missing_explanation(self, _):
        """
        Close explanation is mandatory
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

    def test_close_from_bad_state(self, _):
        """
        A referral in a state more advanced than RECEIVED or ASSIGNED cannot be closed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.INCOMPLETE)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
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
            models.ReferralState.INCOMPLETE,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

        referral.state = models.ReferralState.ANSWERED
        referral.save()
        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": ""},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.ANSWERED,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )

        referral.state = models.ReferralState.CLOSED
        referral.save()
        response = self.client.post(
            f"/api/referrals/{referral.id}/close_referral/",
            {"close_explanation": ""},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)

        referral.refresh_from_db()

        self.assertEqual(
            referral.state,
            models.ReferralState.CLOSED,
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
