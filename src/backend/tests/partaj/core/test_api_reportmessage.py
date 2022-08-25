import json
import uuid
from unittest import mock

from django.test import TestCase
from django.conf import settings

import arrow
from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReportMessageApiTestCase(TestCase):
    """
    Test API routes related to ReportMessage endpoints.
    """

    # CREATE TESTS
    def test_create_reportmessage_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot create referral messages.
        """
        report = factories.ReferralReportFactory()
        factories.ReferralFactory(
            state=models.ReferralState.PROCESSING,
            report=report
        )

        self.assertEqual(models.ReportMessage.objects.count(), 0)
        response = self.client.post(
            "/api/reportmessages/",
            {"content": "some message", "report": str(report.id)},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReportMessage.objects.count(), 0)
        mock_mailer_send.assert_not_called()

    def test_create_reportmessage_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot create report messages for referrals to which
        they have no link.
        """
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        factories.ReferralFactory(
            state=models.ReferralState.PROCESSING,
            report=report
        )

        self.assertEqual(models.ReportMessage.objects.count(), 0)
        response = self.client.post(
            "/api/reportmessages/",
            {"content": "some message", "report": str(report.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReportMessage.objects.count(), 0)
        mock_mailer_send.assert_not_called()

    def test_create_reportmessage_by_referral_unit_membership(self, mock_mailer_send):
        """
        A referral's linked user can create messages for their report.
        """
        # Create a unit with an admin and a member
        referral_unit = factories.UnitFactory()
        unit_membership_sender = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.ADMIN
        )

        unit_membership_notified = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.PROCESSING,
            report=report
        )
        referral.units.set([referral_unit])
        form_data = {
            "content": "some message",
            "report": str(report.id),
            "notifications": json.dumps([str(unit_membership_notified.user.id)])
        }

        self.assertEqual(models.ReportMessage.objects.count(), 0)
        token = Token.objects.get_or_create(user=unit_membership_sender.user)[0]
        response = self.client.post(
            "/api/reportmessages/",
            form_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(models.ReportMessage.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(response.json()["user"]["id"], str(unit_membership_sender.user.id))
        self.assertEqual(response.json()["report"], str(report.id))
        self.assertEqual(response.json()["notifications"], [{"notified": {"display_name": unit_membership_notified.user.get_notification_name()}}])
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "link_to_report": f"https://partaj/app/dashboard/referral-detail/{referral.id}/draft-answer",
                            "notifier": unit_membership_sender.user.first_name + " " + unit_membership_sender.user.last_name,
                            "preview": "some message",
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REPORT_MESSAGE_NOTIFICATION_TEMPLATE_ID"
                        ],
                        "to": [{"email": unit_membership_notified.user.email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_create_reportmessage_by_referral_asker(self, mock_mailer_send):
        """
        A referral's linked user can create messages for their report.
        """
        # Create a unit with an owner, and admin and a member
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.PROCESSING,
            report=report
        )
        referral.users.set([user.id])
        form_data = {
            "content": "some message",
            "report": str(report.id),
        }

        self.assertEqual(models.ReportMessage.objects.count(), 0)
        token = Token.objects.get_or_create(user=user)[0]
        response = self.client.post(
            "/api/reportmessages/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReportMessage.objects.count(), 0)

    def test_create_reportmessage_missing_report_in_payload(self, mock_mailer_send):
        """
        When the report property is omitted in the payload, requests fail with a 404
        error as we cannot even determine the user has permission to create a message.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)

        self.assertEqual(models.ReportMessage.objects.count(), 0)
        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.post(
            "/api/reportmessages/",
            {"content": "some message"},
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(models.ReportMessage.objects.count(), 0)

    # LIST TESTS
    def test_list_reportmessage_for_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot make list requests for referral messages.
        """
        report = factories.ReferralReportFactory()
        factories.ReferralFactory(report=report)
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        response = self.client.get(
            f"/api/reportmessages/?report={report.id}",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_reportmessage_for_referral_by_random_logged_in_user(self, _):
        """
        Random logged-in users cannot make list requests for referral messages for referrals
        to which they have no link
        """
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        factories.ReferralFactory(report=report)
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        response = self.client.get(
            f"/api/reportmessages/?report={report.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_reportmessage_for_referral_by_referral_linked_user(self, _):
        """
        A referral's linked user can list all referral messages linked to said referral.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )

        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.get(
            f"/api/reportmessages/?report={report.id}",
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_list_reportmessage_for_report_by_referral_linked_unit_member(self, _):
        """
        A referral's linked unit member can list all referral messages linked to said referral.
        """
        user_unit_member = factories.UserFactory()
        user_unit_member_sender = factories.UserFactory()
        user_unit_member_notified = factories.UserFactory()

        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        referral.units.get().members.add(user_unit_member)
        referral.units.get().members.add(user_unit_member_sender)
        referral.units.get().members.add(user_unit_member_notified)

        """
        Create report messages in a temporal order
        but the response will be reversely ordered
        """
        first_message = factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
            user=user_unit_member_sender
        )

        second_message = factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
            user=user_unit_member_sender
        )

        notification = factories.NotificationFactory(
            item_content_object=first_message,
            notifier=user_unit_member_sender,
            notified=user_unit_member_notified,
            preview=first_message.content
        )

        response = self.client.get(
            f"/api/reportmessages/?report={report.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user_unit_member)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "content": second_message.content,
                        "created_at": second_message.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "id": str(second_message.id),
                        "report": str(report.id),
                        "notifications": [],
                        "user": {
                            "first_name": second_message.user.first_name,
                            "id": str(second_message.user.id),
                            "last_name": second_message.user.last_name,
                            "unit_name": second_message.user.unit_name,
                        },
                    },
                    {
                        "content": first_message.content,
                        "created_at": first_message.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "id": str(first_message.id),
                        "report": str(report.id),
                        "notifications": [
                            {
                                "notified": {
                                    "display_name": notification.notified.get_notification_name()
                                }
                            }
                        ],
                        "user": {
                            "first_name": first_message.user.first_name,
                            "id": str(first_message.user.id),
                            "last_name": first_message.user.last_name,
                            "unit_name": first_message.user.unit_name,
                        },
                    }
                ],
            },
        )

    def test_list_referral_message_for_nonexistent_report(self, _):
        """
        The user could access one referral's messages, but passes an ID that matches no referral,
        receiving an error response.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        token = Token.objects.get_or_create(user=referral.users.first())[0]
        random_report_id = uuid.uuid4()
        response = self.client.get(
            f"/api/reportmessages/?report={random_report_id}",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_referral_message_missing_report_param(self, _):
        """
        List requests for referral messages without a referral param are not supported.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.get(
            "/api/reportmessages/",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 404)
