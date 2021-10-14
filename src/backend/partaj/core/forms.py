"""
Forms for the Partaj core app.
"""
from django import forms

from .models import Referral, ReferralAnswer, ReferralMessage


class ReferralForm(forms.ModelForm):
    """
    Form to facilitate the creation of referral instances.
    """

    class Meta:
        model = Referral
        fields = [
            "context",
            "object",
            "prior_work",
            "question",
            "topic",
            "urgency",
            "urgency_explanation",
            "users",
        ]

    files = forms.FileField(
        required=False, widget=forms.ClearableFileInput(attrs={"multiple": True})
    )


class ReferralAnswerForm(forms.ModelForm):
    """
    Form to facilitate the creation of referral answer instances.
    """

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


class ReferralMessageForm(forms.ModelForm):
    """
    Form to facilitate the creation of referral message instances.
    """

    class Meta:
        model = ReferralMessage
        fields = [
            "content",
            "referral",
            "user",
        ]

    content = forms.CharField(required=False, widget=forms.Textarea)
    files = forms.FileField(
        required=False, widget=forms.ClearableFileInput(attrs={"multiple": True})
    )
