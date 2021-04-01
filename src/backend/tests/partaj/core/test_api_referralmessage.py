from io import BytesIO

from django.test import TestCase

import arrow
from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralMessageApiTestCase(TestCase):
    """
    Test API routes related to ReferralMessage endpoints.
    """

    # CREATE TESTS
    def test_create_referralmessage_by_anonymous_user(self):
        """
        Anonymous users cannot create referral messages.
        """
        referral = factories.ReferralFactory()

        self.assertEqual(models.ReferralMessage.objects.count(), 0)
        response = self.client.post(
            "/api/referralmessages/",
            {"content": "some message", "referral": str(referral.id)},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReferralMessage.objects.count(), 0)

    def test_create_referralmessage_by_random_logged_in_user(self):
        """
        Random logged-in users cannot create referral messages for referrals to which
        they have no link.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()

        self.assertEqual(models.ReferralMessage.objects.count(), 0)
        response = self.client.post(
            "/api/referralmessages/",
            {"content": "some message", "referral": str(referral.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralMessage.objects.count(), 0)

    def test_create_referralmessage_by_referral_linked_user(self):
        """
        A referral's linked user can create messages for their referral.
        """
        referral = factories.ReferralFactory()

        file1 = BytesIO(b"firstfile")
        file1.name = "the first file name"
        file2 = BytesIO(b"secondfile")
        file2.name = "the second file name"
        form_data = {
            "content": "some message",
            "files": (file1, file2),
            "referral": str(referral.id),
        }

        self.assertEqual(models.ReferralMessage.objects.count(), 0)
        self.assertEqual(models.ReferralMessageAttachment.objects.count(), 0)
        response = self.client.post(
            "/api/referralmessages/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )
        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(models.ReferralMessage.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(response.json()["user"]["id"], str(referral.user.id))
        self.assertEqual(response.json()["referral"], referral.id)
        # The related attachment instances were created along with the message
        self.assertEqual(models.ReferralMessageAttachment.objects.count(), 2)
        self.assertEqual(
            response.json()["attachments"][0]["name"], "the first file name"
        )
        self.assertEqual(
            response.json()["attachments"][1]["name"], "the second file name"
        )

    def test_create_referralmessage_by_referral_linked_unit_member(self):
        """
        A referral's linked unit member can create messages for said referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        referral.units.get().members.add(user)

        file1 = BytesIO(b"firstfile")
        file1.name = "the first file name"
        file2 = BytesIO(b"secondfile")
        file2.name = "the second file name"
        form_data = {
            "content": "some message",
            "files": (file1, file2),
            "referral": str(referral.id),
        }

        self.assertEqual(models.ReferralMessage.objects.count(), 0)
        self.assertEqual(models.ReferralMessageAttachment.objects.count(), 0)
        response = self.client.post(
            "/api/referralmessages/",
            form_data,
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 201)
        # The referral message instance was created with our values
        self.assertEqual(models.ReferralMessage.objects.count(), 1)
        self.assertEqual(response.json()["content"], "some message")
        self.assertEqual(response.json()["user"]["id"], str(user.id))
        self.assertEqual(response.json()["referral"], referral.id)
        # The related attachment instances were created along with the message
        self.assertEqual(models.ReferralMessageAttachment.objects.count(), 2)
        self.assertEqual(
            response.json()["attachments"][0]["name"], "the first file name"
        )
        self.assertEqual(
            response.json()["attachments"][1]["name"], "the second file name"
        )

    def test_create_referralmessage_missing_referral_in_payload(self):
        """
        When the referral property is omitted in the payload, requests fail with a 404
        error as we cannot even determine the user has permission to create a message.
        """
        referral = factories.ReferralFactory()

        self.assertEqual(models.ReferralMessage.objects.count(), 0)
        self.assertEqual(models.ReferralMessageAttachment.objects.count(), 0)
        response = self.client.post(
            "/api/referralmessages/",
            {"content": "some message"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(models.ReferralMessage.objects.count(), 0)

    # LIST TESTS
    def test_list_referralmessage_for_referral_by_anonymous_user(self):
        """
        Anonymous users cannot make list requests for referral messages.
        """
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime, referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime, referral=referral,
        )

        response = self.client.get(f"/api/referralmessages/?referral={referral.id}",)
        self.assertEqual(response.status_code, 401)

    def test_list_referralmessage_for_referral_by_random_logged_in_user(self):
        """
        Random logged-in users cannot make list requests for referral messages for referrals
        to which they have no link
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime, referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime, referral=referral,
        )

        response = self.client.get(
            f"/api/referralmessages/?referral={referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referralmessage_for_referral_by_referral_linked_user(self):
        """
        A referral's linked user can list all referral messages linked to said referral.
        """
        referral = factories.ReferralFactory()
        referral_messages = [
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-15).datetime, referral=referral,
            ),
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-7).datetime, referral=referral,
            ),
        ]

        response = self.client.get(
            f"/api/referralmessages/?referral={referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "attachments": [],
                        "content": referral_message.content,
                        "created_at": referral_message.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "id": str(referral_message.id),
                        "referral": referral.id,
                        "user": {
                            "first_name": referral_message.user.first_name,
                            "id": str(referral_message.user.id),
                            "last_name": referral_message.user.last_name,
                        },
                    }
                    for referral_message in referral_messages
                ],
            },
        )

    def test_list_referralmessage_for_referral_by_referral_linked_unit_member(self):
        """
        A referral's linked unit member can list all referral messages linked to said referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        referral.units.get().members.add(user)
        referral_messages = [
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-15).datetime, referral=referral,
            ),
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-7).datetime, referral=referral,
            ),
        ]

        response = self.client.get(
            f"/api/referralmessages/?referral={referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 2,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "attachments": [],
                        "content": referral_message.content,
                        "created_at": referral_message.created_at.isoformat()[:-6]
                        + "Z",  # NB: DRF literally does this
                        "id": str(referral_message.id),
                        "referral": referral.id,
                        "user": {
                            "first_name": referral_message.user.first_name,
                            "id": str(referral_message.user.id),
                            "last_name": referral_message.user.last_name,
                        },
                    }
                    for referral_message in referral_messages
                ],
            },
        )

    def test_list_referral_message_for_nonexistent_referral(self):
        """
        The user could access one referral's messages, but passes an ID that matches no referral,
        receiving an error response.
        """
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime, referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime, referral=referral,
        )

        response = self.client.get(
            f"/api/referralmessages/?referral={42}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_referral_message_missing_referral_param(self):
        """
        List requests for referral messages without a referral param are not supported.
        """
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime, referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime, referral=referral,
        )

        response = self.client.get(
            "/api/referralmessages/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )
        self.assertEqual(response.status_code, 404)

    # RETRIEVE TESTS
    def test_retrieve_referralmessage_by_anonymous_user(self):
        """
        Anonymous users cannot retrieve any referral messages.
        """
        referral_message = factories.ReferralMessageFactory()
        response = self.client.get(f"/api/referralmessages/{referral_message.id}/",)
        self.assertEqual(response.status_code, 401)

    def test_retrieve_referralmessage_by_random_logged_in_user(self):
        """
        Random logged-in users cannot retrieve referral messages linked to referrals to which
        they themselves are not linked.
        """
        user = factories.UserFactory()
        referral_message = factories.ReferralMessageFactory()
        response = self.client.get(
            f"/api/referralmessages/{referral_message.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)

    def test_retrieve_referralmessage_by_referral_linked_user(self):
        """
        A referral's linked user can retrieve any referral message linked to that referral.
        """
        referral_message = factories.ReferralMessageFactory()
        user = referral_message.referral.user
        response = self.client.get(
            f"/api/referralmessages/{referral_message.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(referral_message.id))

    def test_retrieve_referralmessage_by_referral_linked_unit_member(self):
        """
        A referral's linked unit members can retrieve any referral message linked to that referral.
        """
        user = factories.UserFactory()
        referral_message = factories.ReferralMessageFactory()
        referral_message.referral.units.get().members.add(user)
        response = self.client.get(
            f"/api/referralmessages/{referral_message.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(referral_message.id))
