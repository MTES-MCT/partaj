from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories
from partaj.core.models import ReferralState, UnitMembershipRole


class ReferralTopicApiTestCase(TestCase):
    """
    Test API routes and actions related to Referral Topic endpoints.
    """
    def test_list_referral_topics(self):
        """
        Logged-in users can list existing topics.
        """
        user = factories.UserFactory()

        unit_1 = factories.UnitFactory(name="unit_1")
        unit_2 = factories.UnitFactory(name="unit_2")

        # Create memberships
        factories.UnitMembershipFactory(
            role=UnitMembershipRole.MEMBER,
            unit=unit_1,
            user=user
        )

        root_topics = [
            factories.TopicFactory(
                name="Unit 1 First root topic",
                unit=unit_1,
                path="0010"
            ),
            factories.TopicFactory(
                name="Unit 1 Second root topic",
                unit=unit_1,
                path="0020"
            ),
            factories.TopicFactory(
                name="Unit 2 First root topic",
                unit=unit_2,
                path="0030"
            ),
            factories.TopicFactory(
                name="Unit 2 Second root topic",
                unit=unit_2,
                path="0040"
            ),
            factories.TopicFactory(
                name="Unit 2 Third root topic",
                unit=unit_2,
                is_active=False,
                path="0050"
            ),
        ]

        factories.TopicFactory(
            name="Unit 1 Child First topic",
            unit=unit_1,
            parent=root_topics[0],
            path="0011"
        )

        referral = factories.ReferralFactory(
            state=ReferralState.RECEIVED,
            topic=root_topics[3]
        )

        referral.units.set([unit_1, unit_2])

        response = self.client.get(
            f"/api/referrals/{referral.id}/topics/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # If a topic is not active and not current referral topic, it should not appear in the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)

        # Response is ordered by path
        self.assertEqual(response.json()[0]["name"], "Unit 1 First root topic")
        self.assertEqual(response.json()[1]["name"], "Unit 1 Child First topic")

    def test_list_referral_topics_with_current_topic_deactivated(self):
        """
        Logged-in users can list existing topics.
        """
        user = factories.UserFactory()

        unit_1 = factories.UnitFactory(name="unit_1")
        unit_2 = factories.UnitFactory(name="unit_2")

        # Create memberships
        factories.UnitMembershipFactory(
            role=UnitMembershipRole.MEMBER,
            unit=unit_1,
            user=user
        )

        root_topics = [
            factories.TopicFactory(
                name="Unit 1 First root topic",
                unit=unit_1,
                path="0010"
            ),
            factories.TopicFactory(
                name="Unit 1 Second root topic",
                unit=unit_1,
                path="0020"
            ),
            factories.TopicFactory(
                name="Unit 2 First root topic",
                unit=unit_2,
                path="0030",
            ),
            factories.TopicFactory(
                name="Unit 2 Second root topic",
                unit=unit_2,
                path="0040",
                is_active=False
            ),
            factories.TopicFactory(
                name="Unit 2 Third root topic",
                unit=unit_2,
                is_active=False,
                path="0050"
            ),
        ]

        factories.TopicFactory(
            name="Unit 1 Child First topic",
            unit=unit_1,
            parent=root_topics[0],
            path="0011"
        )

        referral = factories.ReferralFactory(
            state=ReferralState.RECEIVED,
            topic=root_topics[3]
        )

        referral.units.set([unit_1, unit_2])
        referral.topic = root_topics[3]

        response = self.client.get(
            f"/api/referrals/{referral.id}/topics/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        # If a topic is not active and not current referral topic, it should not appear in the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)

        # Response is ordered by path
        self.assertEqual(response.json()[0]["name"], "Unit 1 First root topic")
        self.assertEqual(response.json()[1]["name"], "Unit 1 Child First topic")
