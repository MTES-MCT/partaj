import json
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


def _valid_payload(referral):
    """
    Build a payload mirroring a referral's existing fields so it passes
    NewReferralForm validation when the endpoint re-runs the form.

    Uses CENTRAL_UNIT + has_prior_work=yes with a filled prior_work to satisfy
    the branch-specific requirements in NewReferralForm.clean.
    """
    return {
        "context": referral.context,
        "object": referral.object,
        "prior_work": referral.prior_work or "Travaux préalables réalisés.",
        "has_prior_work": "yes",
        "question": referral.question,
        "topic": str(referral.topic_id),
        "urgency_level": str(referral.urgency_level_id),
        "requester_unit_type": models.RequesterUnitType.CENTRAL_UNIT,
    }


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiSendNewTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "send_new" endpoint.
    """

    def test_send_new_by_requester(self, _mock_mailer_send):
        """
        The requester can send their draft referral via send_new.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )

        response = self.client.put(
            f"/api/referrals/{referral.id}/send_new/",
            data=json.dumps(_valid_payload(referral)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertIsNotNone(referral.sent_at)
        self.assertIsNotNone(referral.report)

    def test_send_new_missing_topic(self, _mock_mailer_send):
        """
        NewReferralForm explicitly requires `topic` — missing it yields a form error.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )
        payload = _valid_payload(referral)
        payload["topic"] = ""

        response = self.client.put(
            f"/api/referrals/{referral.id}/send_new/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("topic", response.json())
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.DRAFT)

    def test_send_new_decentralised_missing_contact(self, _mock_mailer_send):
        """
        NewReferralForm adds a stricter check that ReferralForm does not:
        DECENTRALISED_UNIT with has_prior_work=yes requires a valid email contact.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )
        payload = _valid_payload(referral)
        payload["requester_unit_type"] = models.RequesterUnitType.DECENTRALISED_UNIT
        payload["requester_unit_contact"] = ""

        response = self.client.put(
            f"/api/referrals/{referral.id}/send_new/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.DRAFT)

    def test_send_new_on_non_draft_referral(self, _mock_mailer_send):
        """
        Sending a non-DRAFT referral via send_new returns 400 (TransitionNotAllowed).
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )

        response = self.client.put(
            f"/api/referrals/{referral.id}/send_new/",
            data=json.dumps(_valid_payload(referral)),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Transition", response.json()["errors"][0])
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
