"""
Referral lite related API endpoints.
"""
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

        full_text = form.cleaned_data.get("query") or ""

        if full_text:
            quoted_texts = full_text.split('"')[1::2]
            not_quoted_text = "".join(full_text.split('"')[::2])
            print("not_quoted_text")
            print(not_quoted_text)
            not_quoted_text_query = (
                [
                    {
                        "multi_match": {
                            "fields": [
                                "referral_id^10",
                                "object^10",
                                "author^8",
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
                                    "author.exact^8",
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

            es_query_filters = {
                "bool": {"must": quoted_text_queries + not_quoted_text_query}
            }
        else:
            es_query_filters = {"match_all": {}}

        # pylint: disable=unexpected-keyword-arg
        es_response = ES_CLIENT.search(
            index=NotesIndexer.index_name,
            body={
                "query": es_query_filters,
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
                            "matched_fields": [
                                "author",
                                "author.exact",
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
            size=form.cleaned_data.get("limit") or 30,
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
        GET all notes notes filters and aggregated values
        """

        es_response = ES_CLIENT.search(
            index=NotesIndexer.index_name,
            body={
                "aggs": {
                    "Topic Filter": {
                        "terms": {
                            "field": "topic.filter_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        }
                    },
                    "Author": {
                        "terms": {
                            "field": "author.filter_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        }
                    },
                    "Requester unit names": {
                        "terms": {
                            "field": "requesters_unit_names",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        }
                    },
                    "Assigned unit names": {
                        "terms": {
                            "field": "assigned_units_names",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        }
                    },
                    "Object": {
                        "terms": {
                            "field": "object.filter_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        }
                    },
                },
            },
            size=0,
        )

        return Response(data=es_response)
