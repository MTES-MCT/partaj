from io import BytesIO
from unittest import mock

from django.conf import settings
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralReportApiTestCase(TestCase):
    """
    Test API routes related to ReferralReport endpoints.
    """

    # API publish_report TESTS
    def test_referralreport_publish_report_by_linked_unit_user(self,
                                                               mock_mailer_send):
        """
        Test
        - non last version author unit members can nevertheless publish a report
        - 2 mails are sended during publishment
        - Referral change its state to ANSWERED
        - Comment, publication date, final_version are saved into the report
        """
        asker = factories.UserFactory()
        random_unit_member = factories.UserFactory()
        version_author_unit_member = factories.UserFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([asker.id])

        referral.units.get().members.add(random_unit_member)
        referral.units.get().members.add(version_author_unit_member)

        form_data = {
            "question": "la question",
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(referral.topic.id),
            "urgency_level": str(urgency_level.id),
            "urgency_explanation": "la justification de l'urgence",
        }

        asker_token = Token.objects.get_or_create(user=asker)[0]
        self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {asker_token}",
        )
        created_referral = models.Referral.objects.get(id=referral.id)

        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"
        random_unit_member_token = \
            Token.objects.get_or_create(user=random_unit_member)[0]
        last_version_author_unit_member_token = \
            Token.objects.get_or_create(user=version_author_unit_member)[0]

        """ Send two versions with two differents unit memberships."""
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id),
             "files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}",
        )
        self.assertEqual(first_version_response.status_code, 201)

        last_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id),
             "files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}",
        )

        self.assertEqual(first_version_response.status_code, 201)
        self.assertEqual(last_version_response.status_code, 201)

        """
        Try to publish the report with the referral asker
        FORBIDDEN: only referral unit members can publish the report
        """
        unauthorized_publish_report_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/publish_report/",
            {
                "version": last_version_response.json()["id"],
                "comment": "Salut la compagnie"
            },
            HTTP_AUTHORIZATION=f"Token {asker_token}"
        )
        self.assertEqual(unauthorized_publish_report_response.status_code, 403)

        """
        Try to publish the report with unit member and the non last version
        FORBIDDEN: A report can be published only with the last version
        """
        unauthorized_publish_non_last_version_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/publish_report/",
            {
                "version": first_version_response.json()["id"],
                "comment": "Salut la compagnie"
            },
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}"
        )

        self.assertEqual(
            unauthorized_publish_non_last_version_response.status_code, 403)

        """ Add an attachment to the report """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"

        report_attachment_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/add_attachment/",
            {"files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}"
        )
        self.assertEqual(report_attachment_response.status_code, 201)

        """
        Publish the report with the last referral version author
        ALLOWED
        """
        publish_report_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/publish_report/",
            {
                "version": last_version_response.json()["id"],
                "comment": "Salut la compagnie"
            },
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}"
        )

        """
        Try to republish the report in same previous authorized conditions
        FORBIDDEN: Republishing a report is not allowed
        """
        retry_publish_report_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/publish_report/",
            {
                "version": last_version_response.json()["id"],
                "comment": "Salut la compagnie"
            },
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}"
        )
        self.assertEqual(retry_publish_report_response.status_code, 403)

        self.assertEqual(publish_report_response.status_code, 201)
        self.assertEqual(publish_report_response.json()["final_version"]["id"],
                         last_version_response.json()["id"])
        self.assertEqual(publish_report_response.json()["last_version"]["id"],
                         last_version_response.json()["id"])
        self.assertEqual(publish_report_response.json()["comment"],
                         "Salut la compagnie")
        self.assertIsNotNone(publish_report_response.json()["published_at"])
        self.assertIsNotNone(publish_report_response.json()["attachments"])
        referral.refresh_from_db()
        self.assertEqual(referral.state, "answered")
        self.assertEqual(mock_mailer_send.call_count, 2)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "answer_sender": random_unit_member.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}/answer",
                    "referral_topic_name": referral.topic.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID"
                ],
                "to": [{"email": referral.users.first().email}],
            }
        )
