"""
Referral urgency model in our core app.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralUrgency(models.Model):
    """
    Referral urgency model.
    Instances of this model should only be created by administrators.
    """

    duration = models.DurationField(
        verbose_name=_("duration"), help_text=_("Expected treatment duration")
    )
    index = models.IntegerField(
        verbose_name=_("index"),
        help_text=_("Ordinal position in the list of referral urgencies; 0 is default urgency"),
        unique=True,
        null=True,
    )
    is_default = models.BooleanField(
        verbose_name=_("is default"),
        help_text=_(
            "Whether this urgency level is the default level for new referrals"
        ),
        default=False,
    )
    name = models.CharField(verbose_name=_("name"), max_length=200)
    requires_justification = models.BooleanField(
        verbose_name=_("requires justification"),
        help_text=_("Whether to require a justification when this urgency is selected"),
    )

    class Meta:
        db_table = "partaj_referral_urgency"
        verbose_name = _("referral urgency")

    def __str__(self):
        """Human representation of a referral urgency."""
        return f"{self._meta.verbose_name.title()}: {self.name}"
