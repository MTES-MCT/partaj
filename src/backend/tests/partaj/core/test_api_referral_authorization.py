from unittest import mock

from django.test import TestCase

from partaj.core.factories import ReferralFactory, UserFactory
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
        self.assertEqual(response.status_code, 403)

    def test_list_referrals_admin_user(self, _):
        """
        Admin users can make list requests on the referral endpoints.
        """
        user = UserFactory(is_staff=True)
        self.client.force_login(user)

        response = self.client.get("/api/referrals/")
        self.assertEqual(response.status_code, 200)

    # RETRIEVE TESTS
    def test_retrieve_referral_by_anonymous_user(self, _):
        """
        Anonymous users cannot get a referral with the retrieve endpoint.
        """
        referral = ReferralFactory()
        response = self.client.get(f"/api/referrals/{referral.id}/")
        self.assertEqual(response.status_code, 403)

    def test_retrieve_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot get a referral with the retrieve endpoint.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        response = self.client.get(f"/api/referrals/{referral.id}/")
        self.assertEqual(response.status_code, 403)

    def test_retrieve_referral_by_admin_user(self, _):
        """
        Admins can retrieve any referral on the retrieve endpoint.
        """
        user = UserFactory(is_staff=True)
        self.client.force_login(user)

        referral = ReferralFactory()
        response = self.client.get(f"/api/referrals/{referral.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_linked_user(self, _):
        """
        The user who created the referral can retrieve it on the retrieve endpoint.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory(user=user)
        response = self.client.get(f"/api/referrals/{referral.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], referral.id)

    def test_retrieve_referral_by_linked_unit_member(self, _):
        """
        Members of the linked unit (through topic) can retrieve the referral.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        referral.topic.unit.members.add(user)
        response = self.client.get(f"/api/referrals/{referral.id}/")
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
        self.assertEqual(response.status_code, 403)

    def test_answer_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot answer a referral.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/", {"content": "answer content"}
        )
        self.assertEqual(response.status_code, 403)

    def test_answer_referral_by_admin_user(self, _):
        """
        Admin users can answer a referral.
        """
        user = UserFactory(is_staff=True)
        self.client.force_login(user)

        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/", {"content": "answer content"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ANSWERED)
        self.assertEqual(response.json()["answers"][0]["content"], "answer content")

    def test_answer_referral_by_linked_user(self, _):
        """
        The referral's creator cannot answer it themselves.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory(user=user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/", {"content": "answer content"}
        )
        self.assertEqual(response.status_code, 403)

    def test_answer_referral_by_linked_unit_member(self, _):
        """
        Members of the linked unit can answer a referral.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        referral.topic.unit.members.add(user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/answer/", {"content": "answer content"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ANSWERED)
        self.assertEqual(response.json()["answers"][0]["content"], "answer content")

    # ASSIGN TESTS
    def test_assign_referral_by_anonymous_user(self, _):
        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": "42"}
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_random_logged_in_user(self, _):
        """
        Any random logged in user cannot assign a referral.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": "42"}
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_admin_user(self, _):
        """
        Admin users can assign a referral.
        """
        user = UserFactory(is_staff=True)
        self.client.force_login(user)

        referral = ReferralFactory()
        assignee = UserFactory()
        referral.topic.unit.members.add(assignee)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": assignee.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ASSIGNED)
        self.assertEqual(response.json()["assignees"], [str(assignee.id)])

    def test_assign_referral_by_linked_user(self, _):
        """
        The referral's creator cannot assign it.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory(user=user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": "42"}
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_linked_unit_member(self, _):
        """
        Regular members of the linked unit cannot assign a referral.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        referral.topic.unit.members.add(user)
        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": "42"}
        )
        self.assertEqual(response.status_code, 403)

    def test_assign_referral_by_linked_unit_organizer(self, _):
        """
        Organizers of the linked unit can assign a referral.
        """
        user = UserFactory()
        self.client.force_login(user)

        referral = ReferralFactory()
        assignee = UserFactory()
        referral.topic.unit.members.add(assignee)
        referral.topic.unit.members.add(
            user, through_defaults={"role": UnitMembershipRole.OWNER}
        )

        response = self.client.post(
            f"/api/referrals/{referral.id}/assign/", {"assignee_id": assignee.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], ReferralState.ASSIGNED)
        self.assertEqual(response.json()["assignees"], [str(assignee.id)])
