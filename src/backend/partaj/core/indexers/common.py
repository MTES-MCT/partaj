"""
Helpers and config for indexing, common to all indexing tasks.
"""
from django.conf import settings

from partaj.core.elasticsearch import (
    ElasticsearchClientCompat7to6,
    ElasticsearchIndicesClientCompat7to6,
    bulk_compat,
)

# Settings inspired from
# https://www.elastic.co/guide/en/elasticsearch/reference/master/analysis-lang-analyzer.html
COMMON_ANALYSIS_SETTINGS = {
    "analysis": {
        "char_filter": {"hyphen_mapping": {"type": "mapping", "mappings": ["-=>"]}},
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
            "substring": {"type": "ngram", "min_gram": 1, "max_gram": 6},
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
            "custom_with_char_filter": {
                "tokenizer": "standard",
                "char_filter": ["hyphen_mapping"],
            },
            "edge_analyzer": {
                "tokenizer": "custom_edge_ngram",
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
                "token_chars": ["letter", "digit"],
            },
            "custom_edge_ngram": {
                "type": "edge_ngram",
                "min_gram": 2,
                "max_gram": 6,
                "token_chars": ["letter", "digit"],
            },
        },
    },
    "max_ngram_diff": "20",
}

ES_CLIENT = ElasticsearchClientCompat7to6([settings.ELASTICSEARCH["HOST"]])
ES_INDICES_CLIENT = ElasticsearchIndicesClientCompat7to6(ES_CLIENT)


def partaj_bulk(actions, **kwargs):
    """Wrap bulk helper to set default parameters."""
    return bulk_compat(
        actions=actions,
        chunk_size=settings.ELASTICSEARCH["CHUNK_SIZE"],
        client=ES_CLIENT,
        stats_only=True,
        **kwargs
    )


DEFAULT_DELIMITERS = [" ", "/", "|"]


def slice_string_for_completion(string, delimiters=None):
    """
    Split a string in significant parts for use in completion.
    Example with " " as a delimiter:
    "University of Paris 13" => "University of Paris 13", "of Paris 13", "Paris 13", "13"

    This is useful to enable autocompletion starting from any part of a name. If we just use the
    name directly in the ES completion type, it will only return options that match on the first
    characters of the whole string, which is not always suitable.
    """
    delimiters = delimiters or DEFAULT_DELIMITERS
    results = [string]

    for i in range(len(string)):
        if string[len(string) - i - 1] in delimiters:
            results.append(string[len(string) - i :])  # noqa: E203

    return results
