from io import BytesIO
from unittest import mock

from django.conf import settings
from django.test import TestCase

import arrow
from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralMessageApiTestCase(TestCase):
    """
    Test API routes related to ReferralMessage endpoints.
    """

    # CREATE TESTS
    def test_create_referralmessage_by_anonymous_user(self, mock_mailer_send):
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
        mock_mailer_send.assert_not_called()

    def test_create_referralmessage_by_random_logged_in_user(self, mock_mailer_send):
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
        mock_mailer_send.assert_not_called()

    def test_create_referralmessage_by_referral_linked_user(self, mock_mailer_send):
        """
        A referral's linked user can create messages for their referral.
        """
        # Create a unit with an owner, and admin and a member
        unit1 = factories.UnitFactory()
        unit1_owner_membership = factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.OWNER
        )
        factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.ADMIN
        )
        factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.MEMBER
        )
        # Create another unit with two owners and a member
        unit2 = factories.UnitFactory()
        unit2_owner1_membership = factories.UnitMembershipFactory(
            unit=unit2, role=models.UnitMembershipRole.OWNER
        )
        unit2_owner2_membership = factories.UnitMembershipFactory(
            unit=unit2, role=models.UnitMembershipRole.OWNER
        )
        factories.UnitMembershipFactory(
            unit=unit2, role=models.UnitMembershipRole.MEMBER
        )

        referral = factories.ReferralFactory()
        referral.units.set([unit1, unit2])

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

        # The relevant email should be sent to all owners of units linked to the referral
        # but not to the referral user (they sent the message) or regular members
        self.assertEqual(mock_mailer_send.call_count, 3)
        for index, owner_membership in enumerate(
            [
                unit1_owner_membership,
                unit2_owner1_membership,
                unit2_owner2_membership,
            ]
        ):
            self.assertEqual(
                tuple(mock_mailer_send.call_args_list[index]),
                (
                    (
                        {
                            "params": {
                                "case_number": referral.id,
                                "link_to_referral": (
                                    f"https://partaj/app/unit/{owner_membership.unit.id}"
                                    f"/referrals-list/referral-detail/{referral.id}/messages"
                                ),
                                "message_author": referral.user.get_full_name(),
                                "referral_author": referral.user.get_full_name(),
                                "topic": referral.topic.name,
                            },
                            "replyTo": {
                                "email": "contact@partaj.beta.gouv.fr",
                                "name": "Partaj",
                            },
                            "templateId": settings.SENDINBLUE[
                                "REFERRAL_NEW_MESSAGE_FOR_UNIT_MEMBER_TEMPLATE_ID"
                            ],
                            "to": [{"email": owner_membership.user.email}],
                        },
                    ),
                    {},
                ),
            )

    def test_create_referralmessage_by_referral_linked_unit_member(
        self, mock_mailer_send
    ):
        """
        A referral's linked unit member can create messages for said referral.
        """
        # Create a unit with an owner, and admin and a member
        unit1 = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.OWNER
        )
        factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.ADMIN
        )
        unit1_member_membership = factories.UnitMembershipFactory(
            unit=unit1, role=models.UnitMembershipRole.MEMBER
        )
        # Create another unit with two owners and a member
        unit2 = factories.UnitFactory()
        factories.UnitMembershipFactory(
            unit=unit2, role=models.UnitMembershipRole.OWNER
        )
        user_membership = factories.UnitMembershipFactory(
            unit=unit2, role=models.UnitMembershipRole.OWNER
        )
        user = user_membership.user
        factories.UnitMembershipFactory(
            unit=unit2, role=models.UnitMembershipRole.MEMBER
        )

        referral = factories.ReferralFactory()
        referral.units.set([unit1, unit2])
        referral.assignees.set([unit1_member_membership.user, user])

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

        # The relevant email should be sent to assignees and the referral user except
        # for the person who sent the message
        self.assertEqual(mock_mailer_send.call_count, 2)
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[0]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}/messages",
                            "message_author": user.get_full_name(),
                            "topic": referral.topic.name,
                            "units": f"{unit1.name}, {unit2.name}",
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_NEW_MESSAGE_FOR_REQUESTER_TEMPLATE_ID"
                        ],
                        "to": [{"email": referral.user.email}],
                    },
                ),
                {},  # kwargs
            ),
        )
        self.assertEqual(
            tuple(mock_mailer_send.call_args_list[1]),
            (
                (  # args
                    {
                        "params": {
                            "case_number": referral.id,
                            "link_to_referral": (
                                f"https://partaj/app/unit/{unit1_member_membership.unit.id}"
                                f"/referrals-list/referral-detail/{referral.id}/messages"
                            ),
                            "message_author": user.get_full_name(),
                            "referral_author": referral.user.get_full_name(),
                            "topic": referral.topic.name,
                        },
                        "replyTo": {
                            "email": "contact@partaj.beta.gouv.fr",
                            "name": "Partaj",
                        },
                        "templateId": settings.SENDINBLUE[
                            "REFERRAL_NEW_MESSAGE_FOR_UNIT_MEMBER_TEMPLATE_ID"
                        ],
                        "to": [{"email": unit1_member_membership.user.email}],
                    },
                ),
                {},  # kwargs
            ),
        )

    def test_create_referralmessage_missing_referral_in_payload(self, mock_mailer_send):
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
        mock_mailer_send.assert_not_called()

    # LIST TESTS
    def test_list_referralmessage_for_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot make list requests for referral messages.
        """
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            referral=referral,
        )

        response = self.client.get(
            f"/api/referralmessages/?referral={referral.id}",
        )
        self.assertEqual(response.status_code, 401)

    def test_list_referralmessage_for_referral_by_random_logged_in_user(self, _):
        """
        Random logged-in users cannot make list requests for referral messages for referrals
        to which they have no link
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            referral=referral,
        )

        response = self.client.get(
            f"/api/referralmessages/?referral={referral.id}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_list_referralmessage_for_referral_by_referral_linked_user(self, _):
        """
        A referral's linked user can list all referral messages linked to said referral.
        """
        referral = factories.ReferralFactory()
        referral_messages = [
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-15).datetime,
                referral=referral,
            ),
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-7).datetime,
                referral=referral,
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

    def test_list_referralmessage_for_referral_by_referral_linked_unit_member(self, _):
        """
        A referral's linked unit member can list all referral messages linked to said referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory()
        referral.units.get().members.add(user)
        referral_messages = [
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-15).datetime,
                referral=referral,
            ),
            factories.ReferralMessageFactory(
                created_at=arrow.utcnow().shift(days=-7).datetime,
                referral=referral,
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

    def test_list_referral_message_for_nonexistent_referral(self, _):
        """
        The user could access one referral's messages, but passes an ID that matches no referral,
        receiving an error response.
        """
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            referral=referral,
        )

        response = self.client.get(
            f"/api/referralmessages/?referral={42}",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_referral_message_missing_referral_param(self, _):
        """
        List requests for referral messages without a referral param are not supported.
        """
        referral = factories.ReferralFactory()
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-15).datetime,
            referral=referral,
        )
        factories.ReferralMessageFactory(
            created_at=arrow.utcnow().shift(days=-7).datetime,
            referral=referral,
        )

        response = self.client.get(
            "/api/referralmessages/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=referral.user)[0]}",
        )
        self.assertEqual(response.status_code, 404)

    # RETRIEVE TESTS
    def test_retrieve_referralmessage_by_anonymous_user(self, _):
        """
        Anonymous users cannot retrieve any referral messages.
        """
        referral_message = factories.ReferralMessageFactory()
        response = self.client.get(
            f"/api/referralmessages/{referral_message.id}/",
        )
        self.assertEqual(response.status_code, 401)

    def test_retrieve_referralmessage_by_random_logged_in_user(self, _):
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

    def test_retrieve_referralmessage_by_referral_linked_user(self, _):
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

    def test_retrieve_referralmessage_by_referral_linked_unit_member(self, _):
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
