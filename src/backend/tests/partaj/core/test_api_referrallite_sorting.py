from datetime import timedelta

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.index_manager import partaj_bulk
from partaj.core.indexers import ReferralsIndexer

ES_CLIENT = ElasticsearchClientCompat7to6(["elasticsearch"])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


class ReferralLiteApiTestCase(TestCase):
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

    def test_list_referrals_no_sorting_specified(self):
        """
        When not sorting is specified, default to descending due date.
        """
        user = factories.UserFactory()

        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )

        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            )
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_asc_due_date(self):
        """
        Referrals can be sorted by ascending due date.
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=due_date&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_by_desc_due_date(self):
        """
        Referrals can be sorted by descending due date (which is the same as the
        default sorting).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=due_date&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_asc_case_number(self):
        """
        Referrals can be sorted by ascending case number.
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        # NB: set up a situation where case number and due date would yield different orders
        referrals = [
            factories.ReferralFactory(
                id=4,
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=7)
                ),
            ),
            factories.ReferralFactory(
                id=1989,
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=case_number&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_by_desc_case_number(self):
        """
        Referrals can be sorted by descending case number.
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        # NB: set up a situation where case number and due date would yield different orders
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=7)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=case_number&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_asc_object(self):
        """
        Referrals can be sorted by ascending object (alphabetically).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                object="A - first by alphabetical order",
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                object="b - second by alphabetical order",
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                object="é - third by alphabetical order",
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                object="G - fourth by alphabetical order",
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=object.keyword&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 4)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][2]["id"], referrals[2].id)
        self.assertEqual(response.json()["results"][3]["id"], referrals[3].id)

    def test_list_referrals_by_desc_object(self):
        """
        Referrals can be sorted by descending object (alphabetically).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                object="First by alphabetical order",
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                object="Second by alphabetical order",
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=object.keyword&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_asc_units_requesters(self):
        """
        Referrals can be sorted by ascending requesters (alphabetically).
        """
        user = factories.UserFactory(unit_name="z_unite")
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[factories.UserFactory(unit_name="c_unite"), user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[factories.UserFactory(unit_name="b_unite"), user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=users_unit_name_sorting&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_desc_units_requesters(self):
        """
        Referrals can be sorted by ascending requesters (alphabetically).
        """
        user = factories.UserFactory(unit_name="a_unite")
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[factories.UserFactory(unit_name="c_unite"), user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[factories.UserFactory(unit_name="b_unite"), user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=users_unit_name_sorting&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_by_asc_assignees(self):
        """
        Referrals can be sorted by ascending assignees (alphabetically).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        factories.ReferralAssignmentFactory(
            referral=referrals[0], assignee=factories.UserFactory(first_name="Charles")
        )
        factories.ReferralAssignmentFactory(
            referral=referrals[1], assignee=factories.UserFactory(first_name="Alain")
        )

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=assignees_sorting&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_desc_assignees(self):
        """
        Referrals can be sorted by descending assignees (alphabetically).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        factories.ReferralAssignmentFactory(
            referral=referrals[0], assignee=factories.UserFactory(first_name="Charles")
        )
        factories.ReferralAssignmentFactory(
            referral=referrals[1], assignee=factories.UserFactory(first_name="Alain")
        )

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=assignees_sorting&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)

    def test_list_referrals_by_asc_state(self):
        """
        Referrals can be sorted by ascending state (by logical state order).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.ANSWERED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=state_number&sort_dir=asc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[1].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[0].id)

    def test_list_referrals_by_desc_state(self):
        """
        Referrals can be sorted by descending state (by logical state order).
        """
        user = factories.UserFactory()
        unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit, user=user, role=models.UnitMembershipRole.MEMBER
        )
        referrals = [
            factories.ReferralFactory(
                state=models.ReferralState.RECEIVED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
            factories.ReferralFactory(
                state=models.ReferralState.ANSWERED,
                post__users=[user],
                urgency_level=models.ReferralUrgency.objects.get(
                    duration=timedelta(days=1)
                ),
            ),
        ]

        for referral in referrals:
            referral.units.set([unit])

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/referrallites/?user={user.id}&sort=state_number&sort_dir=desc",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["id"], referrals[0].id)
        self.assertEqual(response.json()["results"][1]["id"], referrals[1].id)
