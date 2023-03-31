from django.test import TestCase


from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralApiUpdateTitleCase(TestCase):
    """
    Test API routes and actions related to the Referral update title endpoint.
    """

    def test_update_title_by_anonymous_user(self):
        """
        Anonymous users cannot change  the referral's title.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
        )
        self.assertEqual(response.status_code, 401)
        # Make sure the title is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(title, referral.title)

    def test_update_title_by_random_logged_in_user(self):
        """
        Random logged-in users cannot change the referral's title.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the title is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(title, referral.title)

    def test_update_title_by_referral_linked_user(self):
        """
        A referral's linked user cannot change the referral's title.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)
        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the title is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(title, referral.title)

    def test_update_title_by_unit_member(self):
        """
        A regular unit member can change the referral's title.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the title is changed
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(title, referral.title)

    def test_update_title_by_unit_admin(self):
        """
        A unit admin can change the referral's title.
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
        )
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the  title  is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(title, referral.title)

    def test_update_title_by_unit_owner(self):
        """
        Unit owners can change the referral's title.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the title is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(title, referral.title)

    def test_update_title_missing_title(self):
        """
        The request errors out when the title parameter is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {
                "title": "",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        # Make sure the title is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    def test_update_title_from_processing_state(self):
        """
        The title can be changed on a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the title is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(title, referral.title)

    def test_update_title_from_in_validation_state(
        self,
    ):
        """
        The title can be changed on a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the title is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(title, referral.title)

    def test_update_title_from_answered_state(self):
        """
        The title cannot be changed on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot update referral's title from state answered."]},
        )
        # Make sure the title is unchanged

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertNotEqual(title, referral.title)

    def test_update_title_from_closed_state(self):
        """
        The title cannot  be changed on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        title = "titre de la Daj"
        self.assertNotEqual(title, referral.title)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_title/",
            {"title": title},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot update referral's title from state closed."]},
        )
        # Make sure the title is unchanged

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertNotEqual(title, referral.title)
