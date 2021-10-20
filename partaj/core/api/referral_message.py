"""
Referral message related API endpoints.
"""
from rest_framework import viewsets
from rest_framework.response import Response

from .. import models
from ..email import Mailer
from ..forms import ReferralMessageForm
from ..serializers import ReferralMessageSerializer
from . import permissions


class ReferralMessageViewSet(viewsets.ModelViewSet):
    """
    API endpoints for referral messages.
    """

    permission_classes = [permissions.NotAllowed]
    queryset = models.ReferralMessage.objects.all()
    serializer_class = ReferralMessageSerializer

    def get_permissions(self):
        """
        Manage permissions for default methods separately, delegating to @action defined
        permissions for other actions.
        """
        if self.action in ["create", "list"]:
            permission_classes = [
                permissions.IsRequestReferralLinkedUser
                | permissions.IsRequestReferralLinkedUnitMember
            ]
        elif self.action in ["retrieve"]:
            permission_classes = [
                permissions.IsLinkedReferralLinkedUser
                | permissions.IsLinkedReferralLinkedUnitMember
            ]
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
        Create a new referral message as the client issues a POST on the referralmessages endpoint.
        """

        try:
            referral = models.Referral.objects.get(id=request.data.get("referral"))
        except models.Referral.DoesNotExist:
            return Response(
                status=400,
                data={
                    "errors": [
                        f"Referral f{request.data.get('referral')} does not exist."
                    ]
                },
            )

        form = ReferralMessageForm(
            {
                "content": request.data.get("content") or "",
                "referral": referral,
                "user": request.user,
            },
            request.FILES,
        )

        if not form.is_valid():
            return Response(status=400, data=form.errors)

        # Create the referral message from incoming data, and attachment instances for the files
        referral_message = form.save()
        files = request.FILES.getlist("files")
        for file in files:
            referral_message_attachment = models.ReferralMessageAttachment(
                file=file, referral_message=referral_message
            )
            referral_message_attachment.save()

        # Define all users who need to receive emails for this referral
        targets = [referral.user]
        if referral.assignees.count() > 0:
            targets = targets + list(referral.assignees.all())
        else:
            for unit in referral.units.all():
                targets = targets + [
                    membership.user
                    for membership in unit.get_memberships().filter(
                        role=models.UnitMembershipRole.OWNER
                    )
                ]

        # The user who sent the message should not receive an email
        targets = [target for target in targets if target != referral_message.user]

        # Iterate over targets
        for target in targets:
            if target == referral.user:
                Mailer.send_new_message_for_requester(referral, referral_message)
            else:
                Mailer.send_new_message_for_unit_member(
                    target, referral, referral_message
                )

        return Response(
            status=201, data=ReferralMessageSerializer(referral_message).data
        )

    def list(self, request, *args, **kwargs):
        """
        Return a list of referral messages. The list is always filtered by referral as there's
        no point in shuffling together messages that belong to different referrals.
        """

        queryset = self.get_queryset().filter(
            referral__id=request.query_params.get("referral")
        )

        page = self.paginate_queryset(queryset.order_by("created_at"))
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset.order_by("created_at"), many=True)
        return Response(serializer.data)
