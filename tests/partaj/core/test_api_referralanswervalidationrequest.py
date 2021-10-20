import uuid

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories


class ReferralAnswerValidationRequestApiTestCase(TestCase):
    """
    Test API routes related to ReferralAnswerValidationRequest endpoints.
    """

    # LIST TESTS
    def test_list_referralanswervalidationrequest_by_anonymous_user(self):
        """
        Anonymous users cannot get lists of referral answer validation requests.
        """
        answer = factories.ReferralAnswerFactory()
        factories.ReferralAnswerValidationRequestFactory.create_batch(2, answer=answer)
        response = self.client.get(
            "/api/referralanswervalidationrequests/", {"answer": str(answer.id)},
        )
        self.assertEqual(response.status_code, 401)

    def test_list_referralanswervalidationrequest_by_random_logged_in_user(self):
        """
        Random logged in users cannot get lists of referral answer validation requests.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory()
        factories.ReferralAnswerValidationRequestFactory.create_batch(2, answer=answer)
        response = self.client.get(
            "/api/referralanswervalidationrequests/",
            {"answer": str(answer.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referralanswervalidationrequest_by_referral_linked_user(self):
        """
        A referral's linked user cannot get lists of referral answer validation requests for
        answers to their referral.
        """
        answer = factories.ReferralAnswerFactory()
        user = answer.referral.user
        factories.ReferralAnswerValidationRequestFactory.create_batch(2, answer=answer)
        response = self.client.get(
            "/api/referralanswervalidationrequests/",
            {"answer": str(answer.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referralanswervalidationrequest_by_referral_linked_unit_member(self):
        """
        A member of a referral's linked unit can get lists of referral answer validation requests
        for answers to said referral.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory()
        answer.referral.units.get().members.add(user)
        validation_requests = factories.ReferralAnswerValidationRequestFactory.create_batch(
            2, answer=answer
        )
        response = self.client.get(
            "/api/referralanswervalidationrequests/",
            {"answer": str(answer.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"][0]["id"], str(validation_requests[0].id)
        )
        self.assertEqual(
            response.json()["results"][1]["id"], str(validation_requests[1].id)
        )

    def test_list_referralanswervalidationrequest_for_nonexistent_answer(self):
        """
        The request fails with an apprioriate error when a user attempts to get a list of
        validation requests for an answer that does not exist.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory()
        answer.referral.units.get().members.add(user)
        factories.ReferralAnswerValidationRequestFactory.create_batch(2, answer=answer)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": uuid.uuid4()},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_referralanswervalidationrequest_missing_answer_param(self):
        """
        The request fails with an apprioriate error when a user attempts to get a list of
        validation requests but does not provide the answer param.
        """
        user = factories.UserFactory()
        factories.ReferralAnswerValidationRequestFactory.create_batch(2)
        response = self.client.post(
            "/api/referralanswerattachments/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 404)
