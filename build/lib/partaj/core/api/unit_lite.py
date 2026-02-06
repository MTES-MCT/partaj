"""
Topic lite related API endpoints.
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from ..forms import UnitListQueryForm
from ..indexers import ES_CLIENT, UnitsIndexer
from .common import AutocompleteMixin, ViewSetMetadata


class UnitLiteViewSet(AutocompleteMixin, GenericViewSet):
    """
    API endpoints for lite units.
    Uses ElasticSearch to always return lists of lite units, accessible to all
    authenticated users.
    """

    _meta = ViewSetMetadata(indexer=UnitsIndexer)

    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Handle requests for lists of lite units (except autocomplete).
        """
        form = UnitListQueryForm(data=self.request.query_params)
        if not form.is_valid():
            return Response(status=400, data={"errors": form.errors})

        es_query_filters = []

        _id = form.cleaned_data.get("id")
        if len(_id):
            es_query_filters += [{"terms": {"_id": _id}}]

        # pylint: disable=unexpected-keyword-arg
        es_response = ES_CLIENT.search(
            index=UnitsIndexer.index_name,
            body={
                "query": {"bool": {"filter": es_query_filters}},
                "sort": [{"name": {"order": "asc"}}],
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
