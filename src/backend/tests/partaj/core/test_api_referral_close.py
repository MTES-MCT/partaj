from unittest import mock

from django.conf import settings
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiCloseTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "close" endpoint.
    """

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

    def test_close_notifications(self, mock_mailer_send):
        """
        Unit admins can close referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user

        referral.users.set([])
        requester_all = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=requester_all,
            role=models.ReferralUserLinkRoles.REQUESTER,
            notifications=models.ReferralUserLinkNotificationsTypes.ALL
        )

        requester_restricted = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=requester_restricted,
            role=models.ReferralUserLinkRoles.REQUESTER,
            notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED
        )

        requester_none = factories.UserFactory()
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=requester_none,
            role=models.ReferralUserLinkRoles.REQUESTER,
            notifications=models.ReferralUserLinkNotificationsTypes.NONE
        )

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
        self.assertEqual(mock_mailer_send.call_count, 2)
        for referral_user_link in referral.get_referraluserlinks().all():
            mail_args = (
                    (  # args
                        {
                            "params": {
                                "case_number": referral.id,
                                "closed_by": user.get_full_name(),
                                "link_to_referral": (
                                    f"https://partaj/app/sent-referrals/referral-detail/{referral.id}"
                                ),
                                "message": "La justification de la cloture.",
                                "referral_authors": referral.get_users_text_list(),
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
                            "to": [{"email": referral_user_link.user.email}],
                        },
                    ),
                    {},  # kwargs
                )
            if referral_user_link.notifications in [models.ReferralUserLinkNotificationsTypes.ALL, models.ReferralUserLinkNotificationsTypes.RESTRICTED]:
                self.assertTrue(
                    mail_args
                    in [
                        tuple(call_arg_list)
                        for call_arg_list in mock_mailer_send.call_args_list
                    ],
                )
            else:
                self.assertFalse(
                    mail_args
                    in [
                        tuple(call_arg_list)
                        for call_arg_list in mock_mailer_send.call_args_list
                    ],
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
