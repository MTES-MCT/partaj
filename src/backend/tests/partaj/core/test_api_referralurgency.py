from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories


class ReferralUrgencyApiTestCase(TestCase):
    """
    Test API routes and actions related to ReferralUrgency endpoints.
    """

    def test_list_referral_urgencies_by_anonymous_user(self):
        """
        Anonymous users cannot list referral urgencies.
        """
        response = self.client.get("/api/urgencies/?limit=999")
        self.assertEqual(response.status_code, 401)

    def test_list_referral_urgencies_by_random_logged_in_user(self):
        """
        Any logged in users can get the list of referral urgencies.
        """
        user = factories.UserFactory()
        response = self.client.get(
            "/api/urgencies/?limit=999",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        # NB: these are the default set of referral urgencies as bootstrapped by migrations
        self.assertEqual(
            response.json(),
            {
                "count": 4,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "duration": "21 00:00:00",
                        "id": 4,
                        "index": 0,
                        "name": "3 weeks",
                        "requires_justification": False,
                    },
                    {
                        "duration": "7 00:00:00",
                        "id": 1,
                        "index": None,
                        "name": "Urgent — 1 week",
                        "requires_justification": True,
                    },
                    {
                        "duration": "3 00:00:00",
                        "id": 2,
                        "index": None,
                        "name": "Extremely urgent — 3 days",
                        "requires_justification": True,
                    },
                    {
                        "duration": "1 00:00:00",
                        "id": 3,
                        "index": None,
                        "name": "Absolute emergency — 24 hours",
                        "requires_justification": True,
                    },
                ],
            },
        )
