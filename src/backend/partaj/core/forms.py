from django import forms

from .models import Referral


class ReferralForm(forms.ModelForm):
    class Meta:
        model = Referral
        fields = [
            "context",
            "prior_work",
            "question",
            "requester",
            "topic",
            "urgency",
            "urgency_explanation",
            "user",
        ]

    files = forms.FileField(
        required=False,
        widget=forms.ClearableFileInput(attrs={"multiple": True})
    )
