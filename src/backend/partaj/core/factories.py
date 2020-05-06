from django.contrib.auth import get_user_model

import factory

from .models import Referral, Topic, Unit


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.Faker("phone_number")
    title = factory.Faker("prefix")
    unite = factory.Faker("company")
    username = factory.Faker("email")


class UnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Unit

    name = factory.Faker("company")


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
