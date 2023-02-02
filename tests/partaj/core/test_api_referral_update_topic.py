from django.test import TestCase


from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralApiUpdateTopicCase(TestCase):
    """
    Test API routes and actions related to the Referral update topic endpoint.
    """

    def test_update_topic_by_anonymous_user(self):
        """
        Anonymous users cannot change a referral's topic.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        new_topic = factories.TopicFactory()
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
        )
        self.assertEqual(response.status_code, 401)
        # Make sure the topic is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_topic.id, referral.topic.id)

    def test_update_topic_by_random_logged_in_user(self):
        """
        Random logged-in users cannot change a referral's topic.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        new_topic = factories.TopicFactory()
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the topic is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_topic.id, referral.topic.id)

    def test_change_urgencylevel_by_referral_linked_user(self):
        """
        A referral's linked user cannot change the referral's topic.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )
        new_topic = factories.TopicFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        # Make sure the topic is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertNotEqual(new_topic.id, referral.topic.id)

    def test_update_topic_by_unit_member(self):
        """
        A regular unit member can change a referral's topic.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the topicl is changed
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(new_topic.id, referral.topic.id)

    def test_change_urgencylevel_by_unit_admin(self):
        """
        A unit admin can change a referral's topic.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.ADMIN, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()

        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the  topic  is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(new_topic.id, referral.topic.id)

    def test_change_urgencylevel_by_unit_owner(self):
        """
        Unit owners can change a referral's topic.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()

        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the topic  is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(new_topic.id, referral.topic.id)

    def test_update_topic_missing_topic_id(self):
        """
        The request errors out when the topic ID parameter is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(""),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        # Make sure the topci is unchanged
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    def test_udpate_topic_from_processing_state(self):
        """
        The topic can be changed on a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the topic is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(new_topic.id, referral.topic.id)

    def test_update_topic_from_in_validation_state(
        self,
    ):
        """
        The topic can be changed on a referral in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        # Make sure the topic is changed

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(new_topic.id, referral.topic.id)

    def test_udpate_topic_from_answered_state(self):
        """
        The topic can be changed on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()
        old_topic = referral.topic
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot change topic from state answered."]},
        )
        # Make sure the topic is unchanged

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(referral.topic.id, old_topic.id)

    def test_update_topic_from_closed_state(self):
        """
        The topic cannot  be changed on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        new_topic = factories.TopicFactory()
        old_topic = referral.topic
        self.assertNotEqual(new_topic.id, referral.topic.id)

        response = self.client.post(
            f"/api/referrals/{referral.id}/update_topic/",
            {
                "topic": str(new_topic.id),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Cannot change topic from state closed."]},
        )
        # Make sure the topic is unchanged

        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(referral.topic.id, old_topic.id)
