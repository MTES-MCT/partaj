# pylint: disable=too-many-branches
"""
Forms for the Partaj core app.
"""
from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils.translation import gettext_lazy as _

from .fields import ArrayField

from .models import (  # isort:skip
    Referral,
    ReferralAnswer,
    ReferralMessage,
    ReferralState,
    RequesterUnitType,
)


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


class NewReferralForm(forms.ModelForm):
    """
    Form to facilitate the creation of referral instances.
    """

    def clean(self):
        cleaned_data = super().clean()
        topic = cleaned_data.get("topic")
        urgency_level = cleaned_data.get("urgency_level")
        prior_work = cleaned_data.get("prior_work")
        has_prior_work = cleaned_data.get("has_prior_work")
        requester_unit_type = cleaned_data.get("requester_unit_type")
        referral = self.instance

        if not topic:
            self.add_error("topic", "topic")
        if not urgency_level:
            self.add_error("urgency_level", "urgency_level")
        if not prior_work:
            self.add_error("prior_work", "preliminary_work_empty")

        if (
            requester_unit_type == RequesterUnitType.CENTRAL_UNIT
            and has_prior_work == "no"
        ):
            for attachment in referral.attachments.all():
                attachment.delete()
        if (
            requester_unit_type == RequesterUnitType.CENTRAL_UNIT
            and has_prior_work == "yes"
        ):
            if not referral.attachments.all() and not prior_work:
                self.add_error("prior_work", "preliminary_work_central_not_fill")

        if (
            requester_unit_type == RequesterUnitType.DECENTRALISED_UNIT
            and has_prior_work == "yes"
        ):
            if not cleaned_data.get("requester_unit_contact"):
                self.add_error("prior_work", "preliminary_work_no_contact")
            else:
                try:
                    validate_email(cleaned_data.get("requester_unit_contact"))
                except ValidationError:
                    self.add_error(
                        "requester_unit_contact", "preliminary_work_invalid_email"
                    )

            if not referral.attachments.all() and not prior_work:
                self.add_error("prior_work", "preliminary_work_decentralized_not_fill")

        if (
            requester_unit_type == RequesterUnitType.DECENTRALISED_UNIT
            and has_prior_work == "no"
        ):
            if not cleaned_data.get("no_prior_work_justification"):
                self.add_error(
                    "no_prior_work_justification",
                    "preliminary_work_no_prior_work_justification",
                )

    class Meta:
        model = Referral
        fields = [
            "context",
            "object",
            "has_prior_work",
            "question",
            "topic",
            "urgency",
            "urgency_explanation",
            "users",
            "urgency_level",
            "requester_unit_type",
            "requester_unit_contact",
            "prior_work",
        ]

    context = forms.CharField(required=True)
    object = forms.CharField(required=True)
    has_prior_work = forms.CharField(required=True)
    question = forms.CharField(required=True)
    requester_unit_type = forms.ChoiceField(
        required=True, choices=RequesterUnitType.choices
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


class BaseApiListQueryForm(forms.Form):
    """
    Common alternative base form class for API List query parameters. Enables support
    for both single params and lists as values for params.
    """

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


class ReferralListQueryForm(BaseApiListQueryForm):
    """
    Form to validate query parameters for referral list requests on the API.
    """

    assignee = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    due_date_after = forms.DateTimeField(required=False)
    due_date_before = forms.DateTimeField(required=False)
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)
    query = forms.CharField(required=False, max_length=100)
    sort = forms.ChoiceField(
        required=False,
        choices=(
            ("case_number", _("case number")),
            (
                "due_date",
                _("due date"),
            ),
            ("object.keyword", _("object")),
            ("users_unit_name_sorting", _("requesters")),
            ("assignees_sorting", _("assignees")),
            ("state_number", _("state")),
            ("created_at", _("created_at")),
            ("published_date", _("published date")),
        ),
    )
    sort_dir = forms.ChoiceField(
        required=False, choices=(("asc", _("ascending")), ("desc", _("descending")))
    )
    state = ArrayField(
        required=False, base_type=forms.ChoiceField(choices=ReferralState.choices)
    )
    task = forms.CharField(required=False, max_length=20)
    topic = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    unit = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    users_unit_name = ArrayField(
        required=False, base_type=forms.CharField(max_length=50)
    )
    user = ArrayField(required=False, base_type=forms.CharField(max_length=50))


class NoteListQueryForm(BaseApiListQueryForm):
    """
    Form to validate query parameters for note list requests on the API.
    """

    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)
    query = forms.CharField(required=False, max_length=100)
    topic = ArrayField(required=False, base_type=forms.CharField(max_length=255))
    requesters_unit_names = ArrayField(
        required=False, base_type=forms.CharField(max_length=255)
    )
    assigned_units_names = ArrayField(
        required=False, base_type=forms.CharField(max_length=255)
    )
    contributors = ArrayField(required=False, base_type=forms.CharField(max_length=510))
    publication_date_after = forms.DateTimeField(required=False)
    publication_date_before = forms.DateTimeField(required=False)


class TopicListQueryForm(BaseApiListQueryForm):
    """
    Form to validate query parameters for topic lite list requests on the API.
    """

    id = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)


class UnitListQueryForm(BaseApiListQueryForm):
    """
    Form to validate query parameters for unit lite list requests on the API.
    """

    id = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)


class UserListQueryForm(BaseApiListQueryForm):
    """
    Form to validate query parameters for user lite list requests on the API.
    """

    id = ArrayField(required=False, base_type=forms.CharField(max_length=50))
    limit = forms.IntegerField(required=False)
    offset = forms.IntegerField(required=False)
