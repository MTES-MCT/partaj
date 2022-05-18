from unittest import mock

from django.conf import settings
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiAssignTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "assign" endpoint.
    """

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
