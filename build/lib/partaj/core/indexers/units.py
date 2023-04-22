"""
Methods and configuration related to the indexing of Unit objects.
"""
from django.conf import settings

from ..models import Unit
from .common import COMMON_ANALYSIS_SETTINGS, partaj_bulk, slice_string_for_completion


class UnitsIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch.
    """

    index_name = f"{settings.ELASTICSEARCH['INDICES_PREFIX']}units"
    ANALYSIS_SETTINGS = COMMON_ANALYSIS_SETTINGS

    mapping = {
        "properties": {
            "autocomplete": {
                "type": "completion",
                "analyzer": "simple_diacritics_insensitive",
            },
            "name": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_unit(cls, unit, index=None, action="index"):
        """Build an Elasticsearch document from the unit instance."""
        index = index or cls.index_name

        unit_lite = {
            "id": unit.id,
            "name": unit.name,
        }

        return {
            "_id": unit.id,
            "_index": index,
            "_op_type": action,
            "_lite": unit_lite,
            "autocomplete": slice_string_for_completion(
                unit.name, delimiters=[" ", "/"]
            ),
            "name": unit.name,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the units in database and format them for the ElasticSearch index.
        """
        index = index or cls.index_name

        for unit in Unit.objects.all():
            yield cls.get_es_document_for_unit(unit, index=index, action=action)

    @classmethod
    def update_unit_document(cls, unit):
        """
        Update one document in Elasticsearch, corresponding to one Unit instance.
        """

        action = cls.get_es_document_for_unit(
            unit=unit, index=cls.index_name, action="index"
        )

        # Use bulk to be able to reuse "get_es_document_for_unit" as-is.
        partaj_bulk([action])
