from io import BytesIO

from django.test import TestCase
from django.test.client import encode_multipart, MULTIPART_CONTENT, BOUNDARY

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralReportVersionApiTestCase(TestCase):
    """
    Test API routes related to ReferralReportVersion endpoints.
    """

    # CREATE TESTS
    def test_get_referralreport_by_linked_unit_user(self):
        """
        Save referral and send it.
        """
        asker = factories.UserFactory()
        unit_member = factories.UserFactory()
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([asker.id])

        referral.units.get().members.add(unit_member)
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
        first_attachment_file.name = "the first attachment file name"
        second_attachment_file.name = "the second attachment file name"

        unit_member_token = Token.objects.get_or_create(user=unit_member)[0]
        """
        Send two referral report versions with the same unit membership.
        """
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id), "files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {unit_member_token}",
        )

        unauthorized_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id), "files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {asker_token}",
        )

        second_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id), "files": (second_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {unit_member_token}",
        )
        self.assertEqual(unauthorized_version_response.status_code, 403)

        self.assertEqual(first_version_response.status_code, 201)
        first_document = models.VersionDocument.objects.get(id=first_version_response.json()["document"]["id"])
        self.assertEqual(first_document.name, "the first attachment file name")
        self.assertEqual(first_document.size, 15)

        self.assertEqual(second_version_response.status_code, 403)

        """
        Get the report.
        """
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {unit_member_token}",
        )

        self.assertEqual(response.json()["versions"][0]["document"]["name"], "the first attachment file name")

        self.assertEqual(len(response.json()["versions"]), 1)

        self.assertEqual(response.status_code, 200)

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
        first_attachment_file.name = "the first attachment file name"
        second_attachment_file.name = "the second attachment file name"
        third_attachment_file.name = "the third attachment file name"
        random_attachment_file.name = "the random attachment file name"

        first_unit_member_token = Token.objects.get_or_create(user=first_author_unit_member)[0]
        second_unit_member_token = Token.objects.get_or_create(user=second_author_unit_member)[0]

        """ Send a first referral report versions with the first unit membership."""
        first_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id), "files": (first_attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {first_unit_member_token}",
        )

        """ Send a second referral report versions with the second unit membership."""
        second_version_response = self.client.post(
            "/api/referralreportversions/",
            {"report": str(created_referral.report.id), "files": (second_attachment_file,)},
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
            path="/api/referralreportversions/" + first_version_id + '/',
            data=encode_multipart(data={"files": (second_attachment_file,)},
                                  boundary=BOUNDARY),
            content_type=MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Token {first_unit_member_token}"
        )

        self.assertEqual(first_version_update_response.status_code, 403)

        """
         Try to update the a first referral report versions with the author unit membership
         and yes he can!
        """
        second_version_update_response = self.client.put(
            path="/api/referralreportversions/" + second_version_id + '/',
            data=encode_multipart(data={"files": (third_attachment_file,)},
                                  boundary=BOUNDARY),
            content_type=MULTIPART_CONTENT,
            HTTP_AUTHORIZATION=f"Token {second_unit_member_token}"
        )
        print(second_version_update_response.json())
        self.assertEqual(second_version_update_response.status_code, 200)

        """Get the report and check if the document is well updated."""
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {second_unit_member_token}",
        )

        self.assertEqual(response.json()["versions"][1]["document"]["name"], "the third attachment file name")
        self.assertEqual(len(response.json()["versions"]), 2)

        self.assertEqual(response.status_code, 200)
