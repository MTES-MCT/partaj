from io import BytesIO

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralReportApiTestCase(TestCase):
    """
    Test API routes related to ReferralReport endpoints.
    """

    # GET TESTS
    def test_get_referralreport_by_linked_user(self):
        """
        Save referral and send it.
        """
        user = factories.UserFactory()
        topic = factories.TopicFactory()
        urgency_level = factories.ReferralUrgencyFactory()

        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        referral.users.set([user.id])
        form_data = {
            "question": "la question",
            "context": "le contexte",
            "object": "l'object",
            "prior_work": "le travail prÃ©alable",
            "topic": str(topic.id),
            "urgency_level": str(urgency_level.id),
            "urgency_explanation": "la justification de l'urgence",
        }

        self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        created_referral = models.Referral.objects.get(id=referral.id)

        """
        Get the report.
        """
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

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

        self.client.post(
            f"/api/referrals/{referral.id}/send/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=asker)[0]}",
        )
        created_referral = models.Referral.objects.get(id=referral.id)

        """
        Get the report.
        """
        response = self.client.get(
            f"/api/referralreports/{created_referral.report.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=unit_member)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["comment"])
        self.assertIsNone(response.json()["published_at"])
        self.assertIsNone(response.json()["last_version"])
        self.assertIsNone(response.json()["final_version"])
        self.assertIsNone(response.json()["final_version"])
        self.assertIsNotNone(response.json()["created_at"])
        self.assertEqual(response.json()["attachments"], [])
        self.assertEqual(response.json()["versions"], [])

    # API add_attachment TESTS
    def test_referralreport_add_attachment_by_linked_unit_user(self):
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

        first_attachment_file = BytesIO(b"attachment_file1")
        first_attachment_file.name = "the first attachment file name"

        second_attachment_file = BytesIO(b"attachment_file2")
        second_attachment_file.name = "the second attachment file name"

        unit_member_token = Token.objects.get_or_create(user=unit_member)[0]

        report_attachment_response = self.client.post(
            f"/api/referralreports/{created_referral.report.id}/add_attachment/",
            {"files": (first_attachment_file, second_attachment_file)},
            HTTP_AUTHORIZATION=f"Token {unit_member_token}"
        )

        self.assertEqual(report_attachment_response.status_code, 201)
        self.assertEqual(len(report_attachment_response.json()), 2),
        self.assertEqual(report_attachment_response.json()[0]["name"],
                         "the first attachment file name")
        self.assertEqual(report_attachment_response.json()[1]["name"],
                         "the second attachment file name")
