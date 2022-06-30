from io import BytesIO

from django.test import TestCase

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

        self.assertEqual(second_version_response.status_code, 201)
        second_document = models.VersionDocument.objects.get(id=second_version_response.json()["document"]["id"])
        self.assertEqual(second_document.name, "the second attachment file name")
        self.assertEqual(second_document.size, 16)

        """
        Get the report.
        """
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {unit_member_token}",
        )

        self.assertEqual(response.json()["versions"][0]["document"]["name"], "the first attachment file name")
        self.assertEqual(response.json()["versions"][1]["document"]["name"], "the second attachment file name")

        self.assertEqual(response.status_code, 200)
