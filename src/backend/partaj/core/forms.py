"""
Forms for the Partaj core app.
"""
from django import forms
from django.core.exceptions import ValidationError

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



class ReferralListQueryForm(forms.Form):
    """
    Form to validate query parameters for referral list requests on the API.
    """

    task = forms.CharField(required=False, max_length=20)
    unit = forms.CharField(required=False, max_length=50)
    user = forms.CharField(required=False, max_length=50)

    def clean(self):
        """
        Add specific validation logic that does not belong to a specific field.
        None of the "task", "unit" and "user" field are individually required, but at least
        one of those must be provided or we should raise a validation error.
        """
        not_none = self.data.get("task", None) or self.data.get("unit", None) or self.data.get("user", None)
        if not_none is None:
            raise ValidationError("Referral list requests require at least a task/unit/user parameter.")
        return self.cleaned_data
