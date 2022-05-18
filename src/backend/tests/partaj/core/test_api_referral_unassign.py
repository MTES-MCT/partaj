from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiUnassignTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "unassign" endpoint.
    """

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
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

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
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot unassign an assignee from it.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, post__user=[user]
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
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot unassign anyone (incl. themselves)
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
        self.assertEqual(models.ReferralActivity.objects.count(), 0)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

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
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(referral.assignees.count(), 0)

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
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_from_processing_state(self, _):
        """
        Users can be unassigned from units in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
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
        self.assertEqual(response.json()["state"], models.ReferralState.PROCESSING)
        self.assertEqual(response.json()["assignees"], [])
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(referral.assignees.count(), 0)

    def test_unassign_referral_from_in_validation_state(self, _):
        """
        Users can be unassigned from units in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
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
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(response.json()["assignees"], [])
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED,
                referral=referral,
            ).count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(referral.assignees.count(), 0)

    def test_unassign_referral_from_received_state(self, _):
        """
        Users cannot be unassigned from units in the RECEIVED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
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
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition UNASSIGN not allowed from state received."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_from_answered_state(self, _):
        """
        Users cannot be unassigned from units in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
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
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition UNASSIGN not allowed from state answered."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(referral.assignees.count(), 1)

    def test_unassign_referral_from_closed_state(self, _):
        """
        Users cannot be unassigned from units in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
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
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition UNASSIGN not allowed from state closed."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(referral.assignees.count(), 1)
