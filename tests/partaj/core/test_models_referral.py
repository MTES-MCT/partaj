from datetime import datetime, timedelta
from unittest.mock import patch, Mock

from django.test import TestCase
from django.utils import translation

from partaj.core.factories import ReferralFactory, ReferralUrgencyFactory
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

    def test_get_due_date(self):
        """
        The `get_due_date` method returns the date on which the referral is expected
        to be answered.
        """
        one_day = ReferralUrgencyFactory(duration=timedelta(days=1))
        with patch(
            "django.utils.timezone.now",
            Mock(return_value=datetime(2019, 9, 3, 11, 15, 0)),
        ):
            referral = ReferralFactory(urgency_level=one_day)

        self.assertEqual(referral.get_due_date(), datetime(2019, 9, 4, 11, 15))

        one_week = ReferralUrgencyFactory(duration=timedelta(days=7))
        with patch(
            "django.utils.timezone.now",
            Mock(return_value=datetime(2019, 9, 3, 11, 15, 0)),
        ):
            referral = ReferralFactory(urgency_level=one_week)

        self.assertEqual(referral.get_due_date(), datetime(2019, 9, 10, 11, 15))
