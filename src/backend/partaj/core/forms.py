from django import forms

from .models import Referral


class ReferralForm(forms.ModelForm):
    class Meta:
        model = Referral
        fields = [
            "requester",
            "topic",
            "question",
            "urgency",
            "urgency_explanation",
            "context",
            "prior_work",
        ]

    files = forms.FileField(
        required=False,
        widget=forms.ClearableFileInput(attrs={"multiple": True})
    )
