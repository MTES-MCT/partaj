"""
Referral lite related API endpoints.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..forms import ReferralListQueryForm, NoteListQueryForm
from ..indexers import ES_CLIENT, ReferralsIndexer, NotesIndexer
from ..serializers import ReferralLiteSerializer

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

        # Set up the initial list of filters for all list queries
        es_query_filters = []

        full_text = form.cleaned_data.get("query")

        if full_text:
            es_query_filters += [
                {
                    "multi_match": {
                        "analyzer": "french",
                        "fields": [
                            "object.*",
                            "text.*",
                            "topic.*",
                            "html.*",
                        ],
                        "query": full_text,
                        "type": "best_fields",
                    }
                },
            ]


        # pylint: disable=unexpected-keyword-arg
        es_response = ES_CLIENT.search(
            index=NotesIndexer.index_name,
            body={
                "query": {"bool": {"filter": es_query_filters}},
                "highlight": {
                    "pre_tags": ['<span class="bg-primary-100">'],
                    "post_tags": ["</span>"],
                    "fields": {
                        "object.language": {"type": "plain"},
                        "text.language": {"type": "plain"},
                        "topic.language": {"type": "plain"},
                        "html.language": {"type": "plain", "fragment_size": 100000000}
                    }
                }
            },
            size=form.cleaned_data.get("limit") or 1000,
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
                "query": {
                    "match": {
                        "topic": "Unité DAJ1 Theme 1"
                    }
                },
                "aggs": {
                    "Topic Filter": {
                        "terms": {
                            "field": "topic.keyword",
                            "size": 1000,
                            "order": {"_key": "asc"}
                        }
                    },
                    "Author": {
                        "terms": {
                            "field": "author",
                            "size": 1000,
                            "order": {"_key": "asc"}
                        }
                    },
                    "Requester unit names": {
                        "terms": {
                            "field": "requesters_unit_names",
                            "size": 1000,
                            "order": {"_key": "asc"}
                        }
                    },
                    "Assigned unit names": {
                        "terms": {
                            "field": "assigned_units_names",
                            "size": 1000,
                            "order": {"_key": "asc"}
                        }
                    },
                    "Object": {
                        "terms": {
                            "field": "object.keyword",
                            "size": 1000,
                            "order": {"_key": "asc"}
                        }
                    },
                }
            },
            size=0,
        )

        return Response(data=es_response)