from io import BytesIO
from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from partaj.core.models import ReferralNoteStatus
from utils.mail_sender_args import get_referral_answered_requesters, \
    get_referral_answered_created_by, get_referral_answered_unit_owners


@mock.patch("partaj.core.email.Mailer.send")
class ReferralReportApiTestCase(TestCase):
    """
    Test API routes related to ReferralReport endpoints.
    """

    # API publish_report TESTS
    def test_referralreport_publish_report_by_linked_unit_user(self, mock_mailer_send):
        """
        Test
        - Non last version author unit members can nevertheless publish a report
        - 2 mails are sent during publishment
        - Referral changes its state to ANSWERED
        - Comment, publication date, final_version are saved into the report
        - Note is created with received status, referral title as object and no R unit duplication
        """
        requester_1 = factories.UserFactory(unit_name='tieps')
        requester_2 = factories.UserFactory(unit_name='tieps')
        random_unit_member = factories.UserFactory()
        version_author_unit_member = factories.UserFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT,
            title="Custom referral title"
        )
        referral.users.set([requester_1.id, requester_2.id])

        referral.units.get().members.add(random_unit_member)
        referral.units.get().members.add(version_author_unit_member)

        unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        form_data = {
            "question": "la question",
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(referral.topic.id),
            "urgency_level": str(urgency_level.id),
            "urgency_explanation": "la justification de l'urgence",
        }

        asker_token = Token.objects.get_or_create(user=requester_1)[0]
        self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {asker_token}",
        )
        created_referral = models.Referral.objects.get(id=referral.id)

        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"
        random_unit_member_token = Token.objects.get_or_create(user=random_unit_member)[
            0
        ]
        last_version_author_unit_member_token = Token.objects.get_or_create(
            user=version_author_unit_member
        )[0]

        """ Send two versions with two differents unit memberships."""
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}",
        )
        self.assertEqual(first_version_response.status_code, 201)

        last_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
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
                "comment": "Salut la compagnie",
            },
            HTTP_AUTHORIZATION=f"Token {asker_token}",
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
                "comment": "Salut la compagnie",
            },
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}",
        )

        self.assertEqual(
            unauthorized_publish_non_last_version_response.status_code, 403
        )

        """ Add an attachment to the report """
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name"

        report_attachment_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/add_attachment/",
            {"files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}",
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
                "comment": "Salut la compagnie",
            },
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}",
        )
        self.assertEqual(publish_report_response.status_code, 201)
        referral.refresh_from_db()
        # Freshly created Notes are created with received default status
        self.assertEqual(referral.note.state, ReferralNoteStatus.RECEIVED)
        # Custom referral title (.title) if exists is displayed in the knowledge
        # database instead of requester title (.object)
        self.assertEqual(referral.note.object, referral.title)

        # Assert dupliactions are removed for requesters_unit_names (two requesters
        # in the same "company service" for this referral)
        self.assertEqual(referral.note.requesters_unit_names, ["tieps"])

        """
        Try to republish the report in same previous authorized conditions
        FORBIDDEN: Republishing a report is not allowed
        """
        retry_publish_report_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/publish_report/",
            {
                "version": last_version_response.json()["id"],
                "comment": "Salut la compagnie",
            },
            HTTP_AUTHORIZATION=f"Token {random_unit_member_token}",
        )
        self.assertEqual(retry_publish_report_response.status_code, 403)

        self.assertEqual(
            publish_report_response.json()["final_version"]["id"],
            last_version_response.json()["id"],
        )
        self.assertEqual(
            publish_report_response.json()["last_version"]["id"],
            last_version_response.json()["id"],
        )
        self.assertEqual(
            publish_report_response.json()["comment"], "Salut la compagnie"
        )
        self.assertIsNotNone(publish_report_response.json()["published_at"])
        self.assertIsNotNone(publish_report_response.json()["attachments"])
        referral.refresh_from_db()
        self.assertEqual(referral.state, "answered")

        # REFERRAL_SAVED_TEMPLATE_ID x1 REFERRAL_RECEIVED_TEMPLATE_ID x1 (Not tested)
        # REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID x2
        # REFERRAL_ANSWERED_UNIT_OWNER_TEMPLATE_ID x1
        # REFERRAL_ANSWERED_CREATED_BY_TEMPLATE_ID x1
        self.assertEqual(mock_mailer_send.call_count, 6)

        self.maxDiff = None

        mailer_send_args = [call[0] for call in mock_mailer_send.call_args_list]

        self.assertTrue(
            get_referral_answered_requesters(answered_by=random_unit_member, referral=referral, requester=requester_1)
            in mailer_send_args
        )

        self.assertTrue(
            get_referral_answered_requesters(answered_by=random_unit_member, referral=referral, requester=requester_2)
            in mailer_send_args
        )

        self.assertTrue(
            get_referral_answered_unit_owners(answered_by=random_unit_member, referral=referral, owner=unit_owner)
            in mailer_send_args
        )

        self.assertTrue(
            get_referral_answered_created_by(version_by=version_author_unit_member, referral=referral)
            in mailer_send_args
        )
