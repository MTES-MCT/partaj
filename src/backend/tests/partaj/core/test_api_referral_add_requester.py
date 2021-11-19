from unittest import mock
import uuid

from django.conf import settings
from django.db import transaction
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiAddRequesterTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "add_requester" endpoint.
    """

    def test_add_requester_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot add a requester to a referral.
        """
        referral = factories.ReferralFactory()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": "42"},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot add a requester to a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can add a requester to a referral.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory()
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": f"/app/sent-referrals/referral-detail/{referral.id}",
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_by_linked_unit_member(self, mock_mailer_send):
        """
        Referral linked unit members can add a requester to a referral.
        """
        user = factories.UserFactory()
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory()
        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.MEMBER,
            user=user,
            unit=referral.units.first(),
        )
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": f"/app/sent-referrals/referral-detail/{referral.id}",
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_already_linked(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add a requester
        that is already in the list.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory()
        user = referral.users.first()
        # The new_requester is already linked to the referral
        referral.users.add(new_requester)
        referral.save()
        self.assertEqual(referral.users.count(), 2)

        with transaction.atomic():
            response = self.client.post(
                f"/api/referrals/{referral.id}/add_requester/",
                {"requester": new_requester.id},
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"User {new_requester.id} is already linked to this referral."
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_does_not_exist(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add a requester
        that does not exist.
        """
        random_uuid = uuid.uuid4()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": random_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [f"User {random_uuid} does not exist."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_from_assigned_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the ASSIGNED state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": f"/app/sent-referrals/referral-detail/{referral.id}",
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_processing_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the PROCESSING state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": f"/app/sent-referrals/referral-detail/{referral.id}",
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_in_validation_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the IN_VALIDATION state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": f"/app/sent-referrals/referral-detail/{referral.id}",
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_answered_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the ANSWERED state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": f"/app/sent-referrals/referral-detail/{referral.id}",
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_closed_state(self, mock_mailer_send):
        """
        Requesters cannot be added on a referral in the CLOSED state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"requester": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ADD_REQUESTER not allowed from state closed."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()
