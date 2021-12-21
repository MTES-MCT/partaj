"""
Forms for the Partaj core app.
"""
from django import forms
from django.core.exceptions import ValidationError

from .fields import ArrayField
from .models import Referral, ReferralAnswer, ReferralMessage, ReferralState


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

    assignee = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    state = ArrayField(required=False, base_type=forms.ChoiceField(choices=ReferralState.choices))
    task = forms.CharField(required=False, max_length=20)
    unit = forms.CharField(required=False, max_length=50)
    user = forms.CharField(required=False, max_length=50)

    def __init__(self, *args, data=None, **kwargs):
        """
        Fix up query parameter data to make lists for ArrayField and single values for
        other kinds of fields.
        """
        # QueryDict/MultiValueDict breaks lists: we need to fix them manually
        data_fixed = (
            {
                key: data.getlist(key)
                # Only setup lists for form keys that use ArrayField
                if isinstance(self.base_fields[key], ArrayField) else value[0]
                for key, value in data.lists()
            }
            if data
            else {}
        )

        super().__init__(data=data_fixed, *args, **kwargs)

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
