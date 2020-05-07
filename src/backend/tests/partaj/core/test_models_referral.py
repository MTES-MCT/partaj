from django.test import TestCase
from django.utils import translation

from partaj.core.factories import ReferralFactory
from partaj.core.models import Referral, ReferralState


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

    def test_get_human_urgency(self):
        """
        The `get_human_urgency` method returns a human-readable, localized string for
        the referral's urgency.
        """
        referral = ReferralFactory()
        with translation.override("en"):
            self.assertEqual(referral.get_human_urgency(), "3 weeks")
        with translation.override("fr"):
            self.assertEqual(referral.get_human_urgency(), "3 semaines")

        referral = ReferralFactory(urgency=Referral.URGENCY_1)
        with translation.override("en"):
            self.assertEqual(referral.get_human_urgency(), "Urgent — 1 week")
        with translation.override("fr"):
            self.assertEqual(
                referral.get_human_urgency(), "Demande urgente — une semaine"
            )

        referral = ReferralFactory(urgency=Referral.URGENCY_2)
        with translation.override("en"):
            self.assertEqual(referral.get_human_urgency(), "Extremely urgent — 3 days")
        with translation.override("fr"):
            self.assertEqual(
                referral.get_human_urgency(), "Demande très urgente — 3 jours"
            )

        referral = ReferralFactory(urgency=Referral.URGENCY_3)
        with translation.override("en"):
            self.assertEqual(
                referral.get_human_urgency(), "Absolute emergency — 24 hours"
            )
        with translation.override("fr"):
            self.assertEqual(
                referral.get_human_urgency(), "Extrême urgence — 24 heures"
            )
