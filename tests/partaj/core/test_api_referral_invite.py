from unittest import mock

from django.conf import settings
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from partaj.users.models import User


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiAddInviteTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "invite" endpoint.
    """
    # TESTS ADD
    # - NOT ALLOWED PERMISSIONS
    def test_invite_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot invite a user to a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/invite/",
            {"email": referral.users.first().email},
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

    def test_invite_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot invite a user to a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/invite/",
            {
                "user": referral.users.first().email,
            },
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

    # - ALLOWED PERMISSIONS
    # -- Invitation from referral users
    def test_invite_by_linked_user_as_requester_twice(self, mock_mailer_send):
        """
        Referral linked users can invite user to a referral.
        """
        email = "tieps@domain.fr"
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        first_invitation_response = self.client.post(
            f"/api/referrals/{referral.id}/invite/",
            {
                "email": email,
                "role": models.ReferralUserLinkRoles.REQUESTER,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(first_invitation_response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )

        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(User.objects.filter(email="tieps@domain.fr").count(), 1)

        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": email}],
            }
        )

        second_same_invitation_response = self.client.post(
            f"/api/referrals/{referral.id}/invite/",
            {
                "email": email,
                "role": models.ReferralUserLinkRoles.REQUESTER,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(second_same_invitation_response.status_code, 200)

        mock_mailer_send.assert_called_once()

    # - ALLOWED PERMISSIONS
    # -- Invitation from referral users
    def test_invite_by_linked_user_as_observer_then_requester(self, mock_mailer_send):
        """
        Referral linked users can invite user to a referral.
        """
        email = "tieps@domain.fr"
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        first_invitation_response = self.client.post(
            f"/api/referrals/{referral.id}/invite/",
            {
                "email": email,
                "role": models.ReferralUserLinkRoles.OBSERVER,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(first_invitation_response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )

        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(User.objects.filter(email="tieps@domain.fr").count(), 1)

        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.OBSERVER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
            ).count(), 1
        )
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 1
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": email}],
            }
        )

        requester_invitation_response = self.client.post(
            f"/api/referrals/{referral.id}/invite/",
            {
                "email": email,
                "role": models.ReferralUserLinkRoles.REQUESTER,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(requester_invitation_response.status_code, 200)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": email}],
            }
        )

        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.OBSERVER,
            ).count(), 0
        )

        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 2
        )
