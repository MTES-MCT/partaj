from unittest import mock
import uuid

from django.conf import settings
from django.db import transaction
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiAddObserverTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "add_observer" endpoint.
    """

    def test_add_observer_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot add an observer to a referral.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": "42"},
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

    def test_add_observer_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot add an observer to a referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": "42"},
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

    def test_auto_add_observer_by_same_requester_unit(self, mock_mailer_send):
        """
        User from same unit as requester can auto add itself as an observer to a referral.
        """
        new_observer = factories.UserFactory(unit_name="unit_name_1")
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        requester = factories.UserFactory(unit_name="unit_name_1")
        referral.users.set([requester])

        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=new_observer)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "case_number": referral.id,
                    "created_by": new_observer.get_full_name(),
                    "link_to_referral": (
                        "https://partaj/app/sent-referrals"
                        f"/referral-detail/{referral.id}"
                    ),
                    "topic": referral.topic.name,
                    "urgency": referral.urgency_level.name,
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_auto_add_observer_by_same_observer_unit(self, mock_mailer_send):
        """
        User from same unit as observer can't auto add itself as an observer to a referral.
        """
        new_observer = factories.UserFactory(unit_name="unit_name_1")
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        referral.users.set([])
        observer = factories.UserFactory(unit_name="unit_name_1")
        factories.ReferralUserLinkFactory(
            referral=referral, user=observer, role=models.ReferralUserLinkRoles.OBSERVER
        )

        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=new_observer)[0]}",
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

    def test_add_observer_by_linked_user(self, mock_mailer_send):
        """
        Referral linked users can add an observer to a referral.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_add_observer_by_linked_unit_member(self, mock_mailer_send):
        """
        Referral linked unit members can add an observer to a referral.
        """
        user = factories.UserFactory()
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        models.UnitMembership.objects.create(
            role=models.UnitMembershipRole.MEMBER,
            user=user,
            unit=referral.units.first(),
        )
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_auto_add_observer_already_observer(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add an observer
        that is already observer.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        factories.ReferralUserLinkFactory(
            referral=referral,
            user=new_observer,
            role=models.ReferralUserLinkRoles.OBSERVER,
        )
        # The new_observer is already linked to the referral
        referral.users.add(new_observer)
        referral.save()
        self.assertEqual(referral.users.count(), 2)

        with transaction.atomic():
            response = self.client.post(
                f"/api/referrals/{referral.id}/add_observer/",
                {"observer": new_observer.id},
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=new_observer)[0]}",
            )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"User {new_observer.id} is already observer for referral {referral.id}."
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

    def test_add_observer_already_requester(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add a observer
        that is already in the list.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = referral.users.first()
        # The new_observer is already requester of this referral
        referral.users.add(new_observer)
        referral.save()
        self.assertEqual(referral.users.count(), 2)

        with transaction.atomic():
            response = self.client.post(
                f"/api/referrals/{referral.id}/add_observer/",
                {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_add_observer_does_not_exist(self, mock_mailer_send):
        """
        The request fails with a relevant error when the user attempts to add a observer
        that does not exist.
        """
        random_uuid = uuid.uuid4()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": random_uuid},
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

    def test_add_observer_from_assigned_state(self, mock_mailer_send):
        """
        observers can be added on a referral in the ASSIGNED state.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_add_observer_from_processing_state(self, mock_mailer_send):
        """
        observers can be added on a referral in the PROCESSING state.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_add_observer_from_in_validation_state(self, mock_mailer_send):
        """
        observers can be added on a referral in the IN_VALIDATION state.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.IN_VALIDATION)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_add_observer_from_answered_state(self, mock_mailer_send):
        """
        observers can be added on a referral in the ANSWERED state.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )

    def test_add_observer_from_closed_state(self, mock_mailer_send):
        """
        observers cannot be added on a referral in the CLOSED state.
        """
        new_observer = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = referral.users.first()
        self.assertEqual(referral.users.count(), 1)

        response = self.client.post(
            f"/api/referrals/{referral.id}/add_observer/",
            {"observer": new_observer.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            1,
        )
        referral.refresh_from_db()
        self.assertEqual(referral.users.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
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
                    "REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"
                ],
                "to": [{"email": new_observer.email}],
            }
        )
