"""
Rest framework serializers, using as many builtins as we can to interface between our Django models
and the JSON on the API.
"""
from rest_framework import serializers

from partaj.users.models import User
from .models import (
    Referral,
    ReferralActivity,
    ReferralAnswer,
    Topic,
    Unit,
    UnitMembership,
)


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
        elif isinstance(value, ReferralAnswer):
            serializer = ReferralAnswerSerializer(value)
        else:
            raise Exception(
                "Unexpected type of related item content object on reeferral activity"
            )

        return serializer.data


class UserSerializer(serializers.ModelSerializer):
    """
    Regular user serializer. Allowlist fields as user objects contain a lot more information
    than we'd like to expost on the API.
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
            "unite",
            "username",
        ]


class UnitMembershipSerializer(serializers.ModelSerializer):
    """
    We want to specifically expose memberships on users when in the context of a unit so the
    frontend app can get information on their role in the unit.
    """

    class Meta:
        model = UnitMembership
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
        model = Unit
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
        model = Topic
        fields = "__all__"


class ReferralAnswerSerializer(serializers.ModelSerializer):
    """
    Referral answer serializer. All fields are available as there's no system or sensitive
    data on answers.
    """

    class Meta:
        model = ReferralAnswer
        fields = "__all__"


class ReferralActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer()
    item_content_object = ReferralActivityItemField(read_only=True)

    class Meta:
        model = ReferralActivity
        fields = "__all__"


class ReferralSerializer(serializers.ModelSerializer):
    """
    Referral serializer. Uses our other serializers to limit available data on our nested objects
    and add relevant information where applicable.
    """

    activity = ReferralActivitySerializer(many=True)
    answers = ReferralAnswerSerializer(many=True)
    topic = TopicSerializer()
    user = UserSerializer()

    class Meta:
        model = Referral
        fields = "__all__"
