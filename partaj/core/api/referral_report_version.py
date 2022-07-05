"""
Referral answer attachment related API endpoints.
"""
from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from .. import models
from ..serializers import ReferralReportVersionSerializer
from .permissions import NotAllowed


class UserIsRelatedReferralAnswerAuthor(BasePermission):
    """
    Permission class to authorize a referral answer's author on API routes and/or actions for
    objects with a relation to the referral answer they created.

    NB: we're using `view.get_referralanswer()` instead of `view.get_object()` as we expect this to
    be implemented by ViewSets using this permission for objects with a relation to a referral.
    """

    def has_permission(self, request, view):
        report = view.get_referralreport(request)

        return (
            request.user.is_authenticated
            and report.referral.units.filter(members__id=request.user.id).exists()
        )


class ReferralReportVersionViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral report versions.
    """

    permission_classes = [NotAllowed]
    queryset = models.ReferralReportVersion.objects.all()
    serializer_class = ReferralReportVersionSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action in ["create"]:
            permission_classes = [UserIsRelatedReferralAnswerAuthor]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def get_referralreport(self, request):
        """
        Helper: get the related referralanswer, return an error if it does not exist.
        """
        report_id = request.data.get("report") or request.query_params.get("report")
        try:
            referralreport = models.ReferralReport.objects.get(id=report_id)
        except models.ReferralReport.DoesNotExist as error:
            raise Http404(
                f"ReferralReport {request.data.get('report')} not found"
            ) from error

        return referralreport

    def create(self, request, *args, **kwargs):
        """
        Let users create new referral report version, processing the file itself along with
        its metadata to create a VersionDocument instance.
        """
        # Make sure the referral report exists and return an error otherwise.
        referralreport = self.get_referralreport(request)

        if len(request.FILES.getlist("files")) > 1:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral version documents cannot be created with more than one file."
                    ]
                },
            )

        try:
            file = request.FILES.getlist("files")[0]
        except IndexError:
            return Response(
                status=400,
                data={
                    "errors": [
                        "Referral report version document cannot be created without a file."
                    ]
                },
            )

        document = models.VersionDocument.objects.create(
            file=file,
        )

        version = models.ReferralReportVersion.objects.create(
            report=referralreport, created_by=request.user, document=document
        )
        referralreport.referral.add_version(version)
        referralreport.referral.save()

        return Response(
            status=201,
            data=ReferralReportVersionSerializer(version).data,
        )
