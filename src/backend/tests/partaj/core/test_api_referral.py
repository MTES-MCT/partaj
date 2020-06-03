from unittest import mock

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core.factories import (
    ReferralFactory,
    ReferralAssignmentFactory,
    UnitMembershipFactory,
    UserFactory,
)
from partaj.core.models import ReferralState, UnitMembershipRole


@mock.patch("partaj.core.email.Mailer.send")
class ReferralApiTestCase(TestCase):
    """
    Test API routes and actions related to Referral endpoints.
    """

    # LIST TESTS
    def test_list_referrals_by_anonymous_user(self, _):
        """
        Anonymous users cannot make list requests on the referral endpoints.
        """
        response = self.client.get("/api/referrals/")
        self.assertEqual(response.status_code, 401)

    def test_list_referrals_admin_user(self, _):
        """
        Admin users can make list requests on the referral endpoints.
        """
        user = UserFactory(is_staff=True)

        response = self.client.get(
            "/api/referrals/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)

    # RETRIEVE TESTS
    def test_retrieve_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot get a referral with the retrieve endpoint.
        """
        referral = ReferralFactory()
        response = self.client.get(f"/api/referrals/{referral.id}/")
        self.assertEqual(response.status_code, 401)

    def test_retrieve_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot get a referral with the retrieve endpoint.
        """
        user = UserFactory()

        referral = ReferralFactory()
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_retrieve_referral_by_admin_user(self, _):
        """
        Admins can retrieve any referral on the retrieve endpoint.
        """
        user = UserFactory(is_staff=True)

        referral = ReferralFactory()
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_linked_user(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = UserFactory()

        referral = ReferralFactory(user=user)
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_linked_unit_member(self, _):
        """
        Members of the linked unit (through topic) can retrieve the referral.
        """
        user = UserFactory()

        referral = ReferralFactory()
        referral.topic.unit.members.add(user)
        response = self.client.get(
            f"/api/referrals/{referral.id}/",
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    # ANSWER TESTS
    def test_answer_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot answer a referral.
        """
        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/", {"content": "answer content"}
        )
        self.assertEqual(response.status_code, 401)

    def test_answer_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot answer a referral.
        """
        user = UserFactory()

        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/",
            {"content": "answer content"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_answer_referral_by_admin_user(self, _):
        """
        Admin users can answer a referral.
        """
        user = UserFactory(is_staff=True)

        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/",
            {"content": "answer content"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ANSWERED)
        self.assertEqual(response.json()["answers"][0]["content"], "answer content")

    def test_answer_referral_by_linked_user(self, _):
        """
        The referral's creator cannot answer it themselves.
        """
        user = UserFactory()

        referral = ReferralFactory(user=user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/",
            {"content": "answer content"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_answer_referral_by_linked_unit_member(self, _):
        """
        Members of the linked unit can answer a referral.
        """
        user = UserFactory()

        referral = ReferralFactory()
        referral.topic.unit.members.add(user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/",
            {"content": "answer content"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ANSWERED)
        self.assertEqual(response.json()["answers"][0]["content"], "answer content")

    # ASSIGN TESTS
    def test_assign_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot perform actions, including assignments.
        """
        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": "42"}
        )
        self.assertEqual(response.status_code, 401)

    def test_assign_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot assign a referral.
        """
        user = UserFactory()

        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_admin_user(self, _):
        """
        Admin users can assign a referral.
        """
        user = UserFactory(is_staff=True)

        referral = ReferralFactory()
        assignee = UserFactory()
        referral.topic.unit.members.add(assignee)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ASSIGNED)
        self.assertEqual(response.json()["assignees"], [str(assignee.id)])

    def test_assign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot assign it.
        """
        user = UserFactory()

        referral = ReferralFactory(user=user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot assign a referral.
        """
        referral = ReferralFactory()
        user = UnitMembershipFactory(
            role=UnitMembershipRole.MEMBER, unit=referral.topic.unit
        ).user
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": "42"},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_linked_unit_organizer(self, _):
        """
        Organizers of the linked unit can assign a referral.
        """
        referral = ReferralFactory()
        user = UnitMembershipFactory(
            role=UnitMembershipRole.OWNER, unit=referral.topic.unit
        ).user
        assignee = UnitMembershipFactory(unit=referral.topic.unit).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ASSIGNED)
        self.assertEqual(response.json()["assignees"], [str(assignee.id)])

    def test_assign_already_assigned_referral(self, _):
        """
        A referral which was assigned to one user can be assigned to an additional one,
        staying in the ASSIGNED state.
        """
        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        exsting_assignee = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        ).assignee
        user = UnitMembershipFactory(
            role=UnitMembershipRole.OWNER, unit=referral.topic.unit
        ).user
        assignee = UnitMembershipFactory(unit=referral.topic.unit).user

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ASSIGNED)
        self.assertEqual(
            response.json()["assignees"], [str(exsting_assignee.id), str(assignee.id)]
        )

    # ASSIGN TESTS
    def test_unassign_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot perform actions, including assignment removals.
        """
        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        assignment = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_unassign_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot unassign an assignee from a referral.
        """
        user = UserFactory()

        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        assignment = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_unassign_referral_by_admin_user(self, _):
        """
        Admin users can unassign an assignee from a referral.
        """
        user = UserFactory(is_staff=True)

        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        assignment = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.RECEIVED)
        self.assertEqual(response.json()["assignees"], [])

    def test_unassign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot unassign an assignee from it.
        """
        user = UserFactory()

        referral = ReferralFactory(state=ReferralState.ASSIGNED, user=user)
        assignment = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_unassign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot unassign anyonce (incl. themselves)
        from a referral.
        """
        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        assignee = UnitMembershipFactory(role=UnitMembershipRole.MEMBER).user
        assignment = ReferralAssignmentFactory(
            assignee=assignee, referral=referral, unit=referral.topic.unit,
        )
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment.assignee)[0]}",
        )
        self.assertEqual(response.status_code, 403)

    def test_unassign_referral_by_linked_unit_organizer(self, _):
        """
        Organizers of the linked unit can unassign a member from a referral.
        """
        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        assignment = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit,
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment.created_by)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.RECEIVED)
        self.assertEqual(response.json()["assignees"], [])

    def test_unassign_referral_still_assigned_state(self, _):
        """
        When a member is unassigned from a referral which has other assignees, the
        referral remains in state ASSIGNED instead of moving to RECEIVED.
        """
        referral = ReferralFactory(state=ReferralState.ASSIGNED)
        assignment_to_remove = ReferralAssignmentFactory(
            referral=referral, unit=referral.topic.unit,
        )
        assignment_to_keep = ReferralAssignmentFactory(referral=referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/unassign/",
            {"assignee_id": assignment_to_remove.assignee.id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=assignment_to_remove.created_by)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ASSIGNED)
        self.assertEqual(
            response.json()["assignees"], [str(assignment_to_keep.assignee.id)]
        )
