"""
Rest framework serializers, using as many builtins as we can to interface between our Django models
and the JSON on the API.
"""
from rest_framework import serializers

from partaj.users.models import User
from . import models


class ReferralActivityItemField(serializers.RelatedField):
    """
    A custom field to use for the ReferralActivity item_content_object generic relationship.
    """

    def to_representation(self, value):
        """
        Serialize item content objects to their nested self.
        """
        if isinstance(value, User):
            serializer = UserSerializer(value)
        elif isinstance(value, models.ReferralAnswer):
            serializer = ReferralAnswerSerializer(value)
        elif isinstance(value, models.ReferralAnswerValidationRequest):
            serializer = ReferralAnswerValidationRequestSerializer(value)
        elif isinstance(value, models.ReferralAnswerValidationResponse):
            serializer = ReferralAnswerValidationResponseSerializer(value)
        else:
            raise Exception(
                "Unexpected type of related item content object on referral activity"
            )

        return serializer.data


class UserSerializer(serializers.ModelSerializer):
    """
    Regular user serializer. Allowlist fields as user objects contain a lot more information
    than we'd like to expose on the API.
    """

    class Meta:
        model = User
        fields = [
            "date_joined",
            "email",
            "first_name",
            "id",
            "is_staff",
            "is_superuser",
            "last_name",
            "phone_number",
            "unit_name",
            "username",
        ]


class UnitMembershipSerializer(serializers.ModelSerializer):
    """
    We want to specifically expose memberships on users when in the context of a unit so the
    frontend app can get information on their role in the unit.
    """

    class Meta:
        model = models.UnitMembership
        fields = "__all__"


class UnitMemberSerializer(serializers.ModelSerializer):
    """
    Custom serializer for users in the context of a unit. This serializer's purpose is to add the
    relevant membership onto the user as determined by the unit context.

    This serializer should never be used for users outside of the context of a unit.
    """

    membership = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = UserSerializer.Meta.fields + ["membership"]

    def __init__(self, *args, **kwargs):
        """
        Override init so we can access (and remove) the unit information in kwargs.
        """
        self.unit = kwargs.pop("unit")
        super(UnitMemberSerializer, self).__init__(*args, **kwargs)

    def get_membership(self, member):
        """
        Get the one membership for this user that links them with this unit. Unicity is guaranteed
        by a database constraint defined on the model, so we can safely use "get" here and be sure
        we do not miss anything.
        """
        return UnitMembershipSerializer(
            member.unitmembership_set.get(unit=self.unit)
        ).data


class UnitSerializer(serializers.ModelSerializer):
    """
    Unit serializer. Override default members to make use of the UnitMemberSerializer.
    """

    members = serializers.SerializerMethodField()

    class Meta:
        model = models.Unit
        fields = "__all__"

    def get_members(self, unit):
        """
        Pass the unit id as an additional keyword argument to the unit member serializer.
        """
        return [
            UnitMemberSerializer(member, unit=unit.id).data
            for member in unit.members.all()
        ]


class TopicSerializer(serializers.ModelSerializer):
    """
    Topic serializer. Passthrough that allows us to more precisely specify downstream serializers,
    including unit, members and memberships.
    """

    unit = UnitSerializer()

    class Meta:
        model = models.Topic
        fields = "__all__"


class ReferralActivitySerializer(serializers.ModelSerializer):
    """
    Referral activity serializer. We had to create a custom field to add the generic content
    object linked to the activity.
    """

    actor = UserSerializer()
    item_content_object = ReferralActivityItemField(read_only=True)

    class Meta:
        model = models.ReferralActivity
        fields = "__all__"


class ReferralAnswerAttachmentSerializer(serializers.ModelSerializer):
    """
    Referral answer attachment serializer. Add a utility to display attachments more
    easily on the client side.
    """

    name_with_extension = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralAnswerAttachment
        fields = "__all__"

    def get_name_with_extension(self, referral_answer_attachment):
        """
        Call the relevant utility method to add information on serialized referral answer attachments.
        """
        return referral_answer_attachment.get_name_with_extension()


class ReferralAnswerValidationResponseSerializer(serializers.ModelSerializer):
    """
    Referral answer validation response serializer. Not including the request to avoid a circular
    dependency as the request includes the response.
    """

    class Meta:
        model = models.ReferralAnswerValidationResponse
        fields = "__all__"


class ReferralAnswerValidationRequestSerializer(serializers.ModelSerializer):
    """
    Referral answer validation request serializer. All fields should be available as we're only
    linking a user and an answer to validate.
    """

    response = ReferralAnswerValidationResponseSerializer()
    validator = UserSerializer()

    class Meta:
        model = models.ReferralAnswerValidationRequest
        fields = "__all__"


class ReferralAnswerSerializer(serializers.ModelSerializer):
    """
    Referral answer serializer. All fields are available as there's no system or sensitive
    data on answers.
    """

    attachments = ReferralAnswerAttachmentSerializer(many=True)
    validation_requests = ReferralAnswerValidationRequestSerializer(many=True)

    class Meta:
        model = models.ReferralAnswer
        fields = "__all__"


class ReferralAttachmentSerializer(serializers.ModelSerializer):
    """
    Referral attachment serializer. Add a utility to display attachments more
    easily on the client side.
    """

    name_with_extension = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralAttachment
        fields = "__all__"

    def get_name_with_extension(self, referral_attachment):
        """
        Call the relevant utility method to add information on serialized referral attachments.
        """
        return referral_attachment.get_name_with_extension()


class ReferralUrgencySerializer(serializers.ModelSerializer):
    """
    Referral urgency serializer.
    """

    name = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralUrgency
        fields = "__all__"

    def get_name(self, referral_urgency):
        """
        Extract the name for the referral urgency. This is necessary to get a single name field
        in the output, from Django-parler translated fields.
        """
        return referral_urgency.name


class ReferralSerializer(serializers.ModelSerializer):
    """
    Referral serializer. Uses our other serializers to limit available data on our nested objects
    and add relevant information where applicable.
    """

    activity = ReferralActivitySerializer(many=True)
    answers = ReferralAnswerSerializer(many=True)
    attachments = ReferralAttachmentSerializer(many=True)
    expected_answer_date = serializers.SerializerMethodField()
    topic = TopicSerializer()
    user = UserSerializer()
    urgency_level = ReferralUrgencySerializer()

    class Meta:
        model = models.Referral
        fields = "__all__"

    def get_expected_answer_date(self, referral):
        """
        Delegate to the model method. This exists to add the date to the serialized referrals.
        """
        return referral.get_expected_answer_date()
