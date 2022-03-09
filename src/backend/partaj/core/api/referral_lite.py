"""
Referral lite related API endpoints.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model

from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .. import models
from ..forms import ReferralListQueryForm
from ..indexers import ES_CLIENT, ReferralsIndexer
from ..serializers import ReferralLiteSerializer

# pylint: disable=invalid-name
User = get_user_model()


class ReferralLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Referral related endpoints using the referral lite serializer.

    Use this one instead of referral when performance is important (eg. for list requests
    which take a long time using time using the regular referral serializer).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ReferralLiteSerializer

    # pylint: disable=too-many-locals,too-many-branches
    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """
        form = ReferralListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        # Set up the initial list of filters for all list queries
        es_query_filters = [
            {
                "bool": {
                    # Start with a logical OR that restricts results to referrals the current
                    # user is allowed to access.
                    "should": [
                        {
                            "bool": {
                                "should": [
                                    {
                                        "term": {
                                            "expected_validators": str(request.user.id)
                                        }
                                    },
                                    {
                                        "term": {
                                            "linked_unit_all_members": str(
                                                request.user.id
                                            )
                                        }
                                    },
                                ],
                                "must_not": {
                                    "term": {"state": str(models.ReferralState.DRAFT)}
                                },
                            }
                        },
                        {"term": {"users": str(request.user.id)}},
                    ]
                }
            }
        ]

        topic = form.cleaned_data.get("topic")
        if len(topic):
            es_query_filters += [{"terms": {"topic": topic}}]

        unit = form.cleaned_data.get("unit")
        if len(unit):
            es_query_filters += [{"terms": {"units": unit}}]

        user = form.cleaned_data.get("user")
        if len(user):
            es_query_filters += [{"terms": {"users": user}}]

        assignee = form.cleaned_data.get("assignee")
        if len(assignee):
            es_query_filters += [{"terms": {"assignees": assignee}}]

        state = form.cleaned_data.get("state")
        if len(state):
            es_query_filters += [{"terms": {"state": state}}]
        else:
            # Make sure to exclude draft referrals whenever a list of acceptable states is not
            # passed by the caller.
            es_query_filters += [
                {
                    "bool": {
                        "must_not": [
                            {"term": {"state": str(models.ReferralState.DRAFT)}}
                        ]
                    }
                }
            ]

        due_date_after = form.cleaned_data.get("due_date_after")
        if due_date_after:
            es_query_filters += [{"range": {"due_date": {"gt": due_date_after}}}]

        due_date_before = form.cleaned_data.get("due_date_before")
        if due_date_before:
            # If the same day is selected for before and after, silently add one day to the
            # `due_date_before` so we actually show referrals that have exactly this due date
            if due_date_after == due_date_before:
                due_date_before += timedelta(days=1)
            es_query_filters += [{"range": {"due_date": {"lt": due_date_before}}}]

        task = form.cleaned_data.get("task")
        if task == "process":
            es_query_filters += [
                {
                    "bool": {
                        "filter": [
                            {
                                "terms": {
                                    "state": [
                                        models.ReferralState.ASSIGNED,
                                        models.ReferralState.IN_VALIDATION,
                                        models.ReferralState.PROCESSING,
                                        models.ReferralState.RECEIVED,
                                    ]
                                },
                            },
                            {
                                "bool": {
                                    "should": [
                                        {"term": {"assignees": request.user.id}},
                                        {
                                            "term": {
                                                "linked_unit_admins": request.user.id
                                            }
                                        },
                                        {
                                            "term": {
                                                "linked_unit_owners": request.user.id
                                            }
                                        },
                                    ],
                                }
                            },
                        ],
                    }
                }
            ]
        elif task == "assign":
            es_query_filters += [
                {"term": {"linked_unit_owners": request.user.id}},
                {"term": {"state": models.ReferralState.RECEIVED}},
            ]
        elif task == "validate":
            es_query_filters += [
                {"term": {"expected_validators": request.user.id}},
                {"term": {"state": models.ReferralState.IN_VALIDATION}},
            ]

        sort_field = form.cleaned_data.get("sort") or "due_date"
        # For text fields, we need to target keyword sub-fields for sorting
        if sort_field in ["assignees_names", "object", "users_names"]:
            sort_field = f"{sort_field}.keyword"
        sort_dir = form.cleaned_data.get("sort_dir") or "desc"

        # pylint: disable=unexpected-keyword-arg
        es_response = ES_CLIENT.search(
            index=ReferralsIndexer.index_name,
            body={
                "query": {"bool": {"filter": es_query_filters}},
                "sort": [{sort_field: {"order": sort_dir}}],
            },
            size=form.cleaned_data.get("limit") or 1000,
        )

        return Response(
            {
                "count": len(es_response["hits"]["hits"]),
                "next": None,
                "previous": None,
                "results": [
                    item["_source"]["_lite"] for item in es_response["hits"]["hits"]
                ],
            }
        )
