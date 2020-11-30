from django import forms

from .models import Referral, ReferralAnswer


class ReferralForm(forms.ModelForm):
    class Meta:
        model = Referral
        fields = [
            "context",
            "object",
            "prior_work",
            "question",
            "requester",
            "topic",
            "urgency",
            "urgency_explanation",
            "user",
        ]

    files = forms.FileField(
        required=False, widget=forms.ClearableFileInput(attrs={"multiple": True})
    )


class ReferralAnswerForm(forms.ModelForm):
    class Meta:
        model = ReferralAnswer
        fields = [
            "content",
            "created_by",
            "referral",
            "state",
        ]

    content = forms.CharField(required=False, widget=forms.Textarea)
    files = forms.FileField(
        required=False, widget=forms.ClearableFileInput(attrs={"multiple": True})
    )
