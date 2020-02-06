from django.forms import ModelForm

from .models import Referral


class ReferralForm(ModelForm):
    class Meta:
        model = Referral
        fields = [
            "requester",
            "subject",
            "urgency",
            "urgency_explanation",
            "context",
            "prior_work",
        ]
