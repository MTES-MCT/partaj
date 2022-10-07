"""
Report message related API endpoints.
"""
from django.http import Http404

from rest_framework import viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.utils import json

from partaj.core.models import UnitMembershipRole

from .. import models
from ..forms import ReportMessageForm
from ..serializers import ReportMessageSerializer
from . import User, permissions


class UserIsReferralUnitMember(BasePermission):
    """
    Permission class to authorize unit members on API routes and/or actions related
    to report linked to their unit.
    """

    def has_permission(self, request, view):
        report_id = request.data.get("report") or request.query_params.get("report")

        try:
            report = models.ReferralReport.objects.get(id=report_id)
        except models.ReferralReport.DoesNotExist as error:
            raise Http404(f"Report {request.data.get('report')} not found") from error
        return (
            request.user.is_authenticated
            and report.referral.units.filter(members__id=request.user.id).exists()
        )


class ReportMessageViewSet(viewsets.ModelViewSet):
    """
    API endpoints for report messages.
    """

    permission_classes = [permissions.NotAllowed]
    queryset = models.ReportMessage.objects.all()
    serializer_class = ReportMessageSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action in ["list"]:
            permission_classes = [UserIsReferralUnitMember]
        elif self.action in ["create"]:
            permission_classes = [UserIsReferralUnitMember]
        else:
            try:
                permission_classes = getattr(self, self.action).kwargs.get(
                    "permission_classes"
                )
            except AttributeError:
                permission_classes = self.permission_classes

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Create a new report message as the client issues a POST on the reportmessages endpoint.
        """

        try:
            report = models.ReferralReport.objects.get(id=request.data.get("report"))
        except models.ReferralReport.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [f"Report f{request.data.get('report')} does not exist."]
                },
            )

        content = request.data.get("content") or ""
        form = ReportMessageForm(
            {
                "content": content,
                "report": report,
                "user": request.user,
            }
        )

        if not form.is_valid():
            return Response(status=400, data=form.errors)

        # Create the referral message from incoming data, and attachment instances for the files
        report_message = form.save()

        if request.data.get("notifications"):
            user_ids = json.loads(request.data.get("notifications"))
            users_to_notify = User.objects.filter(id__in=user_ids)
            is_granted_user_notified = False
            for referral_unit in report.referral.units.all():
                granted_users = [
                    membership.user
                    for membership in referral_unit.get_memberships().filter(
                        role__in=[UnitMembershipRole.ADMIN, UnitMembershipRole.OWNER]
                    )
                ]

                for user_to_notify in users_to_notify:
                    if user_to_notify in granted_users:
                        is_granted_user_notified = True
                    notification = models.Notification.objects.create(
                        notification_type=models.Notification.REPORT_MESSAGE,
                        notifier=request.user,
                        notified=user_to_notify,
                        preview=content,
                        item_content_object=report_message,
                    )

                    notification.notify(report.referral)
            if is_granted_user_notified:
                report.referral.notify_granted_user()
                report.referral.save()

            report_message.is_granted_user_notified = is_granted_user_notified

        return Response(status=201, data=ReportMessageSerializer(report_message).data)

    def list(self, request, *args, **kwargs):
        """
        Return a list of referral messages. The list is always filtered by report as there's
        no point in shuffling together messages that belong to different referrals.
        """
        queryset = self.get_queryset().filter(
            report__id=request.query_params.get("report")
        )

        page = self.paginate_queryset(queryset.order_by("-created_at"))

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset.order_by("-created_at"), many=True)
        return Response(serializer.data)