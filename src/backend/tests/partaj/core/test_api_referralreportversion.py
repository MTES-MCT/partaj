from io import BytesIO

from django.test import TestCase
from django.test.client import encode_multipart, MULTIPART_CONTENT, BOUNDARY

from rest_framework.authtoken.models import Token

from partaj.core import factories, models

from utils.api_reportevent import api_send_report_message
from utils.mock_referral import mock_create_referral


class ReferralReportVersionApiTestCase(TestCase):
    """
    Test API routes related to ReferralReportVersion endpoints.
    """

    # CREATE TESTS
    def test_create_referralreport_version_by_multiple_user_types(self):
        """
        Save referral and send it.
        """
        referral_unit = factories.UnitFactory()
        asker = factories.UserFactory()
        unit_membership_member = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )
        unit_membership_member_token = Token.objects.get_or_create(
            user=unit_membership_member.user
        )[0]

        unit_membership_owner = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.OWNER
        )
        unit_membership_owner_token = Token.objects.get_or_create(
            user=unit_membership_owner.user
        )[0]

        report = factories.ReferralReportFactory()
        created_referral = mock_create_referral(
            models.ReferralState.RECEIVED, report, referral_unit, [asker]
        )

        # - Send a first report version by unit member
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name.docx"
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {unit_membership_member_token}",
        )

        # -> The version document is well created
        first_document = models.VersionDocument.objects.get(
            id=first_version_response.json()["document"]["id"]
        )
        self.assertEqual(first_version_response.status_code, 201)
        self.assertEqual(first_document.name, "the first attachment file name")
        self.assertEqual(first_document.size, 15)

        # -> The referral state goes to PROCESSING
        created_referral.refresh_from_db()
        self.assertEqual(created_referral.state, models.ReferralState.PROCESSING)

        # - Assert that a non-unit member can't send a version in the report
        asker_token = Token.objects.get_or_create(user=asker)[0]
        unauthorized_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {asker_token}",
        )
        self.assertEqual(unauthorized_version_response.status_code, 403)

        # The unit member notify unit owner sending
        # a notification into the report message
        api_send_report_message(
            self.client,
            report,
            unit_membership_member.user,
            [unit_membership_owner.user],
        )
        created_referral.refresh_from_db()
        # -> The referral state stay to PROCESSING
        self.assertEqual(created_referral.state, models.ReferralState.PROCESSING)

        # Assert that the unit owner can add a version even if the referral state is IN_VALIDATION
        second_attachment_file = BytesIO(b"attachment_file2")
        second_attachment_file.name = "the second attachment file name.csv"
        second_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (second_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {unit_membership_owner_token}",
        )
        second_document = models.VersionDocument.objects.get(
            id=second_version_response.json()["document"]["id"]
        )
        self.assertEqual(second_version_response.status_code, 201)
        self.assertEqual(second_document.name, "the second attachment file name")
        self.assertEqual(second_document.size, 16)

        # Get the report and check if everything is ok.
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {unit_membership_member_token}",
        )
        # -> First version is the last created
        self.assertEqual(
            response.json()["versions"][0]["document"]["name"],
            "the second attachment file name",
        )
        # -> Two version were created
        self.assertEqual(len(response.json()["versions"]), 2)
        self.assertEqual(response.status_code, 200)

    def test_create_referralreport_version_with_file_not_supported_format(self):
        """
        Save referral and send it.
        """
        referral_unit = factories.UnitFactory()
        asker = factories.UserFactory()
        unit_membership_member = factories.UnitMembershipFactory(
            unit=referral_unit, role=models.UnitMembershipRole.MEMBER
        )
        unit_membership_member_token = Token.objects.get_or_create(
            user=unit_membership_member.user
        )[0]

        report = factories.ReferralReportFactory()
        created_referral = mock_create_referral(
            models.ReferralState.RECEIVED, report, referral_unit, [asker]
        )

        # - Send a first report version by unit member
        first_attachment_file = BytesIO(b"attachment_file")
        first_attachment_file.name = "the first attachment file name.exe"
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {unit_membership_member_token}",
        )

        self.assertEqual(first_version_response.status_code, 415)
        self.assertEqual(first_version_response.json()["errors"][0], "Uploaded File cannot be in exe format.")
        self.assertEqual(first_version_response.json()["code"], "error_file_format_forbidden")

    def test_cant_create_version_if_referral_is_already_published(self):
        asker = factories.UserFactory()
        version_author_unit_member = factories.UserFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([asker.id])

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
        first_attachment_file.name = "the first attachment file name.pdf"
        last_version_author_unit_member_token = Token.objects.get_or_create(
            user=version_author_unit_member
        )[0]

        last_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}",
        )

        self.assertEqual(last_version_response.status_code, 201)

        """
        Publish the report with the last referral version author
        """
        self.client.post(
            f"/api/referralreports/{created_referral.report.id}/publish_report/",
            {
                "version": last_version_response.json()["id"],
                "comment": "Salut la compagnie",
            },
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}",
        )

        referral.refresh_from_db()
        self.assertEqual(referral.state, "answered")

        """
         Try to create a new version with the last author version
         after publishing
        """
        retry_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}",
        )
        self.assertEqual(retry_version_response.status_code, 403)

        """
         Try to update the a last referral report versions with the last author version
         after publishing
        """
        last_version_id = last_version_response.json()["id"]
        try_update_last_version_response = self.client.put(
            path="/api/referralreportversions/" + last_version_id + "/",
            data=encode_multipart(
                data={"files": (first_attachment_file,)}, boundary=BOUNDARY
            ),
            content_type=MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Token {last_version_author_unit_member_token}",
        )
        self.assertEqual(try_update_last_version_response.status_code, 403)

    # UPDATE TESTS
    def test_only_version_author_can_update_his_own_version(self):
        """
        Send referral, create a new version and test that only version author can update it.
        """
        asker = factories.UserFactory()
        first_author_unit_member = factories.UserFactory()
        second_author_unit_member = factories.UserFactory()
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([asker.id])

        referral.units.get().members.add(first_author_unit_member)
        referral.units.get().members.add(second_author_unit_member)
        form_data = {
            "question": "la question",
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(topic.id),
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
        second_attachment_file = BytesIO(b"attachment_file2")
        third_attachment_file = BytesIO(b"attachment_file_3")
        random_attachment_file = BytesIO(b"attachment_file__4")
        first_attachment_file.name = "the first attachment file name.docx"
        second_attachment_file.name = "the second attachment file name.pdf"
        third_attachment_file.name = "the third attachment file name.doc"
        random_attachment_file.name = "the random attachment file name.csv"

        first_unit_member_token = Token.objects.get_or_create(
            user=first_author_unit_member
        )[0]
        second_unit_member_token = Token.objects.get_or_create(
            user=second_author_unit_member
        )[0]

        """ Send a first referral report versions with the first unit membership."""
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {first_unit_member_token}",
        )

        """ Send a second referral report versions with the second unit membership."""
        second_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (second_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {second_unit_member_token}",
        )

        self.assertEqual(first_version_response.status_code, 201)
        self.assertEqual(second_version_response.status_code, 201)

        first_version_id = first_version_response.json()["id"]
        second_version_id = second_version_response.json()["id"]
        """
         Try to update the a first referral report versions with the author unit membership
         but no, he can't do that because there is a newer version available!
        """
        first_version_update_response = self.client.put(
            path="/api/referralreportversions/" + first_version_id + "/",
            data=encode_multipart(
                data={"files": (second_attachment_file,)}, boundary=BOUNDARY
            ),
            content_type=MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Token {first_unit_member_token}",
        )

        self.assertEqual(first_version_update_response.status_code, 403)

        """
         Try to update the a first referral report versions with the author unit membership
         and yes he can!
        """
        second_version_update_response = self.client.put(
            path="/api/referralreportversions/" + second_version_id + "/",
            data=encode_multipart(
                data={"files": (third_attachment_file,)}, boundary=BOUNDARY
            ),
            content_type=MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Token {second_unit_member_token}",
        )
        self.assertEqual(second_version_update_response.status_code, 200)

        """Get the report and check if the document is well updated."""
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {second_unit_member_token}",
        )

        self.assertEqual(
            response.json()["versions"][0]["document"]["name"],
            "the third attachment file name",
        )
        self.assertEqual(len(response.json()["versions"]), 2)
        self.assertEqual(response.status_code, 200)

    def test_version_author_cannot_update_version_with_not_supported_format_file(self):
        """
        Send referral, create a new version and test that only version author can update it.
        """
        asker = factories.UserFactory()
        first_author_unit_member = factories.UserFactory()
        second_author_unit_member = factories.UserFactory()
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([asker.id])

        referral.units.get().members.add(first_author_unit_member)
        referral.units.get().members.add(second_author_unit_member)
        form_data = {
            "question": "la question",
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(topic.id),
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
        second_attachment_file = BytesIO(b"attachment_file2")
        first_attachment_file.name = "the first attachment file name.docx"
        second_attachment_file.name = "the second attachment file name.exe"

        first_unit_member_token = Token.objects.get_or_create(
            user=first_author_unit_member
        )[0]

        """ Send a first referral report versions with the first unit membership."""
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {
                "report": str(created_referral.report.id),
                "files": (first_attachment_file,),
            },
            HTTP_AUTHORIZATION=f"Token {first_unit_member_token}",
        )

        self.assertEqual(first_version_response.status_code, 201)

        first_version_id = first_version_response.json()["id"]

        """
        Try to update the a first referral report versions with the author
        with not supported file format!
        """
        first_version_update_response = self.client.put(
            path="/api/referralreportversions/" + first_version_id + "/",
            data=encode_multipart(
                data={"files": (second_attachment_file,)}, boundary=BOUNDARY
            ),
            content_type=MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Token {first_unit_member_token}",
        )

        self.assertEqual(first_version_update_response.status_code, 415)
        self.assertEqual(first_version_update_response.json()["errors"][0], "Uploaded File cannot be in exe format.")
        self.assertEqual(first_version_update_response.json()["code"], "error_file_format_forbidden")
