# pylint: disable=too-many-arguments
"""
Methods and configuration related to the indexing of Referral objects.
"""
import datetime

from django.conf import settings
from django.contrib.auth import get_user_model

from partaj.core.indexers import partaj_bulk

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
            "author": {"type": "keyword"},
            "requesters_unit_names": {"type": "keyword"},
            "assigned_units_names": {"type": "keyword"},
        }
    }

    @classmethod
    def get_es_document_for_note(cls, note, index=None, action="index"):
        """Build an Elasticsearch document from the note instance."""
        index = index or cls.index_name

        # Conditionally use the first user in those lists for sorting
        return {
            "_id": note.referral_id,
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
            "author": note.author,
            "requesters_unit_names": note.requesters_unit_names,
            "assigned_units_names": note.assigned_units_names,
            "document": NoteDocumentSerializer(note.document).data,
        }

    @classmethod
    def get_es_documents(
        cls, from_date, to_date, index=None, action="index", logger=None
    ):
        """
        Loop on all the referrals in database and format them for the ElasticSearch index.
        """

        def get_spliced_date(date):
            return (
                int(date.split("-")[0]),
                int(date.split("-")[1]),
                int(date.split("-")[2]),
            )

        index = index or cls.index_name
        from_year, from_month, from_day = get_spliced_date(from_date)
        to_year, to_month, to_day = get_spliced_date(to_date)

        for note in models.ReferralNote.objects.filter(
            publication_date__range=(
                datetime.date(from_year, from_month, from_day),
                datetime.date(to_year, to_month, to_day),
            )
        ).all():
            yield cls.get_es_document_for_note(note, index=index, action=action)

    @classmethod
    def upsert_notes_documents(cls, from_date, to_date, logger=None):
        """
        Upsert notes to elastic search index
        """
        if logger:
            logger.info("Sending notes to ES from %s to %s", from_date, to_date)

        # Use bulk to be able to reuse "get_es_document_for_referral" as-is.
        partaj_bulk(
            cls.get_es_documents(
                from_date=from_date,
                to_date=to_date,
                index=cls.index_name,
                action="index",
                logger=logger,
            )
        )
