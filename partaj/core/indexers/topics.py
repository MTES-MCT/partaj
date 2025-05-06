"""
Methods and configuration related to the indexing of Topic objects.
"""
from django.conf import settings

from ..models import Topic
from .common import COMMON_ANALYSIS_SETTINGS, partaj_bulk, slice_string_for_completion


class TopicsIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch.
    """

    index_name = f"{settings.ELASTICSEARCH['INDICES_PREFIX']}topics"
    ANALYSIS_SETTINGS = COMMON_ANALYSIS_SETTINGS

    mapping = {
        "properties": {
            "autocomplete": {
                "type": "completion",
                "analyzer": "simple_diacritics_insensitive",
            },
            "path": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_topic(cls, topic, index=None, action="index"):
        """Build an Elasticsearch document from the topic instance."""
        index = index or cls.index_name

        topic_lite = {
            "created_at": topic.created_at,
            "id": topic.id,
            "name": topic.name,
            "path": topic.path,
            "unit_name": topic.unit.name if topic.unit else None,
        }

        return {
            "_id": topic.id,
            "_index": index,
            "_op_type": action,
            "_lite": topic_lite,
            "autocomplete": slice_string_for_completion(topic.name, [" "]),
            "path": topic.path,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the topics in database and format them for the ElasticSearch index.
        """
        index = index or cls.index_name

        for topic in Topic.objects.filter(is_active=True).select_related("unit"):
            yield cls.get_es_document_for_topic(topic, index=index, action=action)

    @classmethod
    def update_topic_document(cls, topic):
        """
        Update one document in Elasticsearch, corresponding to one Topic instance.
        """

        action = cls.get_es_document_for_topic(
            topic=topic, index=cls.index_name, action="index"
        )

        # Use bulk to be able to reuse "get_es_document_for_topic" as-is.
        partaj_bulk([action])
