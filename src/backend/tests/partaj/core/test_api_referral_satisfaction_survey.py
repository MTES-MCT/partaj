from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralApiSatisfactionSurveyTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "assign" endpoint.
    """

    def test_request_satisfaction_survey_by_unit_member(self):
        """
        Unit member can answer to a request survey.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/satisfaction_request/",
            {"choice": 5},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        referral.refresh_from_db()

        referral_response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertTrue(str(user.id) in referral_response.json()["satisfaction_survey_participants"])

        second_try_response = self.client.post(
            f"/api/referrals/{referral.id}/satisfaction_request/",
            {"choice": 5},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(second_try_response.status_code, 400)

    def test_request_satisfaction_survey_by_requester(self):
        """
        Referral requester can not answer to a request survey.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        response = self.client.post(
            f"/api/referrals/{referral.id}/satisfaction_request/",
            {"choice": 5},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.users.first())[0]}",
        )

        self.assertEqual(response.status_code, 403)

    def test_response_satisfaction_survey_by_unit_member(self):
        """
        Unit member cannot answer to a request survey.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)

        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/satisfaction_response/",
            {"choice": 5},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)

    def test_response_satisfaction_survey_by_requester(self):
        """
        Referral requester can answer to a response survey.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        response = self.client.post(
            f"/api/referrals/{referral.id}/satisfaction_response/",
            {"choice": 5},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)

        referral_response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertTrue(str(user.id) in referral_response.json()["satisfaction_survey_participants"])

        second_try_response = self.client.post(
            f"/api/referrals/{referral.id}/satisfaction_response/",
            {"choice": 5},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(second_try_response.status_code, 400)
