from django.test import TestCase
from django.utils import translation

from partaj.core.factories import ReferralFactory
from partaj.core.models import ReferralState


class ReferralTestCase(TestCase):
    """
    Test the Referral model & its methods.
    """

    def test_get_human_state(self):
        """
        The `get_human_state` method returns a human-readable, localized string for
        the current state of the referral.
        """
        referral = ReferralFactory()
        with translation.override("en"):
            self.assertEqual(referral.get_human_state(), "Received")
        with translation.override("fr"):
            self.assertEqual(referral.get_human_state(), "Reçue")

        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        with translation.override("en"):
            self.assertEqual(referral.get_human_state(), "Assigned")
        with translation.override("fr"):
            self.assertEqual(referral.get_human_state(), "Affectée")

        referral = ReferralFactory(state=ReferralState.ANSWERED)
        with translation.override("en"):
            self.assertEqual(referral.get_human_state(), "Answered")
        with translation.override("fr"):
            self.assertEqual(referral.get_human_state(), "Rendue")

        referral = ReferralFactory(state=ReferralState.CLOSED)
        with translation.override("en"):
            self.assertEqual(referral.get_human_state(), "Closed")
        with translation.override("fr"):
            self.assertEqual(referral.get_human_state(), "Fermée")

        referral = ReferralFactory(state=ReferralState.INCOMPLETE)
        with translation.override("en"):
            self.assertEqual(referral.get_human_state(), "Incomplete")
        with translation.override("fr"):
            self.assertEqual(referral.get_human_state(), "Incomplète")
