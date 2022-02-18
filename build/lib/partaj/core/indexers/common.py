"""
Helpers and config for indexing, common to all indexing tasks.
"""
from django.conf import settings

from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient
from elasticsearch.helpers import bulk

# Settings inspired from
# https://www.elastic.co/guide/en/elasticsearch/reference/master/analysis-lang-analyzer.html
ANALYSIS_SETTINGS = {
    "analysis": {
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
            },
            "simple_diacritics_insensitive": {
                "tokenizer": "lowercase",
                "filter": ["asciifolding"],
            },
        },
        "tokenizer": {
            "trigram": {
                "type": "ngram",
                "min_gram": 3,
                "max_gram": 20,
                "token_chars": ["letter", "digit"],
            }
        },
    },
    "max_ngram_diff": "20",
}

ES_CLIENT = Elasticsearch([settings.ELASTICSEARCH["HOST"]])
ES_INDICES_CLIENT = IndicesClient(ES_CLIENT)


def partaj_bulk(actions):
    """Wrap bulk helper to set default parameters."""
    return bulk(
        actions=actions,
        chunk_size=settings.ELASTICSEARCH["CHUNK_SIZE"],
        client=ES_CLIENT,
        stats_only=True,
    )
