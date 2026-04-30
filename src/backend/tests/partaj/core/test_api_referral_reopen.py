import json
from datetime import date, timedelta
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiReopenTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "reopen" endpoint.
    """

    def _enable_v2_flag(self):
        """
        Turn on the "referral_version" feature flag so the referral is considered
        a v2 answer by ReferralAnswerIsAtLeastV2.
        """
        factories.FeatureFlagFactory(
            tag="referral_version",
            limit_date=date.today() - timedelta(days=1),
        )

    def _put_reopen(self, referral_id, payload, user=None):
        kwargs = {
            "data": json.dumps(payload),
            "content_type": "application/json",
        }
        if user is not None:
            kwargs[
                "HTTP_AUTHORIZATION"
            ] = f"Token {Token.objects.get_or_create(user=user)[0]}"
        return self.client.put(f"/api/referrals/{referral_id}/reopen/", **kwargs)

    def test_reopen_by_anonymous_user(self, _mock_mailer_send):
        """
        Anonymous users cannot reopen a referral.
        """
        self._enable_v2_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)

        response = self._put_reopen(referral.id, {"comment": "Re-opening."})
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)

    def test_reopen_by_random_logged_in_user(self, _mock_mailer_send):
        """
        Random logged-in users cannot reopen a referral.
        """
        self._enable_v2_flag()
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)

        response = self._put_reopen(referral.id, {"comment": "Re-opening."}, user=user)
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)

    def test_reopen_by_requester(self, _mock_mailer_send):
        """
        The referral requester cannot reopen a referral — only unit members can.
        """
        self._enable_v2_flag()
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.CLOSED, post__users=[user]
        )

        response = self._put_reopen(referral.id, {"comment": "Re-opening."}, user=user)
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)

    def test_reopen_from_closed_state(self, _mock_mailer_send):
        """
        A unit member can reopen a referral in the CLOSED state.
        """
        self._enable_v2_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self._put_reopen(
            referral.id, {"comment": "Re-opening the case."}, user=user
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        history = models.ReferralReopenedHistory.objects.get(referral=referral)
        self.assertEqual(history.explanation, "Re-opening the case.")

    def test_reopen_from_answered_state(self, _mock_mailer_send):
        """
        A unit member can reopen a referral in the ANSWERED state.
        """
        self._enable_v2_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self._put_reopen(
            referral.id, {"comment": "Re-opening."}, user=user
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)

    def test_reopen_from_active_state(self, _mock_mailer_send):
        """
        Referrals in an active state (not CLOSED or ANSWERED) cannot be reopened —
        the ReferralStateIsInactive permission rejects it with a 403.
        """
        self._enable_v2_flag()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self._put_reopen(
            referral.id, {"comment": "Re-opening."}, user=user
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    def test_reopen_v1_referral_is_forbidden(self, _mock_mailer_send):
        """
        Without the "referral_version" feature flag, the referral is considered v1
        and the ReferralAnswerIsAtLeastV2 permission rejects the reopen.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        response = self._put_reopen(
            referral.id, {"comment": "Re-opening."}, user=user
        )
        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
