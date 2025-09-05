import datetime
from datetime import timedelta

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models
from partaj.core.api import PAGINATION
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.index_manager import partaj_bulk
from partaj.core.indexers import ReferralsIndexer
from partaj.core.models import MemberRoleAccess, ReferralState

ES_CLIENT = ElasticsearchClientCompat7to6(["elasticsearch"])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


class ReferralLiteUnitMemberIncludeVisibilityDashboardApiTestCase(TestCase):
    """
    Test API routes and actions related to ReferralLite endpoints.
    """

    @staticmethod
    def setup_elasticsearch():
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="partaj_referrals")
        ES_INDICES_CLIENT.close(index="partaj_referrals")
        ES_INDICES_CLIENT.put_settings(body=ReferralsIndexer.ANALYSIS_SETTINGS, index="partaj_referrals")
        ES_INDICES_CLIENT.open(index="partaj_referrals")

        # Use the default referrals mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(
            body=ReferralsIndexer.mapping, index="partaj_referrals"
        )

        # Actually insert our referrals in the index
        partaj_bulk(actions=ReferralsIndexer.get_es_documents())
        ES_INDICES_CLIENT.refresh()

    # GENERIC LIST TESTS
    def test_list_referrals_by_anonymous_user(self):
        """
        Anonymous users cannot make list requests on the referral endpoints without passing
        any parameters.
        """
        self.setup_elasticsearch()
        response = self.client.get("/api/referrallites/dashboard/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_by_random_logged_in_user(self):
        """
        Logged-in users can make requests for referrals, but will not receive referrals they have
        no permission to see.
        """
        user = factories.UserFactory()
        factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
        )

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'pagination': PAGINATION})

    def test_list_referrals_by_admin_user(self):
        """
        Admin users can make requests for referrals, but will not receive referrals they have
        no permission to see.
        """
        user = factories.UserFactory(is_staff=True)

        topic = factories.TopicFactory()
        factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
            topic=topic,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'pagination': PAGINATION})

    def test_list_referrals_by_unit_member(self):
        """
        Unit members can get the list of referrals for their unit.
        """

        # Create a first unit with no access to RECEIVED referrals
        # add a MEMBER
        # add an OWNER
        member = factories.UserFactory()
        random_member = factories.UserFactory()
        owner = factories.UserFactory()
        topic = factories.TopicFactory(unit=factories.UnitFactory(
            member_role_access=MemberRoleAccess.TOTAL,
        ))
        topic.unit.members.add(member)
        topic.unit.members.add(random_member)

        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.OWNER,
            user=owner,
            unit=topic.unit,
        )

        # Create referral with different states
        referrals = [
            # The member has no access to this referral
            # The owner has access to this referral
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            # Member and owner roles has access to these referrals
            factories.ReferralFactory(
                state=models.ReferralState.ASSIGNED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.PROCESSING,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.CLOSED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.IN_VALIDATION,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.ANSWERED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            # Draft referral should not appear in the list for a unit member and owner
            factories.ReferralFactory(
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
                state=models.ReferralState.DRAFT,
            ),
        ]

        self.setup_elasticsearch()
        member_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        # The member is not assigned to any referral
        # He should not see anything in his dashboard
        self.assertEqual(member_response.status_code, 200)
        self.assertEqual(member_response.json()["all"]["count"], 0)

        owner_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )

        # The owner should see everything except DRAFT referrals
        self.assertEqual(owner_response.status_code, 200)
        self.assertEqual(owner_response.json()["all"]["count"], 6)

        member_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        # The member should see every referral in his unit dashboard
        # except DRAFT and RECEIVED referrals
        self.assertEqual(member_unit_response.status_code, 200)
        self.assertEqual(member_unit_response.json()["all"]["count"], 6)

        owner_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )

        # The owner should see every referral in his unit dashboard
        # except DRAFT and RECEIVED referrals
        self.assertEqual(owner_unit_response.status_code, 200)
        self.assertEqual(owner_unit_response.json()["all"]["count"], 6)

        received_referral = referrals[0]

        assign_response = self.client.post(
            f"/api/referrals/{received_referral.id}/assign/",
            {"assignee": member.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(assign_response.status_code, 200)
        ES_INDICES_CLIENT.refresh()

        member_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        # Once assigned, the member can see the referral in his dashboard
        self.assertEqual(member_response.status_code, 200)
        self.assertEqual(member_response.json()["all"]["count"], 1)

        # And everyone can see this referral in his unit dashboard
        owner_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(owner_unit_response.status_code, 200)
        self.assertEqual(owner_unit_response.json()["all"]["count"], 6)

        random_member_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=random_member)[0]}",
        )

        self.assertEqual(random_member_response.status_code, 200)
        self.assertEqual(random_member_response.json()["all"]["count"], 6)

        member_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        self.assertEqual(member_response.status_code, 200)
        self.assertEqual(member_response.json()["all"]["count"], 6)

    def test_visibility_from_received_to_splitting_in_unit_received_visible(self):
        """
        Unit members can get the list of referrals for their unit.
        """
        factories.FeatureFlagFactory(
            tag="split_referral", limit_date=datetime.date.today() - timedelta(days=2)
        )

        # Create a first unit with no member access to RECEIVED referrals
        # with a MEMBER (affected later on) an OWNER and a random other MEMBER
        member = factories.UserFactory()
        random_member = factories.UserFactory()
        owner = factories.UserFactory()
        topic = factories.TopicFactory(unit=factories.UnitFactory(
            member_role_access=MemberRoleAccess.TOTAL,
        ))
        topic.unit.members.add(member)
        topic.unit.members.add(random_member)

        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.OWNER,
            user=owner,
            unit=topic.unit,
        )

        # Create referral with different states
        referrals = [
            # The member has no access to this referral
            # The owner has access to this referral
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.PROCESSING,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        received_referral = referrals[0]

        self.setup_elasticsearch()
        # Split the received referral
        split_referral_response = self.client.post(
            f"/api/referrals/{received_referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )

        self.assertEqual(split_referral_response.status_code, 201)

        splitted_referral_id = split_referral_response.json()["secondary_referral"]
        splitted_referral = models.Referral.objects.get(id=splitted_referral_id)
        self.assertEqual(splitted_referral.state, ReferralState.RECEIVED_SPLITTING)

        ES_INDICES_CLIENT.refresh()
        # The owner should see the freshly split referral in his dashboard
        owner_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(owner_response.status_code, 200)
        self.assertEqual(owner_response.json()["all"]["count"], 3)

        # But not in his unit dashboard as the referral was in an invisible RECEIVED state
        owner_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        self.assertEqual(owner_unit_response.status_code, 200)
        self.assertEqual(owner_unit_response.json()["all"]["count"], 3)

        # Assign split referral, state didn't change and visible by the assigned member
        assign_response = self.client.post(
            f"/api/referrals/{splitted_referral_id}/assign/",
            {"assignee": member.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(assign_response.status_code, 200)
        ES_INDICES_CLIENT.refresh()

        # The assigned member can now see the referral in his dashboard
        member_dashboard_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )
        self.assertEqual(member_dashboard_response.status_code, 200)
        self.assertEqual(member_dashboard_response.json()["all"]["count"], 1)

        # At a splitting state, other members can't see the split referral if was received
        random_member_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=random_member)[0]}",
        )
        self.assertEqual(random_member_unit_response.status_code, 200)
        self.assertEqual(random_member_unit_response.json()["all"]["count"], 3)

        member_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )
        self.assertEqual(member_unit_response.status_code, 200)
        self.assertEqual(member_unit_response.json()["all"]["count"], 3)

        cancel_split_referral_response = self.client.post(
            f"/api/referrals/{splitted_referral_id}/cancel_split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(cancel_split_referral_response.status_code, 200)
        ES_INDICES_CLIENT.refresh()

        # The owner should not see anymore the split referral in his dashboard
        owner_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(owner_response.status_code, 200)
        self.assertEqual(owner_response.json()["all"]["count"], 2)

    def test_visibility_from_assigned_to_splitting_in_unit_received_visible(self):
        """
        Unit members can get the list of referrals for their unit.
        """

        factories.FeatureFlagFactory(
            tag="split_referral", limit_date=datetime.date.today() - timedelta(days=2)
        )

        # Create a first unit with no member access to RECEIVED referrals
        # with a MEMBER (affected later on) an OWNER and a random other MEMBER
        member = factories.UserFactory()
        random_member = factories.UserFactory()
        owner = factories.UserFactory()
        topic = factories.TopicFactory(unit=factories.UnitFactory(
            member_role_access=MemberRoleAccess.TOTAL,
        ))
        topic.unit.members.add(member)
        topic.unit.members.add(random_member)

        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.OWNER,
            user=owner,
            unit=topic.unit,
        )

        # Create referrals with different states
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.PROCESSING,
                topic=topic,
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        received_referral = referrals[0]

        self.setup_elasticsearch()

        # RECEIVED is ASSIGNED then split
        assign_response = self.client.post(
            f"/api/referrals/{received_referral.id}/assign/",
            {"assignee": member.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(assign_response.status_code, 200)
        ES_INDICES_CLIENT.refresh()

        split_referral_response = self.client.post(
            f"/api/referrals/{received_referral.id}/split/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )

        self.assertEqual(split_referral_response.status_code, 201)

        splitted_referral_id = split_referral_response.json()["secondary_referral"]
        splitted_referral = models.Referral.objects.get(id=splitted_referral_id)
        self.assertEqual(splitted_referral.state, ReferralState.SPLITTING)

        ES_INDICES_CLIENT.refresh()
        # The owner should see the freshly split referral in his dashboard
        owner_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=owner)[0]}",
        )
        self.assertEqual(owner_response.status_code, 200)
        self.assertEqual(owner_response.json()["all"]["count"], 3)

        # And also in his unit dashboard as it is for the ASSIGNED referral
        owner_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        self.assertEqual(owner_unit_response.status_code, 200)
        self.assertEqual(owner_unit_response.json()["all"]["count"], 3)

        # The member should not see the new referral in his dashboard as he is not
        # assigned anymore to this referral
        member_dashboard_response = self.client.get(
            "/api/referrallites/dashboard/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )
        self.assertEqual(member_dashboard_response.status_code, 200)
        self.assertEqual(member_dashboard_response.json()["all"]["count"], 1)

        # But should see it in his unit dashboard at the ASSIGNEd referral was
        member_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=member)[0]}",
        )

        self.assertEqual(member_unit_response.status_code, 200)
        self.assertEqual(member_unit_response.json()["all"]["count"], 3)

        # At a splitting state, other members can see the split referral if was
        # as it was already in their unit dashboard
        random_member_unit_response = self.client.get(
            f"/api/referrallites/unit/?unit_id={topic.unit.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=random_member)[0]}",
        )
        self.assertEqual(random_member_unit_response.status_code, 200)
        self.assertEqual(random_member_unit_response.json()["all"]["count"], 3)
