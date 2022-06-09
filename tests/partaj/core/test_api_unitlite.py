from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories
from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
)
from partaj.core.indexers import ANALYSIS_SETTINGS, UnitsIndexer
from partaj.core.index_manager import partaj_bulk

ES_CLIENT = ElasticsearchClientCompat7to6(["elasticsearch"])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


class UnitApiTestCase(TestCase):
    """
    Test API routes and actions related to Unit endpoints.
    """

    @staticmethod
    def setup_elasticsearch():
        """
        Set up ES indices and their settings with existing instances.
        """
        # Delete any existing indices so we get a clean slate
        ES_INDICES_CLIENT.delete(index="_all")
        # Create an index we'll use to test the ES features
        ES_INDICES_CLIENT.create(index="partaj_units")
        ES_INDICES_CLIENT.close(index="partaj_units")
        ES_INDICES_CLIENT.put_settings(body=ANALYSIS_SETTINGS, index="partaj_units")
        ES_INDICES_CLIENT.open(index="partaj_units")

        # Use the default units mapping from the Indexer
        ES_INDICES_CLIENT.put_mapping(body=UnitsIndexer.mapping, index="partaj_units")

        # Actually insert our units in the index
        partaj_bulk(actions=UnitsIndexer.get_es_documents())
        ES_INDICES_CLIENT.refresh()

    # LIST TESTS
    def test_list_unitlites_from_anonymous_user(self):
        """
        Anonymous users cannot list existing units through the unit lite list endpoint.
        """
        factories.UnitFactory(name="SG/DAJ/AJYX")
        factories.UnitFactory(name="AJYX4")
        factories.UnitFactory(name="SG/SNUM")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/unitlites/?limit=999",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_unitlites_from_logged_in_user(self):
        """
        Logged-in users can list existing units through the unit lite list endpoint.
        """
        user = factories.UserFactory()

        factories.UnitFactory(name="SG/DAJ/AJYX")
        factories.UnitFactory(name="AJYX4")
        factories.UnitFactory(name="SG/SNUM")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/unitlites/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(response.json()["results"][0]["name"], "AJYX4")
        self.assertEqual(response.json()["results"][1]["name"], "SG/DAJ/AJYX")
        self.assertEqual(response.json()["results"][2]["name"], "SG/SNUM")

    def test_list_unitlites_by_id_from_logged_in_user(self):
        """
        Logged-in users can filter units by id through the unit lite list endpoint.
        """
        user = factories.UserFactory()

        unit_1 = factories.UnitFactory(name="SG/DAJ/AJYX")
        unit_2 = factories.UnitFactory(name="AJYX4")
        factories.UnitFactory(name="SG/SNUM")

        self.setup_elasticsearch()
        response = self.client.get(
            f"/api/unitlites/?limit=999&id={str(unit_1.id)}&id={str(unit_2.id)}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["name"], "AJYX4")
        self.assertEqual(response.json()["results"][1]["name"], "SG/DAJ/AJYX")

    # AUTOCOMPLETE TESTS
    def test_autocomplete_units_from_anonymous_user(self):
        """
        Anonymous users cannot make autocompletion search requests for units.
        """
        factories.UnitFactory(name="SG/DAJ/AJYX")
        factories.UnitFactory(name="AJYX4")
        factories.UnitFactory(name="SG/SNUM")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/unitlites/autocomplete/?limit=999&query=AJYX",
        )
        self.assertEqual(response.status_code, 401)

    def test_autocomplete_units_from_logged_in_user(self):
        """
        Logged-in users can make autocompletion search requests for units.
        """
        user = factories.UserFactory()

        factories.UnitFactory(name="SG/DAJ/AJYX")
        factories.UnitFactory(name="AJYX4")
        factories.UnitFactory(name="SG/SNUM")

        self.setup_elasticsearch()
        response = self.client.get(
            "/api/unitlites/autocomplete/?limit=999&query=AJYX",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(response.json()["results"][0]["name"], "SG/DAJ/AJYX")
        self.assertEqual(response.json()["results"][1]["name"], "AJYX4")
