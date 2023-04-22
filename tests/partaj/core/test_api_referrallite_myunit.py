from datetime import timedelta

from django.test import TestCase
from rest_framework.authtoken.models import Token

from partaj.core import factories, models
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.indexers import ReferralsIndexer
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
        response = self.client.get("/api/referrallites/my_unit/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_by_random_logged_in_user(self):
        """
        Logged-in users can make requests for referrals, but will not receive referrals they have
        no permission to see.
        Here assigned unit is the same as the user unit_name but the user is allowed to see referral
        where requesters and observers unit_name is the same as or prefixed by his.
        """
        # By default its unit name is "company"
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

    def test_list_referrals_for_user_in_same_unit_as_requester(self):
        """
        - The user should see this referral because a requester belongs to his unit
        - The chief should see this referral because a requester belongs to his units
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        requester = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")

        first_referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )

        factories.ReferralUserLinkFactory(
            referral=first_referral,
            user=requester,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )

        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_unit",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_unit",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 1)
        self.assertEqual(user_response.json()["results"][0]["id"], first_referral.id)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 1)
        self.assertEqual(chief_response.json()["results"][0]["id"], first_referral.id)

    def test_taskmyunit_list_referrals_for_requester(self):
        """
        - The user should see this referral because he is a requester
        - The chief should see this referral because a requester belongs to his units
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")
        second_referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        factories.ReferralUserLinkFactory(
            referral=second_referral,
            user=user,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )
        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_unit",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_unit",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 1)
        self.assertEqual(user_response.json()["results"][0]["id"], second_referral.id)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 1)
        self.assertEqual(chief_response.json()["results"][0]["id"], second_referral.id)

    def test_taskmyreferrals_list_referrals_for_requester(self):
        """
        - The user should see this referral because he is a requester
        - The chief should see this referral because a requester belongs to his units
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")
        second_referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        factories.ReferralUserLinkFactory(
            referral=second_referral,
            user=user,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )
        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_referrals",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_referrals",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 1)
        self.assertEqual(user_response.json()["results"][0]["id"], second_referral.id)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 0)

    def test_taskmyunit_list_referrals_for_not_unit_membership_user(self):
        """
        - The user should see this referral because his unit partner is a requester
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        partner = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        second_referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )
        factories.ReferralUserLinkFactory(
            referral=second_referral,
            user=partner,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )
        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_unit",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 1)
        self.assertEqual(user_response.json()["results"][0]["id"], second_referral.id)

    def test_taskmyunit_list_referrals_for_unit_membership_user(self):
        """
        - People from DAJ (i.e. are in at least one unit) can't see referrals
          where DAJ partner are requesters
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")

        partner = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION,
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
        )

        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.MEMBER,
            user=user,
            unit=referral.units.first(),
        )

        factories.ReferralUserLinkFactory(
            referral=referral,
            user=partner,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )

        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_unit",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(user_response.status_code, 403)

    def test_taskmyunit_list_referrals_for_referral_draft(self):
        """
        - The user should see this referral because he is a requester
        - The chief should see this referral because a requester belongs to his units
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")
        # The user should not see DRAFT referrals even if it's his own creation
        # The chief should not see DRAFT referrals even if it's his own creation
        draft_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
            state=models.ReferralState.DRAFT,
        )
        factories.ReferralUserLinkFactory(
            referral=draft_referral,
            user=user,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )

        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 0)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 0)

    def test_taskmydrafts_list_referrals_for_referral_draft(self):
        """
        - The user should see this referral because he is a requester
        - The chief should see this referral because a requester belongs to his units
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        random_sameunituser = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")
        # The user should not see DRAFT referrals even if it's his own creation
        # The chief should not see DRAFT referrals even if it's his own creation
        draft_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
            state=models.ReferralState.DRAFT,
        )
        factories.ReferralUserLinkFactory(
            referral=draft_referral,
            user=user,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )

        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_drafts",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        random_sameunituser = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc&task=my_drafts",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=random_sameunituser)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 1)

        self.assertEqual(random_sameunituser.status_code, 200)
        self.assertEqual(random_sameunituser.json()["count"], 0)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 0)

    def test_list_referrals_for_chief_referral(self):
        """
        - The user should not see this referral because only his chief is requester
        - The chief should see this referral because he his requester
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")
        chief_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
            state=models.ReferralState.RECEIVED,
        )

        factories.ReferralUserLinkFactory(
            referral=chief_referral,
            user=chief,
            role=models.ReferralUserLinkRoles.REQUESTER,
        )

        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 0)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 1)
        self.assertEqual(chief_response.json()["results"][0]["id"], chief_referral.id)

    def test_list_referrals_for_observer_and_observer_unit_member(self):
        """
        A user can get the list of referrals for their unit :
        - The user should see this referral because he is observer
        - The chief should not see this referral because being in the same unit as an observer
        - is not enough to see the referral in his list
        """
        user = factories.UserFactory(unit_name="DAJ/PNM0/PNM3")
        chief = factories.UserFactory(unit_name="DAJ/PNM0")
        third_referral = factories.ReferralFactory(
            urgency_level=models.ReferralUrgency.objects.get(
                duration=timedelta(days=1)
            ),
            state=models.ReferralState.RECEIVED,
        )

        factories.ReferralUserLinkFactory(
            referral=third_referral,
            user=user,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )

        self.setup_elasticsearch()
        user_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        chief_response = self.client.get(
            "/api/referrallites/my_unit/?limit=999&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=chief)[0]}",
        )

        self.assertEqual(user_response.status_code, 200)
        self.assertEqual(user_response.json()["count"], 1)
        self.assertEqual(user_response.json()["results"][0]["id"], third_referral.id)

        self.assertEqual(chief_response.status_code, 200)
        self.assertEqual(chief_response.json()["count"], 0)
