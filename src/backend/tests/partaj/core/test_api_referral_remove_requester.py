from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiRemoveRequesterTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "add_requester" endpoint.
    """

    def test_remove_requester_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot remove a requester from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot remove a requester from a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can remove a requester from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_auto_remove_requester_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can remove a requester from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": user.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_by_linked_unit_member(self, mock_mailer_send):
        """
        Referral linked unit members can remove a requester from a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.MEMBER,
            user=user,
            unit=referral.units.first(),
        )
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_already_not_linked(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user to remove is already
        not linked to the referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"User {other_requester.id} is not linked as requester to referral {referral.id}."
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_last_requester(self, mock_mailer_send):
        """
        The last requester cannot be removed from the referral. There needs to
        be one requester at all times.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": user.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "The requester cannot be removed from the referral if there is only one."
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_from_assigned_state(self, mock_mailer_send):
        """
        Requesters can be removed from a referral in the ASSIGNED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_from_processing_state(self, mock_mailer_send):
        """
        Requesters can be removed from a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_from_in_validation_state(self, mock_mailer_send):
        """
        Requesters can be removed from a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_from_answered_state(self, mock_mailer_send):
        """
        Requesters cannot be removed from a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Transition REMOVE_REQUESTER not allowed from state answered."
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_not_called()

    def test_remove_requester_from_closed_state(self, mock_mailer_send):
        """
        Requesters cannot be removed from a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        other_requester = factories.UserFactory()
        referral.users.add(other_requester)
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_requester/",
            {"requester": other_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition REMOVE_REQUESTER not allowed from state closed."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()
