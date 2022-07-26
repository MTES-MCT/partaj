"""
FeatureFlagService handling versioning
"""
from datetime import datetime

from .. import models


class FeatureFlagService:
    """FeatureFlag class"""

    @classmethod
    def get_referral_version(cls, referral):
        """
        Compare feature flag limit date and sent_at date
        If sent_at is after the feature flag limit date,
        the feature is "ON" i.e. 1 else "OFF" i.e. 0
        """
        try:
            feature_flag = models.FeatureFlag.objects.get(tag="referral_version")
            if not referral.sent_at:
                return 1 if datetime.now().date() >= feature_flag.limit_date else 0
            return 1 if referral.sent_at.date() >= feature_flag.limit_date else 0

        except models.FeatureFlag.DoesNotExist:
            return 0
