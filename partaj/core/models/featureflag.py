"""
Feature flag model to switch ON/OFF a feature in prod.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class FeatureFlag(models.Model):
    """
    Feature flag model to enable features depending on custom parameters,
    for example limit date, users, etc..
    """

    limit_date = models.DateField(
        verbose_name=_("limit date"),
        blank=True,
        null=True,
    )

    tag = models.CharField(
        verbose_name=_("tag"),
        help_text=_("Feature flag tag"),
        max_length=60,
        blank=False,
        null=False,
        primary_key=True,
    )

    class Meta:
        db_table = "partaj_featureflag"
        verbose_name = _("_Feature flag")

    def __str__(self):
        """Get the string representation of a feature flag."""
        return f"{self._meta.verbose_name.title()} {self.tag}"
