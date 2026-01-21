# pylint: disable=invalid-name,line-too-long,too-many-lines,pointless-string-statement
"""
Referral-lite-related API endpoints.
"""

import codecs
import csv
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils.translation import gettext as _

from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from sentry_sdk import capture_message

from .. import models
from ..forms import DashboardReferralListQueryForm, ReferralListQueryForm
from ..indexers import ES_CLIENT, ReferralsIndexer
from ..models import MemberRoleAccess, ReportEventVerb
from ..serializers import ReferralLiteSerializer
from ..services.factories.error_response import ErrorResponseFactory
from ..services.mappers import ESSortMapper

User = get_user_model()

PAGINATION = 10


class ReferralLiteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Referral-related endpoints using the referral lite serializer.

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
            if not request.user.is_staff:
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
                        "fields": [
                            "context.*",
                            "object.language",
                            "object.trigram",
                            "prior_work.*",
                            "question.*",
                            "topic_text.*",
                            "referral_id.edge",
                        ],
                        "query": full_text,
                        "type": "cross_fields",
                        "operator": "and",
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

        sort_field = form.cleaned_data.get("sort") or "created_at"
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

    @staticmethod
    def __get_dashboard_query(request, form, sorting, pagination):
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
            if not request.user.is_staff:
                capture_message(
                    f"User {request.user.id} has been found with multiple roles",
                    "error",
                )

        if len(roles) == 0:
            return []

        role = roles[0]

        # Set up the initial list of filters for all list queries
        base_es_query_filters = [
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
            base_es_query_filters += [
                {
                    "multi_match": {
                        "fields": [
                            "object.language",
                            "object.trigram",
                            "sub_title.language",
                            "sub_title.trigram",
                            "title.language",
                            "title.trigram",
                            "referral_id.edge",
                        ],
                        "query": full_text,
                        "type": "cross_fields",
                        "operator": "and",
                    }
                },
            ]

        topics = form.cleaned_data.get("topics")

        if len(topics):
            base_es_query_filters += [{"terms": {"topic_text.keyword": topics}}]

        contributors_unit_names = form.cleaned_data.get("contributors_unit_names")
        if len(contributors_unit_names):
            base_es_query_filters += [
                {
                    "terms": {
                        "contributors_unit_names.name_keyword": contributors_unit_names
                    }
                }
            ]

        requesters = form.cleaned_data.get("requesters")
        if len(requesters):
            base_es_query_filters += [
                {"terms": {"requester_users.name_keyword": requesters}}
            ]

        requesters_unit_names = form.cleaned_data.get("requesters_unit_names")
        if len(requesters_unit_names):
            base_es_query_filters += [
                {"terms": {"users_unit_name": requesters_unit_names}}
            ]

        assignees = form.cleaned_data.get("assignees")
        if len(assignees):
            base_es_query_filters += [
                {"terms": {"assigned_users.name_keyword": assignees}}
            ]

        due_date_after = form.cleaned_data.get("due_date_after")
        if due_date_after:
            base_es_query_filters += [{"range": {"due_date": {"gt": due_date_after}}}]

        due_date_before = form.cleaned_data.get("due_date_before")
        if due_date_before:
            # If the same day is selected for before and after, silently add one day to the
            # `due_date_before` so we actually show referrals that have exactly this due date
            if due_date_after == due_date_before:
                due_date_before += timedelta(days=1)
            base_es_query_filters += [{"range": {"due_date": {"lt": due_date_before}}}]

        sent_at_after = form.cleaned_data.get("sent_at_after")
        if sent_at_after:
            base_es_query_filters += [{"range": {"sent_at": {"gt": sent_at_after}}}]

        sent_at_before = form.cleaned_data.get("sent_at_before")
        if sent_at_before:
            # If the same day is selected for before and after, silently add one day to the
            # `sent_at_before` so we actually show referrals that have exactly this sent date
            if sent_at_after == sent_at_before:
                sent_at_before += timedelta(days=1)
            base_es_query_filters += [{"range": {"sent_at": {"lt": sent_at_before}}}]

        # Check role and add a constant filter to :
        # - All referral assigned to user for unit members
        # - All referral sent to user unit for granted users
        if role == models.UnitMembershipRole.MEMBER:
            base_es_query_filters += [
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
            base_es_query_filters += [
                {
                    "bool": {
                        "must": {"terms": {"units": units}},
                    }
                }
            ]

        # PROCESS
        process_es_query_filters = base_es_query_filters + [
            {
                "bool": {
                    "must_not": [
                        {
                            "terms": {
                                "state": [
                                    models.ReferralState.RECEIVED,
                                    models.ReferralState.SPLITTING,
                                    models.ReferralState.RECEIVED_SPLITTING,
                                    models.ReferralState.ANSWERED,
                                    models.ReferralState.CLOSED,
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

        # ASSIGN
        owner_units = units if role == models.UnitMembershipRole.OWNER else []

        assign_es_query_filters = base_es_query_filters + [
            {"terms": {"units": owner_units}},
            {
                "terms": {
                    "state": [
                        models.ReferralState.RECEIVED,
                        models.ReferralState.RECEIVED_SPLITTING,
                        models.ReferralState.SPLITTING,
                    ]
                }
            },
        ]

        # CHANGE
        change_es_query_filters = base_es_query_filters + [
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

        # IN VALIDATION
        in_validation_es_query_filters = base_es_query_filters + [
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

        # VALIDATE
        validate_query_filters = base_es_query_filters + [
            {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must": [
                                    {"term": {"expected_validators": request.user.id}},
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

        # DONE
        done_query_filters = base_es_query_filters + [
            {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must": [
                                    {"term": {"state": models.ReferralState.CLOSED}},
                                ]
                            }
                        },
                        {
                            "bool": {
                                "must": [
                                    {"term": {"state": models.ReferralState.ANSWERED}},
                                ]
                            }
                        },
                    ],
                }
            },
        ]

        # CONSTRUCT MULTIPLE ES QUERIES
        # ALL
        request = []
        req_types = []

        req_head = {"index": ReferralsIndexer.index_name}
        req_body = {
            "query": {"bool": {"filter": base_es_query_filters}},
        }

        if "all" in sorting:
            req_body["sort"] = [
                {sorting["all"]["column"]: {"order": sorting["all"]["dir"]}}
            ]
        else:
            req_body["sort"] = [{"sent_at": {"order": "desc"}}]

        if "all" in pagination:
            req_body["from"] = pagination["all"]["from"]
            req_body["size"] = pagination["all"]["size"]
        else:
            req_body["from"] = pagination["default"]["from"]
            req_body["size"] = pagination["default"]["size"]

        request.extend([req_head, req_body])
        req_types.append("all")

        # PROCESS
        req_head = {"index": ReferralsIndexer.index_name}
        req_body = {
            "query": {"bool": {"filter": process_es_query_filters}},
        }

        if "process" in sorting:
            req_body["sort"] = [
                {sorting["process"]["column"]: {"order": sorting["process"]["dir"]}}
            ]
        else:
            req_body["sort"] = [{"sent_at": {"order": "desc"}}]

        if "process" in pagination:
            req_body["from"] = pagination["process"]["from"]
            req_body["size"] = pagination["process"]["size"]
        else:
            req_body["from"] = pagination["default"]["from"]
            req_body["size"] = pagination["default"]["size"]

        request.extend([req_head, req_body])
        req_types.append("process")

        if role in [
            models.UnitMembershipRole.OWNER,
        ]:
            # ASSIGN
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": assign_es_query_filters}},
            }

            if "assign" in sorting:
                req_body["sort"] = [
                    {sorting["assign"]["column"]: {"order": sorting["assign"]["dir"]}}
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "assign" in pagination:
                req_body["from"] = pagination["assign"]["from"]
                req_body["size"] = pagination["assign"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("assign")

        if role not in [
            models.UnitMembershipRole.MEMBER,
        ]:
            # VALIDATE
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": validate_query_filters}},
            }

            if "validate" in sorting:
                req_body["sort"] = [
                    {
                        sorting["validate"]["column"]: {
                            "order": sorting["validate"]["dir"]
                        }
                    }
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "validate" in pagination:
                req_body["from"] = pagination["validate"]["from"]
                req_body["size"] = pagination["validate"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("validate")

        if role not in [
            models.UnitMembershipRole.SUPERADMIN,
        ]:
            # CHANGE
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": change_es_query_filters}},
            }

            if "change" in sorting:
                req_body["sort"] = [
                    {sorting["change"]["column"]: {"order": sorting["change"]["dir"]}}
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "change" in pagination:
                req_body["from"] = pagination["change"]["from"]
                req_body["size"] = pagination["change"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("change")

        if role not in [
            models.UnitMembershipRole.SUPERADMIN,
        ]:
            # IN VALIDATION
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": in_validation_es_query_filters}},
                "from": 0,
                "size": 1000,
            }

            if "in_validation" in sorting:
                req_body["sort"] = [
                    {
                        sorting["in_validation"]["column"]: {
                            "order": sorting["in_validation"]["dir"]
                        }
                    }
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "in_validation" in pagination:
                req_body["from"] = pagination["in_validation"]["from"]
                req_body["size"] = pagination["in_validation"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("in_validation")

        # DONE
        req_head = {"index": ReferralsIndexer.index_name}
        req_body = {
            "query": {"bool": {"filter": done_query_filters}},
        }

        if "done" in sorting:
            req_body["sort"] = [
                {sorting["done"]["column"]: {"order": sorting["done"]["dir"]}}
            ]
        else:
            req_body["sort"] = [{"sent_at": {"order": "desc"}}]

        if "done" in pagination:
            req_body["from"] = pagination["done"]["from"]
            req_body["size"] = pagination["done"]["size"]
        else:
            req_body["from"] = pagination["default"]["from"]
            req_body["size"] = pagination["default"]["size"]

        request.extend([req_head, req_body])
        req_types.append("done")

        # pylint: disable=unexpected-keyword-arg
        es_responses = ES_CLIENT.msearch(body=request)
        normalized_response = [
            {
                "name": req_types[index],
                "count": response["hits"]["total"]["value"],
                "items": [hit["_source"] for hit in response["hits"]["hits"]],
            }
            for index, response in enumerate(es_responses["responses"])
        ]

        return normalized_response

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    # pylint: disable=too-many-locals,too-many-branches,too-many-statements,consider-using-set-comprehension
    def dashboard(self, request, *args, **kwargs):
        """
        Handle requests for lists of referrals. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """

        form = DashboardReferralListQueryForm(data=self.request.query_params)

        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        # SORTING
        sorting = {}

        for value in form.cleaned_data.get("sort"):
            config = value.split("-")
            sorting[config[0]] = {
                "column": ESSortMapper.map(config[1]),
                "dir": config[2],
            }

        # PAGINATION
        pagination = {}

        pagination["default"] = {"from": 0, "size": PAGINATION}

        for page in form.cleaned_data.get("page"):
            config = page.split("-")

            pagination[config[0]] = {
                "from": (int(config[1]) - 1) * 2,
                "size": PAGINATION,
            }

        normalized_es_response = self.__get_dashboard_query(
            request, form, sorting, pagination
        )

        final_response = {"pagination": PAGINATION}

        for value in normalized_es_response:
            final_response[value["name"]] = {
                "count": value["count"],
                "items": [item["_lite"] for item in value["items"]],
            }

        return Response(data=final_response)

    @staticmethod
    def __get_unit_query(request, form, sorting, pagination):
        unit_id = form.cleaned_data.get("unit_id")
        if not unit_id:
            return ErrorResponseFactory.create_error("Unit params is needed")

        unit_membership = models.UnitMembership.objects.filter(
            user=request.user,
            unit=unit_id,
        ).get()

        unit = unit_membership.unit

        role = unit_membership.role

        # Set up the initial list of filters for all list queries
        base_es_query_filters = [
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
            base_es_query_filters += [
                {
                    "multi_match": {
                        "fields": [
                            "object.language",
                            "object.trigram",
                            "title.language",
                            "title.trigram",
                            "sub_title.language",
                            "sub_title.trigram",
                            "referral_id.edge",
                        ],
                        "query": full_text,
                        "type": "cross_fields",
                        "operator": "and",
                    }
                },
            ]

        topics = form.cleaned_data.get("topics")

        if len(topics):
            base_es_query_filters += [{"terms": {"topic_text.keyword": topics}}]

        contributors_unit_names = form.cleaned_data.get("contributors_unit_names")
        if len(contributors_unit_names):
            base_es_query_filters += [
                {
                    "terms": {
                        "contributors_unit_names.name_keyword": contributors_unit_names
                    }
                }
            ]

        requesters = form.cleaned_data.get("requesters")
        if len(requesters):
            base_es_query_filters += [
                {"terms": {"requester_users.name_keyword": requesters}}
            ]

        requesters_unit_names = form.cleaned_data.get("requesters_unit_names")
        if len(requesters_unit_names):
            base_es_query_filters += [
                {"terms": {"users_unit_name": requesters_unit_names}}
            ]

        assignees = form.cleaned_data.get("assignees")
        if len(assignees):
            base_es_query_filters += [
                {"terms": {"assigned_users.name_keyword": assignees}}
            ]

        due_date_after = form.cleaned_data.get("due_date_after")
        if due_date_after:
            base_es_query_filters += [{"range": {"due_date": {"gt": due_date_after}}}]

        due_date_before = form.cleaned_data.get("due_date_before")
        if due_date_before:
            # If the same day is selected for before and after, silently add one day to the
            # `due_date_before` so we actually show referrals that have exactly this due date
            if due_date_after == due_date_before:
                due_date_before += timedelta(days=1)
            base_es_query_filters += [{"range": {"due_date": {"lt": due_date_before}}}]

        sent_at_after = form.cleaned_data.get("sent_at_after")
        if sent_at_after:
            base_es_query_filters += [{"range": {"sent_at": {"gt": sent_at_after}}}]

        sent_at_before = form.cleaned_data.get("sent_at_before")
        if sent_at_before:
            # If the same day is selected for before and after, silently add one day to the
            # `sent_at_before` so we actually show referrals that have exactly this sent date
            if sent_at_after == sent_at_before:
                sent_at_before += timedelta(days=1)
            base_es_query_filters += [{"range": {"sent_at": {"lt": sent_at_before}}}]

        # Check role and add a constant filter to :
        # - All referral assigned to user for unit members
        # - All referral sent to user unit for granted users
        if unit.member_role_access == MemberRoleAccess.RESTRICTED:
            base_es_query_filters += [
                {
                    "bool": {
                        "must_not": {
                            "terms": {
                                "state": [
                                    models.ReferralState.RECEIVED,
                                    models.ReferralState.RECEIVED_SPLITTING,
                                ]
                            }
                        },
                    }
                }
            ]

        base_es_query_filters += [
            {
                "bool": {
                    "must": {"terms": {"units": [unit_id]}},
                }
            }
        ]

        # PROCESS
        process_es_query_filters = base_es_query_filters + [
            {
                "bool": {
                    "must_not": [
                        {
                            "terms": {
                                "state": [
                                    models.ReferralState.SPLITTING,
                                    models.ReferralState.RECEIVED_SPLITTING,
                                    models.ReferralState.RECEIVED,
                                    models.ReferralState.ANSWERED,
                                    models.ReferralState.CLOSED,
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

        # ASSIGN
        owner_units = [unit_id] if role == models.UnitMembershipRole.OWNER else []

        assign_es_query_filters = base_es_query_filters + [
            {"terms": {"units": owner_units}},
            {
                "terms": {
                    "state": [
                        models.ReferralState.RECEIVED,
                        models.ReferralState.RECEIVED_SPLITTING,
                        models.ReferralState.SPLITTING,
                    ]
                }
            },
        ]

        # CHANGE
        change_es_query_filters = base_es_query_filters + [
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

        # IN VALIDATION
        in_validation_es_query_filters = base_es_query_filters + [
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

        # VALIDATE
        validate_query_filters = base_es_query_filters + [
            {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must": [
                                    {"term": {"expected_validators": request.user.id}},
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

        # DONE
        done_query_filters = base_es_query_filters + [
            {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must": [
                                    {"term": {"state": models.ReferralState.CLOSED}},
                                ]
                            }
                        },
                        {
                            "bool": {
                                "must": [
                                    {"term": {"state": models.ReferralState.ANSWERED}},
                                ]
                            }
                        },
                    ],
                }
            },
        ]

        # CONSTRUCT MULTIPLE ES QUERIES
        # ALL
        request = []
        req_types = []

        req_head = {"index": ReferralsIndexer.index_name}
        req_body = {
            "query": {"bool": {"filter": base_es_query_filters}},
        }

        if "all" in sorting:
            req_body["sort"] = [
                {sorting["all"]["column"]: {"order": sorting["all"]["dir"]}}
            ]
        else:
            req_body["sort"] = [{"sent_at": {"order": "desc"}}]

        if "all" in pagination:
            req_body["from"] = pagination["all"]["from"]
            req_body["size"] = pagination["all"]["size"]
        else:
            req_body["from"] = pagination["default"]["from"]
            req_body["size"] = pagination["default"]["size"]

        request.extend([req_head, req_body])
        req_types.append("all")

        # PROCESS
        req_head = {"index": ReferralsIndexer.index_name}
        req_body = {
            "query": {"bool": {"filter": process_es_query_filters}},
        }

        if "process" in sorting:
            req_body["sort"] = [
                {sorting["process"]["column"]: {"order": sorting["process"]["dir"]}}
            ]
        else:
            req_body["sort"] = [{"sent_at": {"order": "desc"}}]

        if "process" in pagination:
            req_body["from"] = pagination["process"]["from"]
            req_body["size"] = pagination["process"]["size"]
        else:
            req_body["from"] = pagination["default"]["from"]
            req_body["size"] = pagination["default"]["size"]

        request.extend([req_head, req_body])
        req_types.append("process")

        if (
            role
            in [
                models.UnitMembershipRole.OWNER,
            ]
            and unit.member_role_access == MemberRoleAccess.TOTAL
        ):
            # ASSIGN
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": assign_es_query_filters}},
            }

            if "assign" in sorting:
                req_body["sort"] = [
                    {sorting["assign"]["column"]: {"order": sorting["assign"]["dir"]}}
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "assign" in pagination:
                req_body["from"] = pagination["assign"]["from"]
                req_body["size"] = pagination["assign"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("assign")

        if role not in [
            models.UnitMembershipRole.MEMBER,
        ]:
            # VALIDATE
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": validate_query_filters}},
            }

            if "validate" in sorting:
                req_body["sort"] = [
                    {
                        sorting["validate"]["column"]: {
                            "order": sorting["validate"]["dir"]
                        }
                    }
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "validate" in pagination:
                req_body["from"] = pagination["validate"]["from"]
                req_body["size"] = pagination["validate"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("validate")

        if role not in [
            models.UnitMembershipRole.SUPERADMIN,
        ]:
            # CHANGE
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": change_es_query_filters}},
            }

            if "change" in sorting:
                req_body["sort"] = [
                    {sorting["change"]["column"]: {"order": sorting["change"]["dir"]}}
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "change" in pagination:
                req_body["from"] = pagination["change"]["from"]
                req_body["size"] = pagination["change"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("change")

        if role not in [
            models.UnitMembershipRole.SUPERADMIN,
        ]:
            # IN VALIDATION
            req_head = {"index": ReferralsIndexer.index_name}
            req_body = {
                "query": {"bool": {"filter": in_validation_es_query_filters}},
                "from": 0,
                "size": 1000,
            }

            if "in_validation" in sorting:
                req_body["sort"] = [
                    {
                        sorting["in_validation"]["column"]: {
                            "order": sorting["in_validation"]["dir"]
                        }
                    }
                ]
            else:
                req_body["sort"] = [{"sent_at": {"order": "desc"}}]

            if "in_validation" in pagination:
                req_body["from"] = pagination["in_validation"]["from"]
                req_body["size"] = pagination["in_validation"]["size"]
            else:
                req_body["from"] = pagination["default"]["from"]
                req_body["size"] = pagination["default"]["size"]

            request.extend([req_head, req_body])
            req_types.append("in_validation")

        # DONE
        req_head = {"index": ReferralsIndexer.index_name}
        req_body = {
            "query": {"bool": {"filter": done_query_filters}},
            "from": 0,
            "size": 1000,
        }

        if "done" in sorting:
            req_body["sort"] = [
                {sorting["done"]["column"]: {"order": sorting["done"]["dir"]}}
            ]
        else:
            req_body["sort"] = [{"sent_at": {"order": "desc"}}]

        if "done" in pagination:
            req_body["from"] = pagination["done"]["from"]
            req_body["size"] = pagination["done"]["size"]
        else:
            req_body["from"] = pagination["default"]["from"]
            req_body["size"] = pagination["default"]["size"]

        request.extend([req_head, req_body])
        req_types.append("done")

        # pylint: disable=unexpected-keyword-arg
        es_responses = ES_CLIENT.msearch(body=request)

        normalized_response = [
            {
                "name": req_types[index],
                "count": response["hits"]["total"]["value"],
                "items": [hit["_source"] for hit in response["hits"]["hits"]],
            }
            for index, response in enumerate(es_responses["responses"])
        ]

        return normalized_response

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    # pylint: disable=too-many-locals,too-many-branches,too-many-statements,consider-using-set-comprehension
    def unit(self, request, *args, **kwargs):
        """
        Handle requests for lists of referrals in unit dashboard. We're managing access rights inside the method
        as permissions depend on the supplied parameters.
        """
        form = DashboardReferralListQueryForm(data=self.request.query_params)

        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        # SORTING
        sorting = {}

        for value in form.cleaned_data.get("sort"):
            config = value.split("-")
            sorting[config[0]] = {
                "column": ESSortMapper.map(config[1]),
                "dir": config[2],
            }

        # PAGINATION
        pagination = {}

        pagination["default"] = {"from": 0, "size": PAGINATION}

        for page in form.cleaned_data.get("page"):
            config = page.split("-")

            pagination[config[0]] = {
                "from": (int(config[1]) - 1) * 2,
                "size": PAGINATION,
            }

        normalized_es_response = self.__get_unit_query(
            request, form, sorting, pagination
        )

        final_response = {
            "pagination": PAGINATION,
        }

        for value in normalized_es_response:
            final_response[value["name"]] = {
                "count": value["count"],
                "items": [item["_lite"] for item in value["items"]],
            }

        return Response(data=final_response)

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
            },
            {
                "bool": {
                    "must_not": [
                        {
                            "terms": {
                                "state": [
                                    models.ReferralState.SPLITTING,
                                    models.ReferralState.RECEIVED_SPLITTING,
                                ]
                            }
                        }
                    ]
                }
            },
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

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    # pylint: disable=invalid-name
    def filters(self, request):
        """
        GET all notes filters and aggregated values
        """
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
            if not request.user.is_staff:
                capture_message(
                    f"User {request.user.id} has been found with multiple roles",
                    "error",
                )

        if len(roles) == 0:
            capture_message(
                f"User {request.user.id} has been found with no roles but trying to reach dashboard referrals",
                "error",
            )
            return Response(
                {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": [],
                }
            )

        role = roles[0]
        es_query_filters = []

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

        es_response = ES_CLIENT.search(
            index=ReferralsIndexer.index_name,
            body={
                "query": {"bool": {"filter": es_query_filters}},
                "aggs": {
                    "topics": {
                        "terms": {
                            "field": "theme.name_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 1},
                    },
                    "assignees": {
                        "terms": {
                            "field": "assigned_users.name_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 2},
                    },
                    "requesters": {
                        "terms": {
                            "field": "requester_users.name_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 3},
                    },
                    "contributors_unit_names": {
                        "terms": {
                            "field": "contributors_unit_names.name_keyword",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 4},
                    },
                    "requesters_unit_names": {
                        "terms": {
                            "field": "users_unit_name",
                            "size": 1000,
                            "order": {"_key": "asc"},
                        },
                        "meta": {"order": 5},
                    },
                },
            },
            size=0,
        )

        response = {
            "contributors_unit_names": {
                "order": 4,
                "results": [
                    {
                        "name": contributors_unit_name["key"],
                        "id": contributors_unit_name["key"],
                    }
                    for contributors_unit_name in es_response["aggregations"][
                        "contributors_unit_names"
                    ]["buckets"]
                ],
            },
            "requesters_unit_names": {
                "order": 2,
                "results": [
                    {
                        "name": requesters_unit_name["key"],
                        "id": requesters_unit_name["key"],
                    }
                    for requesters_unit_name in es_response["aggregations"][
                        "requesters_unit_names"
                    ]["buckets"]
                ],
            },
            "assignees": {
                "order": 5,
                "results": [
                    {
                        "name": assignee["key"],
                        "id": assignee["key"],
                    }
                    for assignee in es_response["aggregations"]["assignees"]["buckets"]
                ],
            },
            "requesters": {
                "order": 3,
                "results": [
                    {
                        "name": requester["key"],
                        "id": requester["key"],
                    }
                    for requester in es_response["aggregations"]["requesters"][
                        "buckets"
                    ]
                ],
            },
            "topics": {
                "order": 1,
                "results": [
                    {
                        "name": topic["key"],
                        "id": topic["key"],
                    }
                    for topic in es_response["aggregations"]["topics"]["buckets"]
                ],
            },
        }

        return Response(data=response)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path=r"export/(?P<scope>\w+)(/(?P<tab>\w+))?",
    )
    def export(self, request, scope, *args, tab=None, **kwargs):
        """
        Handle requests for lists of referrals sent back as a CSV file.
        We're managing access rights inside the method as permissions depend
        on the supplied parameters.
        """
        form = DashboardReferralListQueryForm(data=self.request.query_params)

        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        # SORTING
        sorting = {}

        for value in form.cleaned_data.get("sort"):
            config = value.split("-")
            sorting[config[0]] = {
                "column": ESSortMapper.map(config[1]),
                "dir": config[2],
            }

        # PAGINATION
        pagination = {}
        pagination["default"] = {"from": 0, "size": 1000}

        referral_groups = (
            self.__get_unit_query(request, form, sorting, pagination)
            if scope == "unit"
            else self.__get_dashboard_query(request, form, sorting, pagination)
        )

        return self.__export_referrals(tab, referral_groups)

    def __export_referrals(self, tab, referral_groups):
        referrals = []

        current_tab = tab if tab is not None else "all"

        for res in referral_groups:
            if res["name"] == current_tab:
                for ref in res["items"]:
                    referrals.append(ref)

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=export.csv"
        response.write(codecs.BOM_UTF8)

        writer = csv.writer(response, delimiter=";", quoting=csv.QUOTE_ALL)
        writer.writerow(
            [
                _("export id"),
                _("export send at"),
                _("export due date"),
                _("export status"),
                _("export topic"),
                _("export object"),
                _("export requester unit"),
                _("export requesters"),
                _("export units"),
                _("export assignees"),
                _("export state"),
                _("export published date"),
            ]
        )

        for ref in referrals:
            referral_id = ref["referral_id"]
            sent_date = datetime.fromisoformat(ref["sent_at"])
            due_date = datetime.fromisoformat(ref["due_date"])
            state = models.ReferralState(ref["state"]).label
            theme = ref["theme"]["name_search"]
            title = ref["object"]
            requester_unit_names = " - ".join([unit for unit in ref["users_unit_name"]])
            requester_names = " - ".join(
                [user["name_search"] for user in ref["requester_users"]]
            )
            assignee_unit_names = " - ".join(
                [unit["name_search"] for unit in ref["contributors_unit_names"]]
            )
            assignee_names = " - ".join(
                [user["name_search"] for user in ref["assigned_users"]]
            )
            status = models.ReferralStatus(ref["status"]).label
            published_date = (
                datetime.fromisoformat(ref["published_date"])
                if ref["published_date"] is not None
                else None
            )

            writer.writerow(
                [
                    referral_id,
                    sent_date.strftime("%Y-%m-%d"),
                    due_date.strftime("%Y-%m-%d"),
                    status,
                    theme,
                    title,
                    requester_unit_names,
                    requester_names,
                    assignee_unit_names,
                    assignee_names,
                    state,
                    (
                        published_date.strftime("%Y-%m-%d")
                        if published_date is not None
                        else None
                    ),
                ]
            )

        return response
