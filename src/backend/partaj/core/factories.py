from django.contrib.auth import get_user_model

import factory

from .models import Referral, ReferralAssignment, Topic, Unit, UnitMembership, UnitMembershipRole


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.Faker("phone_number")
    title = factory.Faker("prefix")
    unit_name = factory.Faker("company")
    username = factory.Faker("email")


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Unit

    name = factory.Faker("company")


class UnitMembershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UnitMembership

    role = factory.Faker("word", ext_word_list=UnitMembershipRole.values)
    user = factory.SubFactory(UserFactory)
    unit = factory.SubFactory(UnitFactory)


class UnitMemberFactory(UserFactory):
    class Meta:
        model = get_user_model()

    membership = factory.RelatedFactory(UnitMembershipFactory, "user")


class TopicFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Topic

    name = factory.Faker("text", max_nb_chars=Topic.name.field.max_length)
    unit = factory.SubFactory(UnitFactory)


class ReferralFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Referral

    context = factory.Faker("text", max_nb_chars=500)
    prior_work = factory.Faker("text", max_nb_chars=500)
    question = factory.Faker("text", max_nb_chars=500)
    requester = factory.Faker("name")
    topic = factory.SubFactory(TopicFactory)
    user = factory.SubFactory(UserFactory)


class ReferralAssignmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ReferralAssignment

    referral = factory.SubFactory(ReferralFactory)
    created_by = factory.SubFactory(UserFactory)
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
        membership = UnitMembershipFactory(unit=self.unit, role=UnitMembershipRole.OWNER)
        return membership.user
