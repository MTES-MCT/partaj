"""
Generic API utils and mixins that can be reused throughout various ViewSets.
"""

from rest_framework.decorators import action
from rest_framework.response import Response

from ..indexers import ES_CLIENT


class ViewSetMetadata:
    """
    "Meta" class intended to be used as an attribute on ViewSets to provide a common set of
    meta attributes, like the Django `class Meta` on eg. models.
    """

    def __init__(self, indexer):
        """
        Set the required attributes passed from the call site. Currently this only includes
        the ViewSet's corresponding indexer.
        """
        self.indexer = indexer


class AutocompleteMixin:
    """
    Add a `/{resource}/autocomplete` route on a ViewSet enabling clients to make autocompletion
    requests using the specific fields & queries in ElasticSearch, as defined in the relevant
    resource's indexer.
    """

    # pylint: disable=unused-argument
    @action(detail=False)
    def autocomplete(self, request):
        """
        Use the "autocomplete" field on the object mapping & objects to provide autocomplete
        functionality through an API endpoint.
        """
        # This mixin is intended to be used on ViewSets. It requires an _indexer attribute holding
        # the relevant indexer
        indexer = self._meta.indexer

        # Make sure we return the proper error code instead so the frontend can be debugged
        # as well if necessary.
        try:
            query = request.query_params["query"]
        except KeyError:
            return Response(
                status=400,
                data={
                    "errors": [
                        (
                            'Missing autocomplete "query" for request '
                            f"to {self._meta.indexer.index_name}."
                        )
                    ]
                },
            )

        # Query our specific ES completion field
        autocomplete_query_response = ES_CLIENT.search(
            index=indexer.index_name,
            body={
                "suggest": {
                    "objects": {
                        "prefix": query,
                        "completion": {"field": "autocomplete"},
                    }
                }
            },
        )

        # Build a response array from the list of completion options
        return Response(
            {
                "count": len(
                    autocomplete_query_response["suggest"]["objects"][0]["options"]
                ),
                "results": [
                    option["_source"]["_lite"]
                    for option in autocomplete_query_response["suggest"]["objects"][0][
                        "options"
                    ]
                ],
            }
        )
