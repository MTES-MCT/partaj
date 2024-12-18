"""
FeatureFlagService handling versioning
"""

from datetime import datetime

from .. import models


class FeatureFlagService:
    """FeatureFlag class"""

    @classmethod
    def get_working_day_urgency(cls, referral):
        """
        Compare feature flag limit date and sent_at date
        If sent_at is after the feature flag limit date,
        the feature is "ON" i.e. 1 else "OFF" i.e. 0
        """
        try:
            feature_flag = models.FeatureFlag.objects.get(tag="working_day_urgency")
            if not referral.sent_at:
                return 1 if datetime.now().date() >= feature_flag.limit_date else 0
            return 1 if referral.sent_at.date() >= feature_flag.limit_date else 0

        except models.FeatureFlag.DoesNotExist:
            return 0

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

    @classmethod
    def get_new_form(cls, referral):
        """
        Compare feature flag limit date and created_at date
        If created_at is after the feature flag limit date,
        the feature is "ON" i.e. 1 else "OFF" i.e. 0
        """
        try:
            feature_flag = models.FeatureFlag.objects.get(tag="new_form")
            return 1 if referral.created_at.date() >= feature_flag.limit_date else 0

        except models.FeatureFlag.DoesNotExist:
            return 0

    @classmethod
    def get_validation_state(cls):
        """
        Compare feature flag limit date and now
        If feature flag date is exceeded, feature is "ON" / 1 else "OFF" / 0
        """
        try:
            feature_flag = models.FeatureFlag.objects.get(tag="validation_start_date")
            return 1 if datetime.now().date() >= feature_flag.limit_date else 0

        except models.FeatureFlag.DoesNotExist:
            return 0

    @classmethod
    def get_state(cls, tag):
        """
        Compare feature flag limit date and now
        If feature flag date is exceeded, feature is "ON" / 1 else "OFF" / 0
        """
        try:
            feature_flag = models.FeatureFlag.objects.get(tag=tag)
            return 1 if datetime.now().date() >= feature_flag.limit_date else 0

        except models.FeatureFlag.DoesNotExist:
            return 0
