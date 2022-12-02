from unittest import mock

from django.conf import settings
from django.test import TestCase
from django.utils import dateformat

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiChangeUrgencylevelTestCase(TestCase):
    """
    Test API routes and actions related to the Referral change urgency level endpoint.
    """

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

    def test_change_urgencylevel_requester_notifications(self, mock_mailer_send):
        """
        Notifications are sent to requester with ALL and RESTRICTED notifications
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
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

        self.assertEqual(mock_mailer_send.call_count, 2)

        for referral_user_link in referral.get_referraluserlinks().all():
            mail_args = (
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
                        "to": [{"email": referral_user_link.user.email}],
                    },
                ),
                {},  # kwargs
            )
            if referral_user_link.notifications in [models.ReferralUserLinkNotificationsTypes.ALL,
                                                    models.ReferralUserLinkNotificationsTypes.RESTRICTED]:
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
