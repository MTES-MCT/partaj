"""
Referral lite related API endpoints.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from sentry_sdk import capture_message

from .. import models
from ..forms import ReferralListQueryForm
from ..indexers import ES_CLIENT, ReferralsIndexer
from ..models import ReportEventVerb
from ..serializers import ReferralLiteSerializer

# pylint: disable=invalid-name
# pylint: disable=line-too-long
User = get_user_model()


class ReferralLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Referral related endpoints using the referral lite serializer.

    Use this one instead of referral when performance is important (eg. for list requests
    which take a long time using the regular referral serializer).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ReferralLiteSerializer

    # pylint: disable=too-many-locals,too-many-branches,too-many-statements,consider-using-set-comprehension
    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """

        form = ReferralListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        unit_memberships = models.UnitMembership.objects.filter(
            user=request.user,
        ).all()

        roles = list(
            set([unit_membership.role for unit_membership in unit_memberships])
        )

        units = list(
            set([unit_membership.unit.id for unit_membership in unit_memberships])
        )

        if len(roles) > 1:
            capture_message(
                f"User {request.user.id} has been found with multiple roles",
                "error",
            )

        if len(roles) == 0:
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                }
            )

        role = roles[0]

        # Set up the initial list of filters for all list queries
        es_query_filters = [
            {
                "bool": {
                    # Start with a logical OR that restricts results to referrals the current
                    # user is allowed to access.
                    "should": [
                        {
                            "bool": {
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

        full_text = form.cleaned_data.get("query")
        if full_text:
            es_query_filters += [
                {
                    "multi_match": {
                        "analyzer": "french",
                        "fields": [
                            "context.*",
                            "object.language",
                            "object.trigram",
                            "prior_work.*",
                            "question.*",
                            "topic_text.*",
                        ],
                        "query": full_text,
                        "type": "best_fields",
                    }
                },
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

        users_unit_name = form.cleaned_data.get("users_unit_name")
        if len(users_unit_name):
            es_query_filters += [{"terms": {"users_unit_name": users_unit_name}}]

        assignee = form.cleaned_data.get("assignee")
        if len(assignee):
            es_query_filters += [{"terms": {"assignees": assignee}}]

        state = form.cleaned_data.get("state")
        if len(state):
            es_query_filters += [{"terms": {"state": state}}]

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
        if task:
            # Check role and add a constant filter to :
            # - All referral assigned to user for unit members
            # - All referral assigned to user unit for granted users
            if role == models.UnitMembershipRole.MEMBER:
                es_query_filters += [
                    {
                        "bool": {
                            "must": {"term": {"assignees": request.user.id}},
                        }
                    }
                ]

            if role in [
                models.UnitMembershipRole.OWNER,
                models.UnitMembershipRole.ADMIN,
                models.UnitMembershipRole.SUPERADMIN,
            ]:
                es_query_filters += [
                    {
                        "bool": {
                            "must": {"terms": {"units": units}},
                        }
                    }
                ]

        if task == "process":
            es_query_filters += [
                {
                    "bool": {
                        "must_not": [
                            {
                                "terms": {
                                    "state": [
                                        models.ReferralState.RECEIVED,
                                        models.ReferralState.ANSWERED,
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "must": [
                                        {
                                            "term": {
                                                "events.verb": ReportEventVerb.REQUEST_VALIDATION,
                                            }
                                        },
                                        {
                                            "term": {
                                                "events.receiver_unit_name": request.user.unit_name,
                                            }
                                        },
                                        {
                                            "term": {
                                                "events.receiver_role": role,
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "must": [
                                        {
                                            "term": {
                                                "events.verb": ReportEventVerb.REQUEST_CHANGE,
                                            }
                                        },
                                        {
                                            "term": {
                                                "last_author": request.user.id,
                                            }
                                        },
                                    ]
                                }
                            },
                        ],
                    }
                },
            ]

        elif task == "assign":
            owner_units = units if role == models.UnitMembershipRole.OWNER else []

            es_query_filters += [
                {"terms": {"units": owner_units}},
                {"term": {"state": models.ReferralState.RECEIVED}},
            ]
        elif task == "validate":
            es_query_filters += [
                {
                    "bool": {
                        "should": [
                            {
                                "bool": {
                                    "must": [
                                        {
                                            "term": {
                                                "expected_validators": request.user.id
                                            }
                                        },
                                        {
                                            "term": {
                                                "state": models.ReferralState.IN_VALIDATION
                                            }
                                        },
                                    ]
                                }
                            },
                            {
                                "bool": {
                                    "must": [
                                        {
                                            "term": {
                                                "events.verb": ReportEventVerb.REQUEST_VALIDATION,
                                            }
                                        },
                                        {
                                            "term": {
                                                "events.receiver_unit_name": request.user.unit_name,
                                            }
                                        },
                                        {
                                            "term": {
                                                "events.receiver_role": role,
                                            }
                                        },
                                    ]
                                }
                            },
                        ],
                    }
                },
            ]
        elif task == "change":
            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "events.verb": ReportEventVerb.REQUEST_CHANGE,
                                }
                            },
                            {
                                "term": {
                                    "last_author": request.user.id,
                                }
                            },
                        ]
                    }
                },
            ]

        elif task == "in_validation":
            es_query_filters += [
                {
                    "bool": {
                        "must": [
                            {
                                "term": {
                                    "events.verb": ReportEventVerb.REQUEST_VALIDATION,
                                }
                            },
                            {
                                "bool": {
                                    "should": [
                                        {
                                            "term": {
                                                "last_author": request.user.id,
                                            }
                                        },
                                        {
                                            "term": {
                                                "events.sender_id": request.user.id,
                                            }
                                        },
                                    ]
                                }
                            },
                        ]
                    }
                },
            ]

        sort_field = form.cleaned_data.get("sort") or "due_date"
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

    @action(
        detail=False,
        permission_classes=[IsAuthenticated],
    )
    # pylint: disable=invalid-name
    def my_unit(self, request):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """

        form = ReferralListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})
        task = form.cleaned_data.get("task")

        if not task or task not in ["my_unit", "my_referrals", "my_drafts"]:
            task = "my_referrals"

        if task == "my_unit":
            if models.UnitMembership.objects.filter(user=request.user).count() > 0:
                return Response(status=403)

        sort_field = form.cleaned_data.get("sort") or "due_date"
        sort_dir = form.cleaned_data.get("sort_dir") or "desc"

        es_query_filters = [
            {
                "bool": {
                    "should": [
                        {"prefix": {"users_unit_name": request.user.unit_name}},
                        {"term": {"users": str(request.user.id)}},
                    ]
                },
            }
        ]

        if task != "my_drafts":
            es_query_filters += [
                {
                    "bool": {
                        "must_not": [
                            {"term": {"state": str(models.ReferralState.DRAFT)}}
                        ]
                    }
                }
            ]
        else:
            es_query_filters += [
                {
                    "bool": {
                        "must": [{"term": {"state": str(models.ReferralState.DRAFT)}}]
                    }
                }
            ]
        if task in ["my_referrals", "my_drafts"]:
            es_query_filters += [
                {
                    "bool": {
                        "must": {"term": {"users": str(request.user.id)}},
                    }
                }
            ]

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
