import uuid

from django.test import TestCase

import arrow
from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReportMessageApiTestCase(TestCase):
    """
    Test API routes related to ReportMessage endpoints.
    """

    # CREATE TESTS
    def test_create_reportmessage_by_anonymous_user(self):
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

    def test_create_reportmessage_by_random_logged_in_user(self):
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

    def test_create_reportmessage_by_referral_linked_user(self):
        """
        A referral's linked user can create messages for their report.
        """
        # Create a unit with an owner, and admin and a member
        unit1 = factories.UnitFactory()
        unit_membership = factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.ADMIN
        )
        factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.MEMBER
        )
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.PROCESSING,
            report=report
        )
        referral.units.set([unit1])
        form_data = {
            "content": "some message",
            "report": str(report.id),
        }

        self.assertEqual(models.ReportMessage.objects.count(), 0)
        token = Token.objects.get_or_create(user=unit_membership.user)[0]
        response = self.client.post(
            "/api/reportmessages/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(models.ReportMessage.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(response.json()["user"]["id"], str(unit_membership.user.id))
        self.assertEqual(response.json()["report"], str(report.id))

    def test_create_reportmessage_by_referral_asker(self):
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

    def test_create_reportmessage_missing_report_in_payload(self):
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
    def test_list_reportmessage_for_referral_by_anonymous_user(self):
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

    def test_list_reportmessage_for_referral_by_random_logged_in_user(self):
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

    def test_list_reportmessage_for_referral_by_referral_linked_user(self):
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

    def test_list_reportmessage_for_report_by_referral_linked_unit_member(self):
        """
        A referral's linked unit member can list all referral messages linked to said referral.
        """
        user = factories.UserFactory()
        report = factories.ReferralReportFactory()
        referral = factories.ReferralFactory(report=report)
        referral.units.get().members.add(user)

        """
        Create report messages in a temporal order
        but the response will be reversly ordered
        """
        report_messages = [
            factories.ReportMessageFactory(
                created_at=arrow.utcnow().shift(days=-15).datetime,
                report=report,
            ),
            factories.ReportMessageFactory(
                created_at=arrow.utcnow().shift(days=-7).datetime,
                report=report,
            )
        ]

        response = self.client.get(
            f"/api/reportmessages/?report={report.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
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
                        "content": report_message.content,
                        "created_at": report_message.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "id": str(report_message.id),
                        "report": str(report.id),
                        "notifications": [],
                        "user": {
                            "first_name": report_message.user.first_name,
                            "id": str(report_message.user.id),
                            "last_name": report_message.user.last_name,
                            "unit_name": report_message.user.unit_name,
                        },
                    }
                    for report_message in reversed(report_messages)
                ],
            },
        )

    def test_list_referral_message_for_nonexistent_report(self):
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

    def test_list_referral_message_missing_report_param(self, ):
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
