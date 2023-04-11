"""
Methods and configuration related to the indexing of User objects.
"""
from django.conf import settings
from django.contrib.auth import get_user_model

from .common import COMMON_ANALYSIS_SETTINGS, partaj_bulk, slice_string_for_completion

User = get_user_model()


class UsersIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch.
    """

    index_name = f"{settings.ELASTICSEARCH['INDICES_PREFIX']}users"
    ANALYSIS_SETTINGS = COMMON_ANALYSIS_SETTINGS

    mapping = {
        "properties": {
            "autocomplete": {
                "type": "completion",
                "analyzer": "simple_diacritics_insensitive",
            },
            "full_name": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_user(cls, user, index=None, action="index"):
        """Build an Elasticsearch document from the user instance."""
        index = index or cls.index_name

        user_lite = {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "unit_name": user.unit_name,
        }

        return {
            "_id": user.id,
            "_index": index,
            "_op_type": action,
            "_lite": user_lite,
            "autocomplete": slice_string_for_completion(user.get_full_name(), [" "]),
            "full_name": user.get_full_name(),
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the users in database and format them for the ElasticSearch index.
        """
        index = index or cls.index_name

        for user in User.objects.all():
            yield cls.get_es_document_for_user(user, index=index, action=action)

    @classmethod
    def update_user_document(cls, user):
        """
        Update one document in Elasticsearch, corresponding to one User instance.
        """

        action = cls.get_es_document_for_user(
            user=user, index=cls.index_name, action="index"
        )

        # Use bulk to be able to reuse "get_es_document_for_user" as-is.
        partaj_bulk([action])
