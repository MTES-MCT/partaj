from datetime import datetime, timedelta
from io import BytesIO
from unittest import mock
import uuid

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
        Anonymous users cannot make list requests on the referral endpoints.
        """
        response = self.client.get("/api/referrals/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_by_random_logged_in_user(self, _):
        """
        Logged-in users cannot make list requests on the referral endpoints.
        """
        user = factories.UserFactory()
        response = self.client.get(
            "/api/referrals/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referrals_by_admin_user(self, _):
        """
        Admin users cannot make list requests on the referral endpoints.
        """
        user = factories.UserFactory(is_staff=True)
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

    def test_retrieve_referral_by_admin_user(self, _):
        """
        Admins can retrieve any referral on the retrieve endpoint.
        """
        user = factories.UserFactory(is_staff=True)

        referral = factories.ReferralFactory()
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

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

        referral.topic.unit.members.add(user)
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
        self.assertEqual(
            response.json()["due_date"], "2019-09-10T11:15:00Z"
        )

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
        response = self.client.post("/api/referrals/", form_data,)
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
            response.json(), {"question": ["Ce champ est obligatoire."]},
        )

    def test_create_referral_by_admin_user(self, _):
        """
        Admin users can create referrals just like regular logged-in users.
        """
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        user = factories.UserFactory(is_staff=True, is_superuser=True)

        form_data = {
            "context": "le contexte",
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
        # The "create" activity for the Referral is generated
        activities = models.ReferralActivity.objects.filter(referral__id=referral.id)
        self.assertEqual(len(activities), 1)
        self.assertEqual(activities[0].referral, referral)
        self.assertEqual(activities[0].actor, user)
        self.assertEqual(activities[0].verb, models.ReferralActivityVerb.CREATED)

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

    def test_referral_request_answer_validation_by_admin_user(self, _):
        """
        Admin users can request a validation on an answer for a referral.
        """
        user = factories.UserFactory(is_staff=True)
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

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralAnswerValidationRequest.objects.all().count(), 1
        )
        # Make sure the validation request was built with the data we expect
        validation_request = models.ReferralAnswerValidationRequest.objects.get(
            answer=answer, validator=validator,
        )
        # An activity was created for this validation request
        self.assertEqual(
            models.ReferralActivity.objects.get(
                verb=models.ReferralActivityVerb.VALIDATION_REQUESTED
            ).item_content_object.id,
            validation_request.id,
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
        answer.referral.topic.unit.members.add(user)
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
            answer=answer, validator=validator,
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
        answer.referral.topic.unit.members.add(user)
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
        referral.topic.unit.members.add(user)
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
        answer.referral.topic.unit.members.add(user)
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

    def test_referral_perform_answer_validation_by_admin_user(self, _):
        """
        Admin users cannot perform a validation on an answer for a referral.
        """
        user = factories.UserFactory(is_staff=True)
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
        validation_request.answer.referral.topic.unit.members.add(user)
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
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
            {
                "comment": "some comment",
                "state": "validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=validation_request.validator)[0]}",
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
        response = self.client.post(
            f"/api/referrals/{validation_request.answer.referral.id}/perform_answer_validation/",
            {
                "comment": "some other comment",
                "state": "not_validated",
                "validation_request": validation_request.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=validation_request.validator)[0]}",
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
        answer.referral.topic.unit.members.add(user)
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

    def test_publish_referral_answer_by_admin_user(self, _):
        """
        Admin users can publish an answer for a referral.
        """
        user = factories.UserFactory(is_staff=True)
        answer = factories.ReferralAnswerFactory(
            referral=factories.ReferralFactory(state=models.ReferralState.ASSIGNED),
            state=models.ReferralAnswerState.DRAFT,
        )
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
        answer.referral.topic.unit.members.add(user)

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
        referral.topic.unit.members.add(user)
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
    def test_assign_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot perform actions, including assignments.
        """
        referral = factories.ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": "42"}
        )
        self.assertEqual(response.status_code, 401)

    def test_assign_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot assign a referral.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_admin_user(self, _):
        """
        Admin users can assign a referral.
        """
        user = factories.UserFactory(is_staff=True)

        referral = factories.ReferralFactory()
        assignee = factories.UserFactory()
        referral.topic.unit.members.add(assignee)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(response.json()["assignees"][0]["id"], str(assignee.id))

    def test_assign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot assign it.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(user=user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot assign a referral.
        """
        referral = factories.ReferralFactory()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.topic.unit
        ).user
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_linked_unit_organizer(self, _):
        """
        Organizers of the linked unit can assign a referral.
        """
        referral = factories.ReferralFactory()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.topic.unit
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.topic.unit).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(response.json()["assignees"][0]["id"], str(assignee.id))

    def test_assign_already_assigned_referral(self, _):
        """
        A referral which was assigned to one user can be assigned to an additional one,
        staying in the ASSIGNED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        exsting_assignee = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        ).assignee
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.topic.unit
        ).user
        assignee = factories.UnitMembershipFactory(unit=referral.topic.unit).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 2)
        self.assertEqual(
            response.json()["assignees"][0]["id"], str(exsting_assignee.id),
        )
        self.assertEqual(
            response.json()["assignees"][1]["id"], str(assignee.id),
        )

    # UNASSIGN TESTS
    def test_unassign_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot perform actions, including assignment removals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_unassign_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot unassign an assignee from a referral.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_unassign_referral_by_admin_user(self, _):
        """
        Admin users can unassign an assignee from a referral.
        """
        user = factories.UserFactory(is_staff=True)

        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.RECEIVED)
        self.assertEqual(response.json()["assignees"], [])

    def test_unassign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot unassign an assignee from it.
        """
        user = factories.UserFactory()

        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, user=user
        )
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
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
            assignee=assignee, referral=referral, unit=referral.topic.unit,
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment.assignee)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_unassign_referral_by_linked_unit_organizer(self, _):
        """
        Organizers of the linked unit can unassign a member from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        assignment = factories.ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit,
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment.created_by)[0]}",
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
            referral=referral, unit=referral.topic.unit,
        )
        assignment_to_keep = factories.ReferralAssignmentFactory(referral=referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment_to_remove.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment_to_remove.created_by)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["assignees"]), 1)
        self.assertEqual(
            response.json()["assignees"][0]["id"], str(assignment_to_keep.assignee.id)
        )
