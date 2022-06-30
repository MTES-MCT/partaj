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
