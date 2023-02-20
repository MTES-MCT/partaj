from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiRemoveObserverTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "add_observer" endpoint.
    """

    def test_remove_observer_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot remove an observer from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_remove_observer_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot remove a observer from a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_remove_observer_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can remove a observer from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_auto_remove_observer_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can remove a observer from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=other_observer)[0]}",
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

    def test_remove_observer_by_linked_unit_member(self, mock_mailer_send):
        """
        Referral linked unit members can remove a observer from a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.MEMBER,
            user=user,
            unit=referral.units.first(),
        )
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_remove_observer_already_not_linked(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user to remove is already
        not linked to the referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"User {other_observer.id} is not linked to referral {referral.id}."
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

    def test_remove_observer_last_observer(self, mock_mailer_send):
        """
        The last observer cannot be removed from the referral. There needs to
        be one observer at all times.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        referral.users.set([])
        factories.ReferralUserLinkFactory(
            referral=referral, user=user, role=models.ReferralUserLinkRoles.OBSERVER
        )
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": user.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 0)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_remove_observer_from_assigned_state(self, mock_mailer_send):
        """
        observers can be removed from a referral in the ASSIGNED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_remove_observer_from_processing_state(self, mock_mailer_send):
        """
        observers can be removed from a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_remove_observer_from_in_validation_state(self, mock_mailer_send):
        """
        observers can be removed from a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
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

    def test_remove_observer_from_answered_state(self, mock_mailer_send):
        """
        observers cannot be removed from a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_not_called()

    def test_remove_observer_from_closed_state(self, mock_mailer_send):
        """
        observers cannot be removed from a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        other_observer = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=other_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_user/",
            {"user": other_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()
