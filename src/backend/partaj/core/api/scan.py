"""
Referral answer attachment related API endpoints.
"""
from partaj.core.api import NotAllowed
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
import requests


class ScanViewSet(viewsets.ViewSet):
    """
    API endpoints for file scanner.
    """

    permission_classes = [NotAllowed]

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        try:
            permission_classes = getattr(self, self.action).kwargs.get(
                "permission_classes"
            )
            return [permission() for permission in permission_classes]
        except AttributeError:
            permission_classes = self.permission_classes


    @action(
        detail=False,
        methods=["POST"],
        permission_classes=[],
    )
    # pylint: disable=invalid-name
    def file(self, request):
        if len(request.FILES) != 1:  # noqa
            return Response(data="There is no file attached to the request", status=200)

        file = request.FILES['files'].file.getvalue()

        try:
            response = requests.post(
                'https://partaj-filescanner-staging.osc-fr1.scalingo.io/api/scan/file/',
                files={'file': file}
            )

            return Response(data=response.json())
        except Exception as e:
            return Response(data={

            })
