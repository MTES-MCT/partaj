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

NOTES_ANALYSIS_SETTINGS = {
    "analysis": {
        "char_filter": {
            "special_chars_mapping": {
                "type": "mapping",
                "mappings": ["- => _", "/ => _"],
            }
        },
        "filter": {
            "french_elision": {
                "type": "elision",
                "articles_case": True,
                "articles": [
                    "l",
                    "m",
                    "t",
                    "qu",
                    "n",
                    "s",
                    "j",
                    "d",
                    "c",
                    "jusqu",
                    "quoiqu",
                    "lorsqu",
                    "puisqu",
                ],
            },
            "french_stop": {"type": "stop", "stopwords": "_french_"},
            "french_stemmer": {"type": "stemmer", "language": "french"},
        },
        "analyzer": {
            "french_exact": {
                "type": "custom",
                "tokenizer": "standard",
                "filter": ["lowercase"],
                "char_filter": ["special_chars_mapping"],
            },
            "french": {
                "type": "custom",
                "tokenizer": "standard",
                "filter": [
                    "french_elision",
                    "asciifolding",
                    "lowercase",
                    "french_stop",
                    "french_stemmer",
                ],
                "char_filter": ["special_chars_mapping"],
            },
            "french_trigram": {
                "type": "custom",
                "tokenizer": "trigram",
                "filter": [
                    "french_elision",
                    "asciifolding",
                    "lowercase",
                    "french_stop",
                    "french_stemmer",
                ],
                "char_filter": ["special_chars_mapping"],
            },
        },
        "normalizer": {
            "keyword_lowercase": {
                "type": "custom",
                "filter": ["lowercase", "asciifolding"],
            }
        },
        "tokenizer": {
            "trigram": {
                "type": "ngram",
                "min_gram": 3,
                "max_gram": 20,
                "token_chars": ["letter", "digit", "custom"],
                "custom_token_chars": ["_"],
            },
        },
    },
    "max_ngram_diff": "20",
}


class NotesIndexer:
    """
    Makes available the parameters the indexer requires as well as functions to shape
    objects getting into and out of ElasticSearch
    """

    index_name = f"{settings.ELASTICSEARCH['INDICES_PREFIX']}notes"
    ANALYSIS_SETTINGS = NOTES_ANALYSIS_SETTINGS
    mapping = {
        "properties": {
            "id": {
                "type": "text",
                "analyzer": "french_exact",
            },
            "referral_id": {
                "type": "text",
                "analyzer": "french",
            },
            "publication_date": {"type": "date"},
            "object": {
                "type": "text",
                "analyzer": "french",
                "term_vector": "with_positions_offsets",
                "fields": {
                    "filter_keyword": {
                        "type": "keyword",
                        "normalizer": "keyword_lowercase",
                    },
                    "exact": {
                        "type": "text",
                        "analyzer": "french_exact",
                        "term_vector": "with_positions_offsets",
                    },
                },
            },
            "topic": {
                "type": "text",
                "analyzer": "french",
                "term_vector": "with_positions_offsets",
                "fields": {
                    "filter_keyword": {
                        "type": "keyword",
                        "normalizer": "keyword_lowercase",
                    },
                    "exact": {
                        "type": "text",
                        "analyzer": "french_exact",
                        "term_vector": "with_positions_offsets",
                    },
                },
            },
            "text": {
                "type": "text",
                "term_vector": "with_positions_offsets",
                "analyzer": "french",
                "fields": {
                    "exact": {
                        "type": "text",
                        "analyzer": "french_exact",
                        "term_vector": "with_positions_offsets",
                    },
                },
            },
            "author": {
                "type": "text",
                "term_vector": "with_positions_offsets",
                "analyzer": "french",
                "fields": {
                    "filter_keyword": {
                        "type": "keyword",
                        "normalizer": "keyword_lowercase",
                    },
                    "exact": {
                        "type": "text",
                        "analyzer": "french_exact",
                        "term_vector": "with_positions_offsets",
                    },
                },
            },
            "requesters_unit_names": {
                "type": "keyword",
                "normalizer": "keyword_lowercase",
            },
            "assigned_units_names": {
                "type": "keyword",
                "normalizer": "keyword_lowercase",
            },
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
            "id": note.id,
            "referral_id": note.referral_id,
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
