from datetime import date, datetime, timedelta

from django.test import TestCase

from partaj.core import factories, models, services


class ReferralApiTestCase(TestCase):
    """
    Test FeatureFlagService handler versioning
    """

    def test_it_returns_version_0_if_no_feature_flag_found_in_db(self):
        """
        Create a DRAFT referral
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, sent_at=None
        )

        version = services.FeatureFlagService.get_referral_version(referral)
        self.assertEqual(version, 0)

    def test_it_returns_version_1_if_feature_flag_before_or_equals_sent_date(self):
        """
        Create a DRAFT referral sent after the feature flag activation
        """

        factories.FeatureFlagFactory(
            tag="referral_version", limit_date=date.today() - timedelta(days=2)
        )

        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, sent_at=datetime.now()
        )

        version = services.FeatureFlagService.get_referral_version(referral)
        self.assertEqual(version, 1)

    def test_it_returns_version_0_if_feature_flag_is_after_sent_date(self):
        """
        Create a DRAFT referral sent after the feature flag activation
        """

        factories.FeatureFlagFactory(
            tag="referral_version", limit_date=date.today() + timedelta(days=2)
        )

        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, sent_at=datetime.now()
        )

        version = services.FeatureFlagService.get_referral_version(referral)
        self.assertEqual(version, 0)
