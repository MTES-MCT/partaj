"""
Rest framework serializers, using as many builtins as we can to interface between our Django models
and the JSON on the API.
"""
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import serializers

from partaj.core.models import ReferralAnswer, ReferralState, Unit, UnitMembershipRole
from partaj.users.models import User

from . import models, services
from .models import ReportEventState

# pylint: disable=abstract-method
# pylint: disable=R1705
# pylint: disable=too-many-lines


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
        elif isinstance(value, models.ReferralUrgencyLevelHistory):
            serializer = ReferralUrgencyLevelHistorySerializer(value)
        elif isinstance(value, models.ReferralReportVersion):
            serializer = ReferralReportVersionSerializer(value)
        elif isinstance(value, models.ReferralTitleHistory):
            serializer = ReferralTitleHistorySerializer(value)
        elif isinstance(value, models.ReferralTopicHistory):
            serializer = ReferralTopicHistorySerializer(value)

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
    has_db_access = serializers.SerializerMethodField()

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
            "has_db_access",
        ]

    def get_memberships(self, member):
        """
        Get all the memberships for the current user.
        """
        return UnitMembershipSerializer(
            member.unitmembership_set.all().order_by("unit__name"), many=True
        ).data

    def get_has_db_access(self, member):
        """
        Define if the user has access to notes database
        """
        return len(member.unitmembership_set.filter(unit__kdb_access=True)) > 0


class UserLiteSerializer(serializers.ModelSerializer):
    """
    Lite user serializer. Allow list only the minimal number of fields that are necessary to
    perform actions involving users without having access to their personal information.
    """

    class Meta:
        model = User
        fields = ["first_name", "id", "last_name", "unit_name"]


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
        return "/".join(membership.unit.name.split("/")[-2:])


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
            "is_tester",
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
    owners = serializers.SerializerMethodField()

    class Meta:
        model = models.Topic
        fields = "__all__"

    def get_unit_name(self, topic):
        """
        Add the related unit name directly on topics to avoid querying units and all their
        content.
        """
        return topic.unit.name

    def get_owners(self, topic):
        """
        Add the related unit name directly on topics to avoid querying units and all their
        content.
        """
        memberships = Unit.objects.get(id=topic.unit.id).get_memberships().filter(role__in=[UnitMembershipRole.OWNER])

        return UserLiteSerializer([membership.user for membership in memberships], many=True).data


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


class NotifiedUserSerializer(serializers.ModelSerializer):
    """
    Min user serializer for notifiations.
    """

    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["display_name"]

    def get_display_name(self, notified_user):
        """
        Get the displayed notification name
        """
        return notified_user.get_notification_name()


class NotificationSerializer(serializers.ModelSerializer):
    """
    Notification serializer
    """

    notified = NotifiedUserSerializer()

    class Meta:
        model = models.Notification
        fields = ["notified", "id"]


class EventMetadataSerializer(serializers.ModelSerializer):
    """
    Action request serializer.
    """

    class Meta:
        model = models.EventMetadata
        fields = [
            "id",
            "receiver_unit_name",
            "receiver_role",
            "sender_role",
        ]


class MinVersionSerializer(serializers.ModelSerializer):
    """
    Minimal referral report version serializer.
    """

    class Meta:
        model = models.ReferralReportVersion
        fields = ["version_number"]


class ReportEventSerializer(serializers.ModelSerializer):
    """
    Report event serializer. Only include lite info on the user and the UUID
    for the referral as more data should be available in context for our use cases.
    """

    user = UserLiteSerializer()
    notifications = NotificationSerializer(many=True)
    metadata = EventMetadataSerializer()
    version = MinVersionSerializer()

    class Meta:
        model = models.ReportEvent
        fields = [
            "id",
            "content",
            "created_at",
            "report",
            "state",
            "verb",
            "user",
            "metadata",
            "notifications",
            "version",
            "is_granted_user_notified",
        ]


class MinReferralReportSerializer(serializers.ModelSerializer):
    """
    Referral Report serializer including minimal info to fetch the object from frontend
    """

    class Meta:
        model = models.ReferralReport
        fields = [
            "id",
            "created_at",
            "updated_at",
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


class VersionDocumentSerializer(serializers.ModelSerializer):
    """
    Report version document serializer. Add a utility to display document more
    easily on the client side.
    """

    name_with_extension = serializers.SerializerMethodField()

    class Meta:
        model = models.VersionDocument
        fields = "__all__"

    def get_name_with_extension(self, version_document):
        """
        Call the relevant utility method to add information on serialized
        report version document.
        """
        return version_document.get_name_with_extension()


class NoteDocumentSerializer(serializers.ModelSerializer):
    """
    Report version document serializer. Add a utility to display document more
    easily on the client side.
    """

    name_with_extension = serializers.SerializerMethodField()

    class Meta:
        model = models.NoteDocument
        fields = "__all__"

    def get_name_with_extension(self, version_document):
        """
        Call the relevant utility method to add information on serialized
        report version document.
        """
        return version_document.get_name_with_extension()


class ReferralAnswerSerializer(serializers.ModelSerializer):
    """
    Referral answer serializer. All fields are available as there's no system or sensitive
    data on answers.
    """

    attachments = ReferralAnswerAttachmentSerializer(many=True)
    created_by = UserSerializer()
    validators = serializers.SerializerMethodField()

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
            "validators",
        ]

    # pylint: disable=arguments-differ
    def get_validators(self, referral_answer):
        """
        Return a list of lite user objects for all users who validated the answer.
        """
        try:
            return [
                UserLiteSerializer(validation_request.validator).data
                for validation_request in referral_answer.draft_answer.validation_requests.filter(
                    response__state=models.ReferralAnswerValidationResponseState.VALIDATED
                ).select_related(
                    "validator"
                )
            ]
        except ObjectDoesNotExist:
            return []


class ReferralReportVersionSerializer(serializers.ModelSerializer):
    """
    Referral report version serializer.
    """

    document = VersionDocumentSerializer()
    created_by = UserSerializer()
    events = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralReportVersion
        fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "document",
            "events",
            "version_number",
        ]

    def get_events(self, version):
        """
        Helper to get only active event on a version
        """
        events = version.events.filter(
            state__in=[ReportEventState.ACTIVE, ReportEventState.OBSOLETE]
        ).order_by("-created_at")

        return ReportEventSerializer(events, many=True).data


class ReferralReportAttachmentSerializer(serializers.ModelSerializer):
    """
    Version attachment serializer. Add a utility to display attachments more
    easily on the client side.
    """

    name_with_extension = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralReportAttachment
        fields = "__all__"

    def get_name_with_extension(self, version_attachment):
        """
        Call the relevant utility method to add information on serialized version attachments.
        """
        return version_attachment.get_name_with_extension()


class ReferralUserLinkSerializer(serializers.ModelSerializer):
    """
    Referral report serializer.
    """

    id = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = models.ReferralUserLink
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "unit_name",
            "role",
            "notifications",
        ]

    def get_id(self, referraluserlink):
        """
        Return user id
        """
        return referraluserlink.user.id

    def get_email(self, referraluserlink):
        """
        Return user email
        """
        return referraluserlink.user.email

    def get_first_name(self, referraluserlink):
        """
        Return user first name
        """
        return referraluserlink.user.first_name

    def get_last_name(self, referraluserlink):
        """
        Return user last name
        """
        return referraluserlink.user.last_name

    def get_unit_name(self, referraluserlink):
        """
        Return user unit name
        """
        return referraluserlink.user.unit_name


class ReferralReportSerializer(serializers.ModelSerializer):
    """
    Referral report serializer.
    """

    versions = ReferralReportVersionSerializer(many=True)
    last_version = serializers.SerializerMethodField()
    final_version = ReferralReportVersionSerializer()
    attachments = ReferralReportAttachmentSerializer(many=True)

    class Meta:
        model = models.ReferralReport
        fields = [
            "id",
            "versions",
            "comment",
            "last_version",
            "final_version",
            "published_at",
            "created_at",
            "updated_at",
            "state",
            "attachments",
        ]

    def get_last_version(self, referral_report):
        """
        Delegate to the model method.
        """
        last_version = referral_report.get_last_version()
        if not last_version:
            return None
        return ReferralReportVersionSerializer(last_version).data


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


class ReferralUrgencyLevelHistorySerializer(serializers.ModelSerializer):
    """
    ReferralUrgencyLevelHistory serializer.
    """

    new_referral_urgency = ReferralUrgencySerializer()
    old_referral_urgency = ReferralUrgencySerializer()

    class Meta:
        model = models.ReferralUrgencyLevelHistory
        fields = "__all__"


class ReferralNoteSerializer(serializers.ModelSerializer):
    """
    Note serializer.
    """

    document = NoteDocumentSerializer()

    class Meta:
        model = models.ReferralNote
        fields = "__all__"


class FeatureFlagSerializer(serializers.ModelSerializer):
    """
    FeatureFLag serializer. Just convert the date of the tag to an active (1) / inactive (0) state
    """

    is_active = serializers.SerializerMethodField()

    class Meta:
        model = models.FeatureFlag
        fields = ["is_active"]

    @staticmethod
    def get_is_active(feature_flag):
        """
        Delegate to the FeatureFlagService as this logic is used at multiple app places.
        """
        return services.FeatureFlagService.get_state(feature_flag.tag)


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
    urgency_level = ReferralUrgencySerializer()
    observers = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()
    requesters = serializers.SerializerMethodField()
    feature_flag = serializers.SerializerMethodField()
    validation_state = serializers.SerializerMethodField()
    report = MinReferralReportSerializer()
    prior_work = serializers.SerializerMethodField()
    published_date = serializers.SerializerMethodField()
    answer_options = serializers.SerializerMethodField()
    satisfaction_survey_participants = serializers.SerializerMethodField()
    context = serializers.SerializerMethodField()
    urgency_explanation = serializers.SerializerMethodField()
    question = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    object = serializers.SerializerMethodField()

    class Meta:
        model = models.Referral
        fields = "__all__"

    def get_due_date(self, referral):
        """
        Delegate to the model method. This exists to add the date to the serialized referrals.
        """
        return referral.get_due_date()

    def get_answer_options(self, referral):
        """
        Generate JSON field for staff answer properties choice
        """
        if (
            services.FeatureFlagService.get_referral_version(referral) == 1
            or referral.state != ReferralState.ANSWERED
        ):
            return None

        referral_answer = ReferralAnswer.objects.filter(
            state=models.ReferralAnswerState.PUBLISHED,
            referral__id=referral.id,
        ).last()

        if not referral_answer:
            return None

        options = [
            {"name": attachment.name, "value": "ATTACHMENT_" + str(attachment.id)}
            for attachment in referral_answer.attachments.all()
        ]

        options.append({"name": "Editeur", "value": "EDITOR"})
        options.append({"name": "N/A", "value": "none"})

        return options

    def get_feature_flag(self, referral):
        """
        Delegate to the FeatureFlagService as this logic is used at multiple app places.
        """
        return services.FeatureFlagService.get_referral_version(referral)

    def get_validation_state(self, referral):
        """
        Delegate to the FeatureFlagService
        """
        return services.FeatureFlagService.get_validation_state()

    def get_users(self, referral):
        """
        Helper to serialize all users linked to the referral.
        """
        referraluserlinks = referral.get_referraluserlinks().all()

        users = ReferralUserLinkSerializer(referraluserlinks, many=True)

        return users.data

    def get_context(self, referral):
        """
        Return empty string if context is null
        """

        return referral.context if referral.context else ""

    def get_prior_work(self, referral):
        """
        Return empty string if prior_work is null
        """

        return referral.prior_work if referral.prior_work else ""

    def get_urgency_explanation(self, referral):
        """
        Return empty string if urgency_explanation is null
        """

        return referral.urgency_explanation if referral.urgency_explanation else ""

    def get_question(self, referral):
        """
        Return empty string if question is null
        """

        return referral.question if referral.question else ""

    def get_title(self, referral):
        """
        Return empty string if title is null
        """

        return referral.title if referral.title else ""

    def get_object(self, referral):
        """
        Return empty string if object is null
        """

        return referral.object if referral.object else ""


    def get_satisfaction_survey_participants(self, referral):
        """
        Retrieves user survey participants
        """
        return [user.id for user in referral.satisfaction_survey_participants.all()]

    def get_observers(self, referral):
        """
        Helper to get only users with OBSERVER role in observers serialization.
        """
        referraluserlinks = (
            referral.get_referraluserlinks()
            .filter(role=models.ReferralUserLinkRoles.OBSERVER)
            .all()
        )

        observers = ReferralUserLinkSerializer(referraluserlinks, many=True)

        return observers.data

    def get_requesters(self, referral):
        """
        Helper to get only users with REQUESTER role in users serialization.
        """
        referraluserlinks = (
            referral.get_referraluserlinks()
            .filter(role=models.ReferralUserLinkRoles.REQUESTER)
            .all()
        )

        requesters = ReferralUserLinkSerializer(referraluserlinks, many=True)

        return requesters.data

    def get_published_date(self, referral):
        """
        Helper to get referral answer publication date during serialization.
        """
        version = services.FeatureFlagService.get_referral_version(referral)

        if version:
            if not referral.report:
                return None
            return referral.report.published_at
        else:
            try:
                return (
                    models.ReferralAnswer.objects.filter(
                        referral__id=referral.id,
                        state=models.ReferralAnswerState.PUBLISHED,
                    )
                    .latest("created_at")
                    .created_at
                )

            except ObjectDoesNotExist:
                return None


class ReferralRequestValidationSerializer(serializers.ModelSerializer):
    """
    Referral serializer on request validation.
    """

    report = ReferralReportSerializer()

    class Meta:
        model = models.Referral
        fields = [
            "report",
            "state",
        ]


class EventLiteSerializer(serializers.ModelSerializer):
    """
    Referral lite serializer. Avoids the use of nested serializers and nested objects to limit
    the number of requests to the database, and make list API requests faster.

    Some properties need to be annotated onto the referrals for performance.
    """

    receiver_role = serializers.SerializerMethodField()
    receiver_unit_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    sender_id = serializers.SerializerMethodField()

    class Meta:
        model = models.ReportEvent
        fields = [
            "verb",
            "receiver_role",
            "receiver_unit_name",
            "sender_role",
            "state",
            "sender_id",
        ]

    def get_receiver_role(self, event):
        """
        Helper to get event receiver role from metadata
        """
        if not event.metadata:
            return None
        return event.metadata.receiver_role

    def get_sender_id(self, event):
        """
        Helper to get user id
        """
        return event.user.id

    def get_receiver_unit_name(self, event):
        """
        Helper to get event receiver unit from metadata
        """
        if not event.metadata or not event.metadata.receiver_unit_name:
            return None
        return event.metadata.receiver_unit_name

    def get_sender_role(self, event):
        """
        Helper to get event sender role from metadata
        """
        if not event.metadata:
            return None
        return event.metadata.sender_role


class ReferralLiteSerializer(serializers.ModelSerializer):
    """
    Referral lite serializer. Avoids the use of nested serializers and nested objects to limit
    the number of requests to the database, and make list API requests faster.

    Some properties need to be annotated onto the referrals for performance.
    """

    assignees = UserLiteSerializer(many=True)
    events = serializers.SerializerMethodField()
    due_date = serializers.SerializerMethodField()
    published_date = serializers.SerializerMethodField()
    observers = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()
    requesters = serializers.SerializerMethodField()

    class Meta:
        model = models.Referral
        fields = [
            "assignees",
            "due_date",
            "created_at",
            "id",
            "events",
            "object",
            "state",
            "requesters",
            "users",
            "observers",
            "published_date",
            "title",
        ]

    def get_users(self, referral_lite):
        """
        Helper to serialize all users linked to the referral.
        """
        referraluserlinks = referral_lite.get_referraluserlinks().all()

        users = ReferralUserLinkSerializer(referraluserlinks, many=True)

        return users.data

    def get_requesters(self, referral_lite):
        """
        Helper to get only users with REQUESTER role in users serialization.
        """
        referraluserlinks = (
            referral_lite.get_referraluserlinks()
            .filter(role=models.ReferralUserLinkRoles.REQUESTER)
            .all()
        )

        requesters = ReferralUserLinkSerializer(referraluserlinks, many=True)

        return requesters.data

    def get_observers(self, referral_lite):
        """
        Helper to get only users with OBSERVER role in observers serialization.
        """
        referraluserlinks = (
            referral_lite.get_referraluserlinks()
            .filter(role=models.ReferralUserLinkRoles.OBSERVER)
            .all()
        )

        observers = ReferralUserLinkSerializer(referraluserlinks, many=True)

        return observers.data

    def get_published_date(self, referral_lite):
        """
        Helper to get referral answer published date during serialization.
        """
        version = services.FeatureFlagService.get_referral_version(referral_lite)

        if version:
            if not referral_lite.report:
                return None
            return referral_lite.report.published_at
        else:
            try:
                return (
                    models.ReferralAnswer.objects.filter(
                        referral__id=referral_lite.id,
                        state=models.ReferralAnswerState.PUBLISHED,
                    )
                    .latest("created_at")
                    .created_at
                )

            except ObjectDoesNotExist:
                return None

    def get_due_date(self, referral_lite):
        """
        Helper to get referral due date during serialization.
        Note: we might use an annotation to calculate this instead for large batches
        of referrals.
        """
        return referral_lite.get_due_date()

    def get_events(self, referral_lite):
        """
        Helper
        """
        if not referral_lite.report or not referral_lite.report.get_last_version():
            return None

        events = (
            referral_lite.report.get_last_version()
            .events.filter(
                state=ReportEventState.ACTIVE,
            )
            .all()
        )

        return EventLiteSerializer(events, many=True).data


class FinalReferralReportSerializer(serializers.ModelSerializer):
    """
    Referral report serializer.
    """

    final_version = ReferralReportVersionSerializer()
    attachments = ReferralReportAttachmentSerializer(many=True)

    class Meta:
        model = models.ReferralReport
        fields = [
            "id",
            "comment",
            "final_version",
            "published_at",
            "attachments",
        ]


class ReferralTitleHistorySerializer(serializers.ModelSerializer):
    """
    Referral title serializer
    """

    class Meta:
        model = model = models.ReferralTitleHistory
        fields = "__all__"


class ReferralTopicHistorySerializer(serializers.ModelSerializer):
    """
    Serialize ReferralTopicHistory
    """

    class Meta:
        model = model = models.ReferralTopicHistory
        fields = "__all__"
