from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiUnassignUnitTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "unassign_unit" endpoint.
    """

    def test_unassign_unit_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot unassign unit from referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/", {"unit": str(other_unit.id)}
        )

        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot unassign unit from referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_by_linked_user(self, mock_mailer_send):
        """
        A referral's linked user cannot unassign unit from referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, post__users=[user]
        )
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_by_linked_unit_member(self, mock_mailer_send):
        """
        A member of a referral's linked unit cannot unassign unit from referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_own_unit_referral_by_linked_unit_organizer(
        self, mock_mailer_send
    ):
        """
        An organizer in a referral's linked unit can unassign their own unit
        from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_another_unit_referral_by_linked_unit_organizer(
        self, mock_mailer_send
    ):
        """
        An organizer in a referral's linked unit can unassign another linked unit
        from a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_with_only_one_linked_unit(self, mock_mailer_send):
        """
        A unit that is the only one assigned to a referral cannot be unassigned
        from said referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_with_assigned_member(self, mock_mailer_send):
        """
        A unit that has a member assigned to a referral cannot be unassigned
        from said referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user
        referral.assignees.add(user)

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_received_state(self, mock_mailer_send):
        """
        A referral in the RECEIVED state can have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_processing_state(self, mock_mailer_send):
        """
        A referral in the PROCESSING state can have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_in_validation_state(self, mock_mailer_send):
        """
        A referral in the IN_VALIDATION state can have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.UNASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )

    def test_unassign_unit_referral_from_answered_state(self, mock_mailer_send):
        """
        A referral in the ANSWERED state cannot have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_unassign_unit_referral_from_closed_state(self, mock_mailer_send):
        """
        A referral in the CLOSED state cannot have units unassigned from it.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        first_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=first_unit
        ).user
        other_unit = factories.UnitFactory()
        referral.units.add(other_unit)
        referral.save()

        self.assertEqual(referral.units.count(), 2)
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign_unit/",
            {"unit": str(first_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Unit cannot be removed from this referral."]}
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()
