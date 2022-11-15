from datetime import timedelta

from django.test import TestCase
from rest_framework.authtoken.models import Token

from partaj.core import factories, models
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.indexers import ANALYSIS_SETTINGS, ReferralsIndexer
from partaj.core.index_manager import partaj_bulk


ES_CLIENT = ElasticsearchClientCompat7to6(["elasticsearch"])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


class ReferralLiteMyUnitApiTestCase(TestCase):
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
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="partaj_referrals")
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
        response = self.client.get("/api/referrallites/my_unit/")
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
            "/api/referrallites/my_unit/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_referrals_by_admin_user(self):
        """
        Admin users can make requests for referrals, but will not receive referrals they have
        no permission to see.
        """
        user = factories.UserFactory(is_staff=True)
        factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
        )

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/referrallites/my_unit/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    # LIST BY UNIT
    def test_list_referrals_for_unit_by_anonymous_user(self):
        """
        Anonymous users cannot request lists of referrals for a unit.
        """
        self.setup_elasticsearch()
        response = self.client.get("/api/referrallites/my_unit/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_for_unit_by_random_logged_in_user(self):
        """
        Random logged-in users can request lists of referral for a unit they are
        not a part of, but they will get an empty response as they are not allowed to
        see them.
        """
        user = factories.UserFactory()
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
            "/api/referrallites/my_unit/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])

    def test_list_referrals_for_unit_by_user_from_same_unit_as_requester(self):
        """
        Unit members can get the list of referrals for their unit.
        """
        user = factories.UserFactory(
            unit_name="DAJ/PNM0/PNM3"
        )
        requester = factories.UserFactory(
            unit_name="DAJ/PNM0/PNM3"
        )

        first_referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        first_referral.users.set([requester])

        second_referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        second_referral.users.set([requester])

        # Draft referral should not appear in the list for a unit member
        draft_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
            state=models.ReferralState.DRAFT,
        )
        draft_referral.users.set([requester])

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][1]["id"], first_referral.id)
        self.assertEqual(response.json()["results"][0]["id"], second_referral.id)

    def test_list_referrals_for_unit_requester_chief(self):
        """
        Unit members can get the list of referrals for their unit.
        """
        chief = factories.UserFactory(
            unit_name="DAJ/PNM0"
        )
        requester_first_unit = factories.UserFactory(
            unit_name="DAJ/PNM0/PNM2"
        )

        requester_second_unit = factories.UserFactory(
            unit_name="DAJ/PNM0/PNM3"
        )

        first_referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        first_referral.users.set([requester_first_unit])

        second_referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        second_referral.users.set([requester_second_unit])

        # Draft referral should not appear in the list for a unit member
        draft_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
            state=models.ReferralState.DRAFT,
        )
        draft_referral.users.set([requester_first_unit])

        self.setup_elasticsearch()
        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 2)
        self.assertEqual(chief_response.json()["results"][1]["id"], first_referral.id)
        self.assertEqual(chief_response.json()["results"][0]["id"], second_referral.id)

        requester_first_unit_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=requester_first_unit)[0]}",
        )
        self.assertEqual(requester_first_unit_response.status_code, 200)
        self.assertEqual(requester_first_unit_response.json()["count"], 1)
        self.assertEqual(requester_first_unit_response.json()["results"][0]["id"],
                         first_referral.id)
        requester_second_unit_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=requester_second_unit)[0]}",
        )
        self.assertEqual(requester_second_unit_response.status_code, 200)
        self.assertEqual(requester_second_unit_response.json()["count"], 1)
        self.assertEqual(requester_second_unit_response.json()["results"][0]["id"], second_referral.id)
