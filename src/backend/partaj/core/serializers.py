"""
Rest framework serializers, using as many builtins as we can to interface between our Django models
and the JSON on the API.
"""
from rest_framework import serializers

from partaj.users.models import User

from . import models


# pylint: disable=abstract-method
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
        elif isinstance(value, models.Unit):
            serializer = UnitSerializer(value)
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

    memberships = serializers.SerializerMethodField()

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
            "memberships",
            "phone_number",
            "unit_name",
            "username",
        ]

    def get_memberships(self, member):
        """
        Get all the memberships for the current user.
        """
        return UnitMembershipSerializer(member.unitmembership_set.all(), many=True).data


class UserLiteSerializer(serializers.ModelSerializer):
    """
    Lite user serializer. Allowlist only the minimal number of fields that are necessary to
    perform actions involving users without having access to their personal information.
    """

    class Meta:
        model = User
        fields = ["first_name", "id", "last_name"]


class UnitMembershipSerializer(serializers.ModelSerializer):
    """
    We want to specifically expose memberships on users when in the context of a unit so the
    frontend app can get information on their role in the unit.
    """

    unit_name = serializers.SerializerMethodField()
    user = UserLiteSerializer()

    class Meta:
        model = models.UnitMembership
        fields = "__all__"

    def get_unit_name(self, membership):
        """
        Add the unit name as readable by a human to the serialized memberships.
        """
        return membership.unit.name


class UnitMemberSerializer(serializers.ModelSerializer):
    """
    Custom serializer for users in the context of a unit. This serializer's purpose is to add the
    relevant membership onto the user as determined by the unit context.

    This serializer should never be used for users outside of the context of a unit.
    """

    membership = serializers.SerializerMethodField()

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
            "membership",
            "phone_number",
            "unit_name",
            "username",
        ]

    def __init__(self, *args, **kwargs):
        """
        Override init so we can access (and remove) the unit information in kwargs.
        """
        self.unit = kwargs.pop("unit")
        super().__init__(*args, **kwargs)

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
    Topic serializer. Needs to be careful about performance as it is used in some large lists.
    """

    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = models.Topic
        fields = "__all__"

    def get_unit_name(self, topic):
        """
        Add the related unit name directly on topics to avoid querying units and all their
        content.
        """
        return topic.unit.name


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


class ReferralMessageAttachmentSerializer(serializers.ModelSerializer):
    """
    Referral message attachment serializer. Add a utility to display attachments more
    easily on the client side.
    """

    name_with_extension = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralMessageAttachment
        fields = "__all__"

    def get_name_with_extension(self, referral_message_attachment):
        """
        Call the relevant utility method to add information on serialized
        referral message attachments.
        """
        return referral_message_attachment.get_name_with_extension()


class ReferralMessageSerializer(serializers.ModelSerializer):
    """
    Referral message serializer. Only include lite info on the user and the UUID
    for the referral as more data should be available in context for our use cases.
    """

    attachments = ReferralMessageAttachmentSerializer(many=True)
    user = UserLiteSerializer()

    class Meta:
        model = models.ReferralMessage
        fields = [
            "attachments",
            "content",
            "created_at",
            "id",
            "referral",
            "user",
        ]


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
        Call the relevant utility method to add information on serialized
        referral answer attachments.
        """
        return referral_answer_attachment.get_name_with_extension()


class ReferralAnswerSerializer(serializers.ModelSerializer):
    """
    Referral answer serializer. All fields are available as there's no system or sensitive
    data on answers.
    """

    attachments = ReferralAnswerAttachmentSerializer(many=True)
    created_by = UserSerializer()

    class Meta:
        model = models.ReferralAnswer
        fields = [
            "attachments",
            "content",
            "created_by",
            "created_at",
            "draft_answer",
            "id",
            "published_answer",
            "referral",
            "state",
            "updated_at",
        ]


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

    answer = ReferralAnswerSerializer()
    response = ReferralAnswerValidationResponseSerializer()
    validator = UserSerializer()

    class Meta:
        model = models.ReferralAnswerValidationRequest
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

    answers = ReferralAnswerSerializer(many=True)
    assignees = UserLiteSerializer(many=True)
    attachments = ReferralAttachmentSerializer(many=True)
    due_date = serializers.SerializerMethodField()
    topic = TopicSerializer()
    units = UnitSerializer(many=True)
    user = UserSerializer()
    urgency_level = ReferralUrgencySerializer()

    class Meta:
        model = models.Referral
        fields = "__all__"

    def get_due_date(self, referral):
        """
        Delegate to the model method. This exists to add the date to the serialized referrals.
        """
        return referral.get_due_date()


class ReferralLiteSerializer(serializers.ModelSerializer):
    """
    Referral lite serializer. Avoids the use of nested serializers and nested objects to limit
    the number of requests to the database, and make list API requests faster.

    Some properties need to be annotated onto the referrals for performance.
    """

    assignees = UserLiteSerializer(many=True)
    due_date = serializers.SerializerMethodField()
    requester_unit_name = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()

    class Meta:
        model = models.Referral
        fields = [
            "assignees",
            "due_date",
            "id",
            "object",
            "requester",
            "requester_unit_name",
            "state",
            "unit",
        ]

    def get_due_date(self, referral_lite):
        """
        We expect referral lite queries to annotate due dates onto referrals.
        """
        return referral_lite.due_date

    def get_requester_unit_name(self, referral_lite):
        """
        We expect referral lite queries to annotate requester unit names onto referrals.
        """
        return referral_lite.requester_unit_name

    def get_unit(self, referral_lite):
        """
        We expect referral lite queries to annotate units directly onto referrals.
        """
        return referral_lite.unit
