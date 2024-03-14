import uuid
from unittest import mock

from django.conf import settings
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiPeformAnswerValidationTestCase(TestCase):
    """
    Test API routes and actions related to the Referral perform answer validation endpoint.
    """

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
                "replyTo": {"email": "contact.partaj@ecologie.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_VALIDATED_TEMPLATE_ID"
                ],
                "to": [{"email": assignee.email}],
            }
        )

    def test_referral_perform_answer_validation_by_requested_validator_does_validate_with_title_filled(
        self, mock_mailer_send
    ):
        """
        The user who is linked with the validation can validate the answer, regardless of
        their membership of the linked unit.
        Referral has a title
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION, title="Titre de la Daj"
        )
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
                    "title": referral.title,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "validator": validation_request.validator.get_full_name(),
                },
                "replyTo": {"email": "contact.partaj@ecologie.gouv.fr", "name": "Partaj"},
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
                "replyTo": {"email": "contact.partaj@ecologie.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_NOT_VALIDATED_TEMPLATE_ID"
                ],
                "to": [{"email": assignee.email}],
            }
        )

    def test_referral_perform_answer_validation_by_requested_validator_does_not_validate_with_title_filled(
        self, mock_mailer_send
    ):
        """
        The user who is linked with the validation can deny validation of the answer, regardless
        of their membership of the linked unit.
        referral has a title
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION, title="Titre de la DAJ"
        )
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
                    "title": referral.title,
                    "topic": referral.topic.name,
                    "unit_name": referral.units.get().name,
                    "validator": validation_request.validator.get_full_name(),
                },
                "replyTo": {"email": "contact.partaj@ecologie.gouv.fr", "name": "Partaj"},
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
