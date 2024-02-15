from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralApiUpdateStatusCase(TestCase):
    """
    Test API routes and actions related to the Referral update status endpoint.
    """

    def test_update_status_by_anonymous_user(self):
        """
        Anonymous users cannot change  the referral's status.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
        )
        self.assertEqual(response.status_code, 401)
        # Make sure the status is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(status, referral.status)

    def test_update_status_by_random_logged_in_user(self):
        """
        Random logged-in users cannot change the referral's status..
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the status
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(status, referral.status)

    def test_update_status_by_referral_linked_user(self):
        """
        A referral's linked user cannot change the referral's status.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)
        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the status is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(status, referral.status)

    def test_update_status_by_unit_member(self):
        """
        A regular unit member can change the referral's status.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the status is changed
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(status, referral.status)

        status = models.ReferralStatus.NORMAL
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the status is changed
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(status, referral.status)

    def test_update_status_by_unit_admin(self):
        """
        A unit admin can change the referral's status.
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
        )
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the  status  is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(status, referral.status)

    def test_update_status_by_unit_owner(self):
        """
        Unit owners can change the referral's status.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the status is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(status, referral.status)

    def test_update_status_missing_sensitive(self):
        """
        The request errors out when the status parameter is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {
                "status": "",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        # Make sure the status is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    def test_update_status_from_processing_state(self):
        """
        The status can be changed on a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the status is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(status, referral.status)

    def test_update_status_from_in_validation_state(
        self,
    ):
        """
        The status can be changed on a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the status is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(status, referral.status)

    def test_update_status_from_answered_state(self):
        """
        The status cannot be changed on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot change status from state answered."]},
        )
        # Make sure the status is unchanged

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertNotEqual(status, referral.status)

    def test_update_status_from_closed_state(self):
        """
        The status cannot  be changed on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        status = models.ReferralStatus.SENSITIVE
        self.assertNotEqual(status, referral.status)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_status/",
            {"status": status},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot change status from state closed."]},
        )
        # Make sure the status is unchanged

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertNotEqual(status, referral.status)
