from unittest import mock
import uuid

from django.conf import settings
from django.db import transaction
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiAddRequesterTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "add_requester" endpoint.
    """
    # TESTS ADD
    # - NOT ALLOWED PERMISSIONS
    def test_add_requester_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot add a requester to a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": referral.users.first().id},
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot add a requester to a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": referral.users.first().id,
                "notifications": "A"
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    # - ALLOWED PERMISSIONS
    # -- AUTO ADD
    def test_auto_add_requester_by_same_unit_requester(self, mock_mailer_send):
        """
        User from same unit as requester can auto add itself as a requester to a referral.
        """
        new_requester = factories.UserFactory(unit_name="unit_name_1")
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        requester = factories.UserFactory(unit_name="unit_name_1")
        referral.users.set([requester])

        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id,
                "notifications": "R"
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=new_requester)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
            ).count(), 1
        )

        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": new_requester.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_auto_add_requester_by_same_unit_requester_without_notification_attr(self, mock_mailer_send):
        """
        User from same unit as requester can auto add itself as a requester to a referral.
        """
        new_requester = factories.UserFactory(unit_name="unit_name_1")
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        requester = factories.UserFactory(unit_name="unit_name_1")
        referral.users.set([requester])

        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=new_requester)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 2
        )

        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": new_requester.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_auto_add_requester_by_same_unit_requester_with_wrong_notification_attr(self, mock_mailer_send):
        """
        User from same unit as requester can auto add itself as a requester to a referral.
        """
        new_requester = factories.UserFactory(unit_name="unit_name_1")
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        requester = factories.UserFactory(unit_name="unit_name_1")
        referral.users.set([requester])

        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id,
                "notifications": "Z",
                # Z do not exists
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=new_requester)[0]}",
        )

        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Notification type Z does not exist."
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)

    # -- ADDED BY OTHER i.e. POST by other user and no notifications attr
    def test_add_requester_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can add a requester to a referral.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 2
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_already_observer_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can add an requester to a referral event if he is already observer.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()

        factories.ReferralUserLinkFactory(
            referral=referral,
            user=new_requester,
            role=models.ReferralUserLinkRoles.OBSERVER,
            notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
        )

        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 1
        )

        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.OBSERVER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
            ).count(), 1
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id,
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            2,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 2
        )

        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.OBSERVER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
            ).count(), 0
        )

        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_by_linked_user_at_draft_step_with_no_referral_topic(
        self, mock_mailer_send
    ):
        """
        Referral linked users can add a requester to a referral.
        When added in a DRAFT state, mail is send with a default topic
        When no notifications attribute sent in the body, notifications should be ALL by default
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, topic=None
        )
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.DRAFT)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 2
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        f"https://partaj/app/new-referral/{referral.id}"
                    ),
                    "topic": "En cours",
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_by_linked_unit_member(self, mock_mailer_send):
        """
        Referral linked unit members can add a requester to a referral.
        """
        unit_member = factories.UserFactory()
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        referral.users.set([])
        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.MEMBER,
            user=unit_member,
            unit=referral.units.first(),
        )
        self.assertEqual(referral.users.count(), 0)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": new_requester.id
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=unit_member)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.ALL,
            ).count(), 1
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": unit_member.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_already_requester_and_same_notif(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add a requester
        that is already in the list.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        # The new_requester is already linked to the referral
        referral.users.add(new_requester)
        referral.save()
        self.assertEqual(referral.users.count(), 2)

        with transaction.atomic():
            response = self.client.post(
                f"/api/referrals/{referral.id}/add_requester/",
                {"user": new_requester.id},
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"User {new_requester.id} is already requester with A notifications for referral {referral.id}."
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_does_not_exist(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add a requester
        that does not exist.
        """
        random_uuid = uuid.uuid4()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": random_uuid},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [f"User {random_uuid} does not exist."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()

    def test_add_requester_from_assigned_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the ASSIGNED state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_processing_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the PROCESSING state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_in_validation_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the IN_VALIDATION state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_answered_state(self, mock_mailer_send):
        """
        Requesters can be added on a referral in the ANSWERED state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": user.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_requester.email}],
            }
        )

    def test_add_requester_from_closed_state(self, mock_mailer_send):
        """
        Requesters cannot be added on a referral in the CLOSED state.
        """
        new_requester = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {"user": new_requester.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ADD_REQUESTER not allowed from state closed."]},
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        mock_mailer_send.assert_not_called()

    # UPDATE
    # - NOT ALLOWED
    # -- UPDATE BY OTHER
    def test_update_requester_by_same_unit_requester(self, mock_mailer_send):
        """
        User from same unit as requester can auto add itself as a requester to a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UserFactory(unit_name="unit_name_1")
        requester = factories.UserFactory(unit_name="unit_name_1")
        referral.users.set([user, requester])
        referral.save()

        self.assertEqual(referral.users.count(), 2)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": requester.id,
                "notifications": "R"
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"User {user.id} is not allowed to change notification preferences of user {requester.id}"
                ]
            },
        )
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
            ).count(), 0
        )

        mock_mailer_send.assert_not_called()

    # -- AUTO UPDATE
    def test_auto_update_requester_notifications(self, mock_mailer_send):
        """
        User from same unit as requester can auto add itself as a requester to a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        requester = factories.UserFactory(unit_name="unit_name_1")
        referral.users.set([requester])
        referral.save()

        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_requester/",
            {
                "user": requester.id,
                "notifications": "R"
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=requester)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            referral.users.filter(
                referraluserlink__role=models.ReferralUserLinkRoles.REQUESTER,
                referraluserlink__notifications=models.ReferralUserLinkNotificationsTypes.RESTRICTED,
            ).count(), 1
        )
        mock_mailer_send.assert_not_called()
