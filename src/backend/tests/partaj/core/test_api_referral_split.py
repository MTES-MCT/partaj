from datetime import date, timedelta
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


def _enable_split_flag():
    """
    The split endpoint requires a FeatureFlag with tag="split_referral" whose
    limit_date is reached. We enable it at the start of each test that needs it.
    """
    factories.FeatureFlagFactory(
        tag="split_referral",
        limit_date=date.today() - timedelta(days=1),
    )


@mock.patch("partaj.core.email.Mailer.send_split_created")
@mock.patch("partaj.core.api.referral.ES_INDICES_CLIENT")
@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiSplitTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "split" endpoint.
    """

    def test_split_by_anonymous_user(self, _mock_mailer_send, _mock_es, _mock_split):
        _enable_split_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        response = self.client.post(f"/api/referrals/{referral.id}/split/")
        self.assertEqual(response.status_code, 401)

    def test_split_by_random_logged_in_user(self, _mock_mailer_send, _mock_es, _mock_split):
        _enable_split_flag()
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        response = self.client.post(
            f"/api/referrals/{referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_split_without_feature_flag(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        Without the "split_referral" feature flag, the endpoint returns 400.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"errors": ["Unable to split the referral"]})

    def test_split_with_future_limit_date(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        If the "split_referral" feature flag exists but its limit date is in the future,
        the endpoint still rejects the split.
        """
        factories.FeatureFlagFactory(
            tag="split_referral",
            limit_date=date.today() + timedelta(days=30),
        )
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"errors": ["Not able to split the referral"]}
        )

    def test_split_on_inactive_state(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        ReferralStateIsActive rejects the split when referral is CLOSED/ANSWERED/DRAFT.
        """
        _enable_split_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_split_first_time_from_received(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        A first split from a RECEIVED referral creates a ReferralGroup, two sections
        (MAIN + SECONDARY) and the secondary referral transitions to RECEIVED_SPLITTING.
        """
        _enable_split_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 201)
        secondary_id = response.json()["secondary_referral"]

        secondary = models.Referral.objects.get(id=secondary_id)
        self.assertNotEqual(secondary.id, referral.id)
        self.assertEqual(secondary.state, models.ReferralState.RECEIVED_SPLITTING)

        self.assertEqual(models.ReferralGroup.objects.count(), 1)
        group = models.ReferralGroup.objects.get()
        sections = models.ReferralSection.objects.filter(group=group)
        self.assertEqual(sections.count(), 2)
        self.assertEqual(
            sections.get(referral=referral).type, models.ReferralSectionType.MAIN
        )
        self.assertEqual(
            sections.get(referral=secondary).type,
            models.ReferralSectionType.SECONDARY,
        )

    def test_split_first_time_from_assigned(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        Splitting from any active state other than RECEIVED puts the secondary in SPLITTING.
        """
        _enable_split_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 201)
        secondary = models.Referral.objects.get(id=response.json()["secondary_referral"])
        self.assertEqual(secondary.state, models.ReferralState.SPLITTING)

    def test_split_twice_reuses_group(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        A second split on an already split referral reuses the existing ReferralGroup.
        """
        _enable_split_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        token = f"Token {Token.objects.get_or_create(user=user)[0]}"

        first = self.client.post(
            f"/api/referrals/{referral.id}/split/", HTTP_AUTHORIZATION=token
        )
        self.assertEqual(first.status_code, 201)

        second = self.client.post(
            f"/api/referrals/{referral.id}/split/", HTTP_AUTHORIZATION=token
        )
        self.assertEqual(second.status_code, 201)

        self.assertEqual(models.ReferralGroup.objects.count(), 1)
        self.assertEqual(models.ReferralSection.objects.count(), 3)


@mock.patch("partaj.core.email.Mailer.send_split_created")
@mock.patch("partaj.core.api.referral.ES_INDICES_CLIENT")
@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiConfirmSplitTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "confirm_split" endpoint.
    """

    def test_confirm_split_by_anonymous_user(self, _mock_mailer_send, _mock_es, _mock_split):
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED_SPLITTING
        )

        response = self.client.post(f"/api/referrals/{referral.id}/confirm_split/")
        self.assertEqual(response.status_code, 401)

    def test_confirm_split_by_random_logged_in_user(
        self, _mock_mailer_send, _mock_es, _mock_split
    ):
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED_SPLITTING
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/confirm_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_confirm_split_on_non_splitting_state(
        self, _mock_mailer_send, _mock_es, _mock_split
    ):
        """
        Referrals that are not in a splitting state cannot be confirmed.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/confirm_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_confirm_split_success(self, _mock_mailer_send, _mock_es, _mock_split):
        """
        A unit member can confirm a split on the SECONDARY referral in RECEIVED_SPLITTING.
        sub_title and sub_question are persisted.
        """
        _enable_split_flag()
        main_referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=main_referral.units.get()
        ).user
        token = f"Token {Token.objects.get_or_create(user=user)[0]}"

        # Use the split endpoint to build a properly linked MAIN/SECONDARY pair
        # with ReferralSection rows — get_parent() on the secondary requires it.
        split_response = self.client.post(
            f"/api/referrals/{main_referral.id}/split/",
            HTTP_AUTHORIZATION=token,
        )
        self.assertEqual(split_response.status_code, 201)
        secondary_id = split_response.json()["secondary_referral"]

        response = self.client.post(
            f"/api/referrals/{secondary_id}/confirm_split/",
            {
                "sub_title": "Sous-titre du split",
                "sub_question": "Question du split",
            },
            HTTP_AUTHORIZATION=token,
        )
        self.assertEqual(response.status_code, 200)
        secondary = models.Referral.objects.get(id=secondary_id)
        self.assertEqual(secondary.sub_title, "Sous-titre du split")
        self.assertEqual(secondary.sub_question, "Question du split")
        self.assertIn(
            secondary.state,
            [models.ReferralState.RECEIVED, models.ReferralState.RECEIVED_VISIBLE],
        )


@mock.patch("partaj.core.api.referral.ES_INDICES_CLIENT")
@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiCancelSplitTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "cancel_split" endpoint.
    """

    def _build_split_group(self, main_state=models.ReferralState.RECEIVED):
        """
        Build a main referral and a secondary referral linked through a ReferralGroup.
        Returns (main_referral, secondary_referral, group).
        """
        main_referral = factories.ReferralFactory(state=main_state)
        group = models.ReferralGroup.objects.create()
        models.ReferralSection.objects.create(
            referral=main_referral,
            group=group,
            type=models.ReferralSectionType.MAIN,
        )

        secondary_referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED_SPLITTING,
            topic=main_referral.topic,
            report=models.ReferralReport.objects.create(),
        )
        secondary_referral.units.set(main_referral.units.all())
        models.ReferralSection.objects.create(
            referral=secondary_referral,
            group=group,
            type=models.ReferralSectionType.SECONDARY,
        )
        return main_referral, secondary_referral, group

    def test_cancel_split_by_anonymous_user(self, _mock_mailer_send, _mock_es):
        _, secondary, _group = self._build_split_group()

        response = self.client.post(
            f"/api/referrals/{secondary.id}/cancel_split/"
        )
        self.assertEqual(response.status_code, 401)

    def test_cancel_split_by_random_logged_in_user(
        self, _mock_mailer_send, _mock_es
    ):
        user = factories.UserFactory()
        _, secondary, _group = self._build_split_group()

        response = self.client.post(
            f"/api/referrals/{secondary.id}/cancel_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_cancel_split_on_main_section(self, _mock_mailer_send, _mock_es):
        """
        Cannot cancel the split from the MAIN section — only from SECONDARY.
        To reach this branch the referral must be in a splitting state so the
        permission passes; we temporarily flip it before calling.
        """
        main, _secondary, _group = self._build_split_group(
            main_state=models.ReferralState.RECEIVED_SPLITTING
        )
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=main.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{main.id}/cancel_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Cannot cancel split", response.json()["errors"][0])

    def test_cancel_split_on_ungrouped_referral(self, _mock_mailer_send, _mock_es):
        """
        Cancelling on a referral with no ReferralSection returns 400.
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED_SPLITTING
        )
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/cancel_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "Unable to cancel split", response.json()["errors"][0]
        )

    def test_cancel_split_success(self, _mock_mailer_send, _mock_es):
        """
        Cancelling a split on a SECONDARY section deletes the secondary referral
        and its report, and removes the group if no section is left.
        """
        main, secondary, group = self._build_split_group()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=main.units.get()
        ).user
        secondary_id = secondary.id
        report_id = secondary.report_id
        group_id = group.id

        response = self.client.post(
            f"/api/referrals/{secondary.id}/cancel_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "DELETED"})
        self.assertFalse(models.Referral.objects.filter(id=secondary_id).exists())
        self.assertFalse(
            models.ReferralReport.objects.filter(id=report_id).exists()
        )
        # Once only the MAIN section is left (len == 1), the view deletes the
        # group as well; CASCADE then removes the MAIN section.
        self.assertFalse(models.ReferralGroup.objects.filter(id=group_id).exists())
        self.assertEqual(
            models.ReferralSection.objects.filter(referral=main).count(), 0
        )
