"""
User lite related API endpoints.
"""
from django.contrib.auth import get_user_model

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from ..forms import UserListQueryForm
from ..indexers import ES_CLIENT, UsersIndexer
from .common import AutocompleteMixin, ViewSetMetadata

User = get_user_model()


class UserLiteViewSet(AutocompleteMixin, GenericViewSet):
    """
    API endpoints for lite users.
    Uses ElasticSearch to always return lists of lite users, accessible to all
    authenticated users.
    """

    _meta = ViewSetMetadata(indexer=UsersIndexer)

    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of lite users (except autocomplete).
        """
        form = UserListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        es_query_filters = []

        _id = form.cleaned_data.get("id")
        if len(_id):
            es_query_filters += [{"terms": {"_id": _id}}]

        # pylint: disable=unexpected-keyword-arg
        es_response = ES_CLIENT.search(
            index=UsersIndexer.index_name,
            body={
                "query": {"bool": {"filter": es_query_filters}},
                "sort": [{"full_name": {"order": "asc"}}],
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
