"""
Referral lite related API endpoints.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..forms import NoteListQueryForm
from ..indexers import ES_CLIENT, NotesIndexer

# pylint: disable=invalid-name
User = get_user_model()


class NoteLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Note related endpoints for notes list search.
    """

    permission_classes = [IsAuthenticated]

    # pylint: disable=too-many-locals,too-many-branches
    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of notes.
        """

        form = NoteListQueryForm(data=self.request.query_params)

        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        es_query_filters = []

        topic_filters = form.cleaned_data.get("topic")
        if len(topic_filters):
            es_query_filters += [
                {"bool": {"must": [{"terms": {"topic.filter_keyword": topic_filters}}]}}
            ]

        requesters_unit_names = form.cleaned_data.get("requesters_unit_names")
        if len(requesters_unit_names):
            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {"terms": {"requesters_unit_names": requesters_unit_names}}
                        ]
                    }
                }
            ]

        assigned_units_names = form.cleaned_data.get("assigned_units_names")
        if len(assigned_units_names):
            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {"terms": {"assigned_units_names": assigned_units_names}}
                        ]
                    }
                }
            ]

        contributors = form.cleaned_data.get("contributors")
        if len(contributors):
            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {"terms": {"contributors.filter_keyword": contributors}}
                        ]
                    }
                }
            ]

        publication_date_after = form.cleaned_data.get("publication_date_after")
        if publication_date_after:
            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "publication_date": {"gte": publication_date_after}
                                }
                            }
                        ]
                    }
                }
            ]

        publication_date_before = form.cleaned_data.get("publication_date_before")
        if publication_date_before:
            publication_date_before += timedelta(days=1)

            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {
                                "range": {
                                    "publication_date": {"lte": publication_date_before}
                                }
                            }
                        ]
                    }
                }
            ]

        full_text = form.cleaned_data.get("query") or ""

        if full_text:
            quoted_texts = full_text.split('"')[1::2]
            not_quoted_text = "".join(full_text.split('"')[::2])
            not_quoted_text_query = (
                [
                    {
                        "multi_match": {
                            "fields": [
                                "referral_id^10",
                                "object^10",
                                "contributors^8",
                                "text^6",
                                "topic^3",
                            ],
                            "query": not_quoted_text,
                            "type": "cross_fields",
                            "operator": "and",
                        }
                    }
                ]
                if not_quoted_text
                else []
            )

            quoted_text_queries = (
                [
                    *[
                        {
                            "multi_match": {
                                "fields": [
                                    "referral_id^10",
                                    "object.exact^10",
                                    "contributors.exact^8",
                                    "text.exact^5",
                                    "topic.exact",
                                ],
                                "query": quoted_text,
                                "type": "phrase",
                            }
                        }
                        for quoted_text in quoted_texts
                        if quoted_text != ""
                    ]
                ]
                if len(quoted_texts) > 0
                else []
            )

            es_query_filters += [
                {"bool": {"must": quoted_text_queries + not_quoted_text_query}}
            ]
            sort = []
        else:
            es_query_filters += [{"match_all": {}}]
            sort = [{"publication_date": {"order": "desc"}}]

        # pylint: disable=unexpected-keyword-arg
        es_response = ES_CLIENT.search(
            index=NotesIndexer.index_name,
            body={
                "query": {"bool": {"filter": es_query_filters}},
                "sort": sort,
                "highlight": {
                    "pre_tags": ['<span class="highlight">'],
                    "post_tags": ["</span>"],
                    "fields": {
                        "referral_id": {
                            "type": "plain",
                            "fragment_size": 1000,
                            "number_of_fragments": 1,
                        },
                        "text": {
                            "matched_fields": ["text", "text.4gram", "text.exact"],
                            "type": "fvh",
                        },
                        "object": {
                            "matched_fields": [
                                "object",
                                "object.exact",
                            ],
                            "type": "fvh",
                            "fragment_size": 1000,
                            "number_of_fragments": 1,
                        },
                        "author": {
                            "type": "plain",
                            "fragment_size": 1000,
                            "number_of_fragments": 1,
                        },
                        "contributors": {
                            "matched_fields": [
                                "contributors",
                                "contributors.exact",
                            ],
                            "type": "fvh",
                            "fragment_size": 1000,
                            "number_of_fragments": 1,
                        },
                        "topic": {
                            "matched_fields": ["topic", "topic.4gram", "topic.exact"],
                            "type": "fvh",
                        },
                    },
                },
            },
            size=50,
        )

        return Response(
            {
                "count": len(es_response["hits"]["hits"]),
                "next": None,
                "previous": None,
                "results": es_response,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsAuthenticated],
    )
    # pylint: disable=invalid-name
    def filters(self, request):
        """
        GET all notes filters and aggregated values
        """

        es_response = ES_CLIENT.search(
            index=NotesIndexer.index_name,
            body={
                "aggs": {
                    "topic": {
                        "terms": {
                            "field": "theme.id",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 1},
                    },
                    "contributors": {
                        "terms": {
                            "field": "contributors.filter_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 3},
                    },
                    "requesters_unit_names": {
                        "terms": {
                            "field": "requesters_unit_names",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 4},
                    },
                    "assigned_units_names": {
                        "terms": {
                            "field": "assigned_units_names",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 2},
                    },
                },
            },
            size=0,
        )

        return Response(data=es_response)
