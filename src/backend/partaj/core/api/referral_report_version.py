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


class UserIsVersionAuthor(BasePermission):
    """
    Permission class to authorize a referral report version's author on API routes
    for referral report version.
    """

    def has_permission(self, request, view):
        version = view.get_object()

        return (
            request.user.is_authenticated and version.created_by.id == request.user.id
        )


class UserIsReferralUnitMembership(BasePermission):
    """
    Permission class to authorize a referral report version's author on API routes

    NB: we're using `view.get_referralreport()` instead of `view.get_object()` as
    we expect this to be implemented by ViewSets using this permission for
    objects with a relation to a referral.
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

        if self.action == "create":
            permission_classes = [UserIsReferralUnitMembership]
        elif self.action == "update":
            permission_classes = [UserIsVersionAuthor]
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
        Helper: get the related referralreport, return an error if it does not exist.
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

        # Last version author can't add a new version
        if referralreport.is_last_author(request.user):
            return Response(
                status=403,
                data={"errors": ["Last version author can't create a new version."]},
            )

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

    def update(self, request, *args, **kwargs):
        """Update an existing version."""
        version = self.get_object()
        if not version.report.is_last_author(request.user):
            return Response(
                status=403,
                data={"errors": ["Cannot update non last version."]},
            )

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
        version.document.update_file(file=file)

        return Response(
            status=200,
            data=ReferralReportVersionSerializer(version).data,
        )
