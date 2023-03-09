"""
Methods and configuration related to the indexing of Referral objects.
"""
from django.conf import settings
from django.contrib.auth import get_user_model

from .. import models
from ..serializers import NoteDocumentSerializer

User = get_user_model()


class NotesIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    index_name = f"{settings.ELASTICSEARCH['INDICES_PREFIX']}notes"
    mapping = {
        "properties": {
            "case_number": {"type": "integer"},
            "publication_date": {"type": "date"},
            "object": {
                "type": "text",
                "fields": {
                    "keyword": {"type": "keyword", "normalizer": "keyword_lowercase"},
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        "search_analyzer": "french",
                    },
                },
            },
            "topic": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "keyword": {"type": "keyword"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        # See comment above on trigram field analysis.
                        "search_analyzer": "french",
                    },
                },
            },
            "text": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        "search_analyzer": "french",
                    },
                },
            },
            "html": {
                "type": "text",
                "fields": {
                    "language": {"type": "text", "analyzer": "french"},
                    "trigram": {
                        "type": "text",
                        "analyzer": "french_trigram",
                        "search_analyzer": "french",
                    },
                },
            },
            "author": {"type": "keyword"},
            "requesters_unit_names": {"type": "keyword"},
            "assigned_units_names": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_referral(cls, note, index=None, action="index"):
        """Build an Elasticsearch document from the referral instance."""
        index = index or cls.index_name

        # Conditionally use the first user in those lists for sorting
        return {
            "_id": note.id,
            "_index": index,
            "_op_type": action,
            # _source._lite will be used to return serialized referral lites on the API
            # that are identical to what Postgres-based referral lite endpoints returned
            "_lite": "",
            "case_number": note.referral_id,
            "publication_date": note.publication_date,
            "object": note.object,
            "topic": note.topic,
            "text": note.text,
            "html": note.html,
            "author": note.author,
            "requesters_unit_names": note.requesters_unit_names,
            "assigned_units_names": note.assigned_units_names,
            "document": NoteDocumentSerializer(note.document).data,
        }

    @classmethod
    def get_es_documents(cls, index=None, action="index"):
        """
        Loop on all the referrals in database and format them for the ElasticSearch index.
        """
        index = index or cls.index_name

        for note in models.ReferralNote.objects.all():
            yield cls.get_es_document_for_referral(note, index=index, action=action)
