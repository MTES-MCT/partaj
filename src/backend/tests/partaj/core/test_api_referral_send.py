from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


def _valid_payload(referral):
    """
    Build a payload mirroring a referral's existing fields so it passes
    ReferralForm validation when the endpoint re-runs the form.
    """
    return {
        "context": referral.context,
        "object": referral.object,
        "prior_work": referral.prior_work,
        "question": referral.question,
        "topic": str(referral.topic_id),
        "urgency_level": str(referral.urgency_level_id),
        "urgency_explanation": referral.urgency_explanation or "",
    }


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiSendTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "send" endpoint.
    """

    def test_send_by_anonymous_user(self, _mock_mailer_send):
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)

        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            _valid_payload(referral),
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.DRAFT)

    def test_send_by_requester(self, _mock_mailer_send):
        """
        The requester can send their own draft referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            _valid_payload(referral),
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertIsNotNone(referral.sent_at)
        self.assertIsNotNone(referral.report)

    def test_send_by_unit_member(self, _mock_mailer_send):
        """
        A unit member of the referral's topic unit can also send a draft referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.topic.unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            _valid_payload(referral),
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    def test_send_with_invalid_form(self, _mock_mailer_send):
        """
        Missing a required field of ReferralForm returns 400 with form errors.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )
        payload = _valid_payload(referral)
        payload["context"] = ""

        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            payload,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("context", response.json())
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.DRAFT)

    def test_send_on_non_draft_referral(self, _mock_mailer_send):
        """
        Sending a referral that is not in DRAFT returns 400 (TransitionNotAllowed).
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/send/",
            _valid_payload(referral),
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Transition", response.json()["errors"][0])
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
