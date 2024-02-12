import uuid
from unittest import mock

from django.conf import settings
from django.db import transaction
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiAssignUnitTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "assign_unit" endpoint.
    """

    def test_assign_unit_with_missing_explanation(self, mock_mailer_send):
        """
        Assign unit explanation is mandatory. Make sure the API returns an error when
        it is missing.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {"unit": str(other_unit.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        referral.refresh_from_db()
        self.assertEqual(
            referral.state,
            models.ReferralState.RECEIVED,
        )
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_anonymous_user(self, mock_mailer_send):
        """
        Anonymous users cannot assign units to referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
        )
        self.assertEqual(response.status_code, 401)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_random_logged_in_user(self, mock_mailer_send):
        """
        Random logged-in users cannot assign units to referrals.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_linked_user(self, mock_mailer_send):
        """
        A referral's linked user cannot assign units to their referral.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, post__users=[user]
        )
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_linked_unit_member(self, mock_mailer_send):
        """
        A member of a referral's linked unit cannot assign units to referrals.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_by_linked_unit_organizer_with_title_filled(
        self, mock_mailer_send
    ):
        """
        An organizer of a referral( with title filled)'s linked unit can assign units to referrals.
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.ASSIGNED, title="Titre DAJ"
        )
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.ASSIGNED)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.title,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_nonexistent_unit(self, mock_mailer_send):
        """
        The request returns an error response when the user attempts to assign a unit
        that does not exist.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        random_uuid = uuid.uuid4()

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": random_uuid,
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": [f"Unit {random_uuid} does not exist."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_redundant_assignment(self, mock_mailer_send):
        referral = factories.ReferralFactory(state=models.ReferralState.ASSIGNED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user

        with transaction.atomic():
            response = self.client.post(
                f"/api/referrals/{referral.id}/assign_unit/",
                {
                    "unit": str(referral.units.get().id),
                    "assignunit_explanation": "La justification de l'affectation.",
                },
                HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    f"Unit {referral.units.get().id} is already assigned to referral."
                ]
            },
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ASSIGNED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_from_received_state(self, mock_mailer_send):
        """
        New unit assignments can be added on a referral in the RECEIVED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.RECEIVED)
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.RECEIVED)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.RECEIVED)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_from_processing_state(self, mock_mailer_send):
        """
        New unit assignments can be added on a referral in the PROCESSING state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.PROCESSING)
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.PROCESSING)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.PROCESSING)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.object,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_from_in_validation_state_with_title_filled(
        self, mock_mailer_send
    ):
        """
        New unit assignments can be added on a referral with title filled in the IN_VALIDATION state.
        """
        referral = factories.ReferralFactory(
            state=models.ReferralState.IN_VALIDATION, title="Titre de la DAJ"
        )
        initial_unit = referral.units.get()
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        other_unit_owner = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], models.ReferralState.IN_VALIDATION)
        self.assertEqual(len(response.json()["units"]), 2)
        self.assertEqual(response.json()["units"][0]["id"], str(initial_unit.id))
        self.assertEqual(response.json()["units"][1]["id"], str(other_unit.id))
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 2)
        self.assertEqual(referral.state, models.ReferralState.IN_VALIDATION)
        self.assertEqual(
            models.ReferralActivity.objects.filter(
                actor=user,
                verb=models.ReferralActivityVerb.ASSIGNED_UNIT,
                referral=referral,
            ).count(),
            1,
        )
        link = (
            f"https://partaj/app/unit/{str(other_unit.id)}"
            f"/referrals-list/referral-detail/{referral.id}"
        )
        mock_mailer_send.assert_called_with(
            {
                "params": {
                    "assigned_by": user.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": link,
                    "referral_users": referral.users.first().get_full_name(),
                    "title": referral.title,
                    "topic": referral.topic.name,
                    "unit_name": other_unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": "La justification de l'affectation.",
                },
                "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
                "templateId": settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"],
                "to": [{"email": other_unit_owner.email}],
            }
        )

    def test_assign_unit_referral_from_answered_state(self, mock_mailer_send):
        """
        No new unit assignments can be added on a referral in the ANSWERED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.ANSWERED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ASSIGN_UNIT not allowed from state answered."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.ANSWERED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()

    def test_assign_unit_referral_from_closed_state(self, mock_mailer_send):
        """
        No new unit assignments can be added on a referral in the CLOSED state.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.CLOSED)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=referral.units.get()
        ).user
        other_unit = factories.UnitFactory()
        factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.OWNER, unit=other_unit
        ).user

        self.assertEqual(referral.units.count(), 1)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign_unit/",
            {
                "unit": str(other_unit.id),
                "assignunit_explanation": "La justification de l'affectation.",
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"errors": ["Transition ASSIGN_UNIT not allowed from state closed."]},
        )
        referral.refresh_from_db()
        self.assertEqual(referral.units.count(), 1)
        self.assertEqual(referral.state, models.ReferralState.CLOSED)
        self.assertEqual(
            models.ReferralActivity.objects.count(),
            0,
        )
        mock_mailer_send.assert_not_called()
