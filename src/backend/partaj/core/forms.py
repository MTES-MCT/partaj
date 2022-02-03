"""
Forms for the Partaj core app.
"""
from django import forms

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
            "urgency_level",
        ]

    context = forms.CharField(required=True, widget=forms.Textarea)
    object = forms.CharField(required=True, widget=forms.Textarea)
    prior_work = forms.CharField(required=True, widget=forms.Textarea)
    question = forms.CharField(required=True, widget=forms.Textarea)
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
    due_date_after = forms.DateTimeField(required=False)
    due_date_before = forms.DateTimeField(required=False)
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)
    state = ArrayField(
        required=False, base_type=forms.ChoiceField(choices=ReferralState.choices)
    )
    task = forms.CharField(required=False, max_length=20)
    unit = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    user = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    topic = ArrayField(required=False, base_type=forms.CharField(max_length=50))

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
