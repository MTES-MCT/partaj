"""
Factories for models used in Partaj tests.
"""
from datetime import datetime, timedelta
from io import BytesIO
from random import randrange

from django.contrib.auth import get_user_model
from django.core.files.base import File

import factory

from . import models


class UserFactory(factory.django.DjangoModelFactory):
    """Create users for test purposes."""

    class Meta:
        model = get_user_model()

    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.Faker("phone_number")
    title = factory.Faker("prefix")
    unit_name = factory.Faker("company")
    username = factory.Faker("email")
    ministry = "MTES"


class UnitFactory(factory.django.DjangoModelFactory):
    """Create units for test purposes."""

    class Meta:
        model = models.Unit

    name = factory.Faker("company")


class UnitMembershipFactory(factory.django.DjangoModelFactory):
    """Create unit memberships for test purposes."""

    class Meta:
        model = models.UnitMembership

    role = factory.Faker("word", ext_word_list=models.UnitMembershipRole.values)
    user = factory.SubFactory(UserFactory)
    unit = factory.SubFactory(UnitFactory)


class UnitMemberFactory(UserFactory):
    """Create unit members for test purposes."""

    class Meta:
        model = get_user_model()

    membership = factory.RelatedFactory(UnitMembershipFactory, "user")


class TopicFactory(factory.django.DjangoModelFactory):
    """Create topics for test purposes."""

    class Meta:
        model = models.Topic

    # pylint: disable=no-member
    name = factory.Faker("text", max_nb_chars=models.Topic.name.field.max_length)
    unit = factory.SubFactory(UnitFactory)


class ReferralUrgencyFactory(factory.django.DjangoModelFactory):
    """Create referral urgencies for test purposes."""

    class Meta:
        model = models.ReferralUrgency

    # pylint: disable=no-member
    name = factory.Faker(
        "text", max_nb_chars=models.ReferralUrgency.name.field.max_length
    )
    requires_justification = factory.Faker("boolean")

    @factory.lazy_attribute
    def duration(self):
        """
        Generate a random duration for the urgency level.
        """
        return timedelta(days=randrange(2, 30))

    @factory.post_generation
    def post(self, created, extracted, **kwargs):
        """
        Generate a unique index based on existing indices in the DB.
        """
        highest_index = (
            models.ReferralUrgency.objects.exclude(index=None)
            .order_by("index")
            .last()
            .index
        )

        # pylint: disable=attribute-defined-outside-init
        self.index = highest_index + 1
        self.save()


class ReferralFactory(factory.django.DjangoModelFactory):
    """Create referrals for test purposes."""

    class Meta:
        model = models.Referral

    object = factory.Faker("text", max_nb_chars=60)
    context = factory.Faker("text", max_nb_chars=500)
    prior_work = factory.Faker("text", max_nb_chars=500)
    question = factory.Faker("text", max_nb_chars=500)
    requester_unit_contact = factory.Faker("text", max_nb_chars=60)
    requester_unit_type = factory.Faker("text", max_nb_chars=60)
    topic = factory.SubFactory(TopicFactory)
    urgency_level = factory.SubFactory(ReferralUrgencyFactory)
    sent_at = None

    @factory.lazy_attribute
    def urgency_explanation(self):
        """
        Only generate an explanation if the urgency level requires it.
        """
        return (
            factory.Faker("text", max_nb_chars=500).generate()
            if self.urgency_level.requires_justification
            else ""
        )

    @factory.post_generation
    def post(self, create, extracted, **kwargs):
        """
        Fill the ManyToMany relationships which are, in practice, always set for actual referrals:
        - add passed in users, or, by default, one new user to referral.users;
        - add the topic's linked unit to the units linked to the referral.
        """
        if kwargs.get("users"):
            for user in kwargs.get("users"):
                ReferralUserLinkFactory(
                    referral=self,
                    user=user,
                    role=models.ReferralUserLinkRoles.REQUESTER,
                )
        else:
            ReferralUserLinkFactory(
                referral=self, role=models.ReferralUserLinkRoles.REQUESTER
            )
        self.sent_at = self.created_at
        if self.topic:
            self.units.add(self.topic.unit)
        self.save()


class ReferralUserLinkFactory(factory.django.DjangoModelFactory):
    """Create referral user links for test purposes."""

    class Meta:
        model = models.ReferralUserLink

    referral = factory.SubFactory(ReferralFactory)
    user = factory.SubFactory(UserFactory)
    role = factory.Faker("word", ext_word_list=models.ReferralUserLinkRoles.values)


class ReferralActivityFactory(factory.django.DjangoModelFactory):
    """Create referral activities for test purposes."""

    class Meta:
        model = models.ReferralActivity

    actor = factory.SubFactory(UserFactory)
    referral = factory.SubFactory(ReferralFactory)
    verb = factory.Faker("word", ext_word_list=models.ReferralActivityVerb.values)

    @factory.post_generation
    def post(activity, create, extracted, **kwargs):
        """
        Generate a content object matching the verb on the referral activity, if
        the activity warrants it. Same for the activity message.
        """
        if activity.verb in [
            models.ReferralActivityVerb.ADDED_REQUESTER,
            models.ReferralActivityVerb.ASSIGNED,
            models.ReferralActivityVerb.REMOVED_REQUESTER,
            models.ReferralActivityVerb.UNASSIGNED,
        ]:
            # pylint: disable=attribute-defined-outside-init
            activity.item_content_object = UserFactory()
        elif activity.verb in [
            models.ReferralActivityVerb.DRAFT_ANSWERED,
            models.ReferralActivityVerb.ANSWERED,
        ]:
            # pylint: disable=attribute-defined-outside-init
            activity.item_content_object = ReferralAnswerFactory(
                referral=activity.referral
            )
        elif activity.verb in [
            models.ReferralActivityVerb.ASSIGNED_UNIT,
            models.ReferralActivityVerb.UNASSIGNED_UNIT,
        ]:
            # pylint: disable=attribute-defined-outside-init
            activity.item_content_object = UnitFactory()
        elif activity.verb in [
            models.ReferralActivityVerb.VALIDATED,
            models.ReferralActivityVerb.VALIDATION_DENIED,
        ]:
            # pylint: disable=attribute-defined-outside-init
            activity.item_content_object = ReferralAnswerValidationResponseFactory()
        elif activity.verb == models.ReferralActivityVerb.VALIDATION_REQUESTED:
            # pylint: disable=attribute-defined-outside-init
            activity.item_content_object = ReferralAnswerValidationRequestFactory()
        elif activity.verb == models.ReferralActivityVerb.URGENCYLEVEL_CHANGED:
            # pylint: disable=attribute-defined-outside-init
            activity.item_content_object = ReferralUrgencyLevelHistoryFactory()
        elif activity.verb in [
            models.ReferralActivityVerb.CLOSED,
            models.ReferralActivityVerb.CREATED,
        ]:
            pass
        else:
            raise Exception(f"Incorrect activity verb {activity.verb}")

        if activity.verb in [
            models.ReferralActivityVerb.ASSIGNED_UNIT,
            models.ReferralActivityVerb.CLOSED,
        ]:
            # pylint: disable=attribute-defined-outside-init
            activity.message = factory.Faker("text", max_nb_chars=500).generate()


class ReferralAnswerFactory(factory.django.DjangoModelFactory):
    """Create referral answers for test purposes."""

    class Meta:
        model = models.ReferralAnswer

    content = factory.Faker("text", max_nb_chars=500)
    created_by = factory.SubFactory(UserFactory)
    referral = factory.SubFactory(ReferralFactory)
    state = factory.Faker("word", ext_word_list=models.ReferralAnswerState.values)


class ReferralReportFactory(factory.django.DjangoModelFactory):
    """Create referral report for test purposes."""

    class Meta:
        model = models.ReferralReport


class ReferralAnswerAttachmentFactory(factory.django.DjangoModelFactory):
    """Create referral answer attachments for test purposes."""

    class Meta:
        model = models.ReferralAnswerAttachment

    name = factory.Faker("text", max_nb_chars=200)

    @factory.lazy_attribute
    def file(self):
        """
        Create a bogus file field on the answer.
        """
        file = BytesIO(b"the_file")
        file.name = "the file name"
        return File(file)

    @factory.post_generation
    def post(self, create, extracted, **kwargs):
        """
        Make sure the size on the answer field matches the actual size of the file.
        """
        # pylint: disable=attribute-defined-outside-init
        self.size = self.file.size


class ReportEventFactory(factory.django.DjangoModelFactory):
    """Create report messages for test purposes."""

    class Meta:
        model = models.ReportEvent

    content = factory.Faker("text", max_nb_chars=500)
    report = factory.SubFactory(ReferralReportFactory)
    user = factory.SubFactory(UserFactory)


class NotificationFactory(factory.django.DjangoModelFactory):
    """Create notification for test purposes."""

    class Meta:
        model = models.Notification

    notifier = factory.SubFactory(UserFactory)
    notified = factory.SubFactory(UserFactory)
    preview = factory.Faker("text", max_nb_chars=500)


class ReferralMessageFactory(factory.django.DjangoModelFactory):
    """Create referral messages for test purposes."""

    class Meta:
        model = models.ReferralMessage

    content = factory.Faker("text", max_nb_chars=500)
    referral = factory.SubFactory(ReferralFactory)
    user = factory.SubFactory(UserFactory)


class ReferralMessageAttachmentFactory(factory.django.DjangoModelFactory):
    """Create referral message attachments for test purposes."""

    class Meta:
        model = models.ReferralMessageAttachment

    name = factory.Faker("file_name")

    @factory.lazy_attribute
    def file(self):
        """
        Create a bogus file field on the message.
        """
        file = BytesIO(b"the_file")
        file.name = self.name
        return File(file)

    @factory.post_generation
    def post(self, create, extracted, **kwargs):
        """
        Make sure the size on the message field matches the actual size of the file.
        """
        # pylint: disable=attribute-defined-outside-init
        self.size = self.file.size


class ReferralAnswerValidationRequestFactory(factory.django.DjangoModelFactory):
    """Create referral answer validation requests for test purposes."""

    class Meta:
        model = models.ReferralAnswerValidationRequest

    answer = factory.SubFactory(ReferralAnswerFactory)
    validator = factory.SubFactory(UserFactory)


class ReferralAnswerValidationResponseFactory(factory.django.DjangoModelFactory):
    """Create referral answer validation responses for test purposes."""

    class Meta:
        model = models.ReferralAnswerValidationResponse

    comment = factory.Faker("text", max_nb_chars=500)
    state = factory.Faker(
        "word", ext_word_list=models.ReferralAnswerValidationResponseState.values
    )
    validation_request = factory.SubFactory(ReferralAnswerValidationRequestFactory)


class ReferralAssignmentFactory(factory.django.DjangoModelFactory):
    """Create referral assignments for test purposes."""

    class Meta:
        model = models.ReferralAssignment

    referral = factory.SubFactory(ReferralFactory)
    unit = factory.SubFactory(UnitFactory)

    @factory.lazy_attribute
    def assignee(self):
        """
        Generate a membership to the unit with a brand new user and make this new user
        the assignee.
        """
        membership = UnitMembershipFactory(unit=self.unit)
        return membership.user

    @factory.lazy_attribute
    def created_by(self):
        """
        Generate a membership to the unit with a brand new user and have this news user
        be the the assignment creator.
        """
        membership = UnitMembershipFactory(
            unit=self.unit, role=models.UnitMembershipRole.OWNER
        )
        return membership.user


class ReferralUrgencyLevelHistoryFactory(factory.django.DjangoModelFactory):
    """Create referral urgency level history instances for test purposes."""

    class Meta:
        model = models.ReferralUrgencyLevelHistory

    referral = factory.SubFactory(ReferralFactory)
    old_referral_urgency = factory.SubFactory(ReferralUrgencyFactory)
    new_referral_urgency = factory.SubFactory(ReferralUrgencyFactory)
    explanation = factory.Faker("text", max_nb_chars=500)


class FeatureFlagFactory(factory.django.DjangoModelFactory):
    """Create feature flag for test purposes."""

    class Meta:
        model = models.FeatureFlag

    tag = "random_flag"
    limit_date = datetime.now()
