import uuid
from io import BytesIO
from unittest import mock

from django.test import TestCase
from django.conf import settings

import arrow
from partaj.core.models import ReferralState
from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from utils.mock_referral import mock_create_referral
from utils.api_reportevent import api_send_report_message

REPORT_EVENT_API_PATH = "/api/reportevents/"
CONTACT_MAIL = "contact@partaj.beta.gouv.fr"


@mock.patch("partaj.core.email.Mailer.send")
class ReportEventApiTestCase(TestCase):
    """
    Test API routes related to ReportEvent endpoints.
    """

    # CREATE TESTS
    def test_create_reportevent_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot create referral messages.
        """
        report = factories.ReferralReportFactory()
        mock_create_referral(models.ReferralState.PROCESSING, report)

        self.assertEqual(models.ReportEvent.objects.count(), 0)

        response = self.client.post(
            REPORT_EVENT_API_PATH,
            data={"content": "some message", "report": str(report.id)},
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReportEvent.objects.count(), 0)
        mock_mailer_send.assert_not_called()

    def test_create_reportevent_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot create report messages for referrals to which
        they have no link.
        """
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        mock_create_referral(models.ReferralState.PROCESSING, report)

        self.assertEqual(models.ReportEvent.objects.count(), 0)
        response = self.client.post(
            REPORT_EVENT_API_PATH,
            {"content": "some message", "report": str(report.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReportEvent.objects.count(), 0)
        mock_mailer_send.assert_not_called()

    def test_create_reportevent_by_referral_unit_membership_without_notification(
        self, mock_mailer_send
    ):
        """
        A referral's linked user can create messages for their report.
        """
        # Create a unit with an admin and a member
        referral_unit = factories.UnitFactory()
        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING, report, referral_unit
        )

        unit_membership_sender = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.ADMIN
        )

        # Send a report message
        self.assertEqual(models.ReportEvent.objects.count(), 0)

        response = api_send_report_message(
            self.client, report, unit_membership_sender.user
        )
        referral.refresh_from_db()

        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(models.ReportEvent.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(
            response.json()["user"]["id"], str(unit_membership_sender.user.id)
        )
        self.assertEqual(response.json()["report"], str(report.id))
        self.assertEqual(mock_mailer_send.call_count, 0)
        self.assertEqual(referral.state, ReferralState.PROCESSING)
        mock_mailer_send.assert_not_called()

    def test_create_reportevent_by_referral_unit_membership_with_notif_to_member(
        self, mock_mailer_send
    ):
        """
        TESTS
        - A referral's unit user can create messages for their report.
        - A notification trigger a mail for each notified user
        - Referral's state does not change
        """
        # Create a unit with two members
        referral_unit = factories.UnitFactory()
        unit_membership_sender = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )

        unit_membership_notified = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )

        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING, report, referral_unit
        )

        self.assertEqual(models.ReportEvent.objects.count(), 0)

        response = api_send_report_message(
            self.client,
            report,
            unit_membership_sender.user,
            [unit_membership_notified.user],
        )
        referral.refresh_from_db()

        # Test report message POST response
        self.assertEqual(response.status_code, 201)
        self.assertEqual(models.ReportEvent.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(
            response.json()["user"]["id"], str(unit_membership_sender.user.id)
        )
        self.assertEqual(response.json()["report"], str(report.id))
        self.assertEqual(
            response.json()["notifications"],
            [
                {
                    "notified": {
                        "display_name": unit_membership_notified.user.get_notification_name()
                    }
                }
            ],
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "link_to_report": f"https://partaj/app/dashboard/referral-detail/{referral.id}/draft-answer",
                            "notifier": unit_membership_sender.user.first_name
                            + " "
                            + unit_membership_sender.user.last_name,
                            "preview": "some message",
                        },
                        "replyTo": {
                            "email": CONTACT_MAIL,
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
        # Test referral attributes
        self.assertEqual(referral.state, ReferralState.PROCESSING)

    def test_create_reportevent_by_referral_unit_membership_with_notif_to_granted_user_with_version(
        self, mock_mailer_send
    ):
        """
        A referral's unit user can create messages for their report.
        A notification trigger a mail for each notified user
        A notification to a granted user (i.e. ADMIN and OWNER roles) change
        referral state to TO_VALIDATE
        """
        # Create a unit with an admin and a member
        referral_unit = factories.UnitFactory()
        unit_membership_sender = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )

        unit_membership_notified = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.ADMIN
        )
        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING, report, referral_unit
        )

        self.assertEqual(models.ReportEvent.objects.count(), 0)
        response = api_send_report_message(
            self.client,
            report,
            unit_membership_sender.user,
            [unit_membership_notified.user],
        )
        referral.refresh_from_db()

        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(models.ReportEvent.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(
            response.json()["user"]["id"], str(unit_membership_sender.user.id)
        )
        self.assertEqual(response.json()["report"], str(report.id))
        self.assertEqual(
            response.json()["notifications"],
            [
                {
                    "notified": {
                        "display_name": unit_membership_notified.user.get_notification_name()
                    }
                }
            ],
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "link_to_report": f"https://partaj/app/dashboard/referral-detail/{referral.id}/draft-answer",
                            "notifier": unit_membership_sender.user.first_name
                            + " "
                            + unit_membership_sender.user.last_name,
                            "preview": "some message",
                        },
                        "replyTo": {
                            "email": CONTACT_MAIL,
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
        # Test referral attributes
        self.assertEqual(referral.state, ReferralState.PROCESSING)

    def test_create_reportevent_by_referral_unit_membership_with_notif_to_granted_user_without_version(
        self, mock_mailer_send
    ):
        """
        A referral's unit user can create messages for their report.
        A notification trigger a mail for each notified user
        A notification to a granted user (i.e. ADMIN and OWNER roles) change
        referral state to IN_VALIDATION
        """
        # Create a unit with an admin and a member
        referral_unit = factories.UnitFactory()
        unit_membership_sender = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )

        unit_membership_notified = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.ADMIN
        )
        report = factories.ReferralReportFactory()
        referral = mock_create_referral(
            models.ReferralState.PROCESSING, report, referral_unit
        )
        self.assertEqual(models.ReportEvent.objects.count(), 0)

        token = Token.objects.get_or_create(user=unit_membership_sender.user)[0]
        # Send a first version with the unit member
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "tieps.docx"
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(referral.report.id), "files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(models.ReportEvent.objects.count(), 1)
        self.assertEqual(first_version_response.status_code, 201)

        # Then send a notification to the unit admin
        response = api_send_report_message(
            self.client,
            report,
            unit_membership_sender.user,
            [unit_membership_notified.user],
        )
        referral.refresh_from_db()
        self.assertEqual(models.ReportEvent.objects.count(), 2)

        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(
            response.json()["user"]["id"], str(unit_membership_sender.user.id)
        )
        self.assertEqual(response.json()["report"], str(report.id))
        self.assertEqual(
            response.json()["notifications"],
            [
                {
                    "notified": {
                        "display_name": unit_membership_notified.user.get_notification_name()
                    }
                }
            ],
        )
        self.assertEqual(mock_mailer_send.call_count, 1)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "link_to_report": f"https://partaj/app/dashboard/referral-detail/{referral.id}/draft-answer",
                            "notifier": unit_membership_sender.user.first_name
                            + " "
                            + unit_membership_sender.user.last_name,
                            "preview": "some message",
                        },
                        "replyTo": {
                            "email": CONTACT_MAIL,
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
        # Test referral attributes
        self.assertEqual(referral.state, ReferralState.IN_VALIDATION)

    def test_create_reportevent_by_referral_asker(self, _):
        """
        A referral's linked user can create messages for their report.
        """
        # Create a unit with an owner, and admin and a member
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.PROCESSING, report=report
        )
        referral.users.set([user.id])
        form_data = {
            "content": "some message",
            "report": str(report.id),
        }

        self.assertEqual(models.ReportEvent.objects.count(), 0)
        token = Token.objects.get_or_create(user=user)[0]
        response = self.client.post(
            REPORT_EVENT_API_PATH,
            form_data,
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReportEvent.objects.count(), 0)

    def test_create_reportevent_missing_report_in_payload(self, _):
        """
        When the report property is omitted in the payload, requests fail with a 404
        error as we cannot even determine the user has permission to create a message.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)

        self.assertEqual(models.ReportEvent.objects.count(), 0)
        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.post(
            REPORT_EVENT_API_PATH,
            {"content": "some message"},
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(models.ReportEvent.objects.count(), 0)

    # LIST TESTS
    def test_list_reportevent_for_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot make list requests for referral messages.
        """
        report = factories.ReferralReportFactory()
        factories.ReferralFactory(report=report)
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        response = self.client.get(
            f"/api/reportevents/?report={report.id}",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_reportevent_for_referral_by_random_logged_in_user(self, _):
        """
        Random logged-in users cannot make list requests for referral messages for referrals
        to which they have no link
        """
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        factories.ReferralFactory(report=report)
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        response = self.client.get(
            f"/api/reportevents/?report={report.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_reportevent_for_referral_by_referral_linked_user(self, _):
        """
        A referral's linked user can list all referral messages linked to said referral.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )

        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.get(
            f"/api/reportevents/?report={report.id}",
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_list_reportevent_for_report_by_referral_linked_unit_member(self, _):
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
        first_message = factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
            user=user_unit_member_sender,
        )

        second_message = factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
            user=user_unit_member_sender,
        )

        notification = factories.NotificationFactory(
            item_content_object=first_message,
            notifier=user_unit_member_sender,
            notified=user_unit_member_notified,
            preview=first_message.content,
        )

        response = self.client.get(
            f"/api/reportevents/?report={report.id}",
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
                        "is_granted_user_notified": False,
                        "notifications": [],
                        "user": {
                            "first_name": second_message.user.first_name,
                            "id": str(second_message.user.id),
                            "last_name": second_message.user.last_name,
                            "unit_name": second_message.user.unit_name,
                        },
                        "metadata": None,
                        "version": None,
                        "verb": "message",
                    },
                    {
                        "content": first_message.content,
                        "created_at": first_message.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "id": str(first_message.id),
                        "report": str(report.id),
                        "is_granted_user_notified": False,
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
                        "metadata": None,
                        "version": None,
                        "verb": "message",
                    },
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
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        token = Token.objects.get_or_create(user=referral.users.first())[0]
        random_report_id = uuid.uuid4()
        response = self.client.get(
            f"/api/reportevents/?report={random_report_id}",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_referral_message_missing_report_param(self, _):
        """
        List requests for referral messages without a referral param are not supported.
        """
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            report=report,
        )
        factories.ReportEventFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            report=report,
        )

        token = Token.objects.get_or_create(user=referral.users.first())[0]
        response = self.client.get(
            REPORT_EVENT_API_PATH,
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 404)
