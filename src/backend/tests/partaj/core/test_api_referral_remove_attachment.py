from io import BytesIO

from django.core.files.base import File
from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralApiRemoveAttachmentTestCase(TestCase):
    """
    Test API routes and actions related to the Referral "remove_attachment" endpoint.
    """

    def _build_attachment(self, referral, filename="file.pdf"):
        attachment_file = BytesIO(b"attachment_content")
        attachment_file.name = filename
        return models.ReferralAttachment.objects.create(
            referral=referral,
            file=File(attachment_file),
        )

    def test_remove_attachment_by_anonymous_user(self):
        """
        Anonymous users cannot remove an attachment.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        attachment = self._build_attachment(referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_attachment/",
            {"attachment": str(attachment.id)},
        )
        self.assertEqual(response.status_code, 401)
        self.assertTrue(
            models.ReferralAttachment.objects.filter(id=attachment.id).exists()
        )

    def test_remove_attachment_by_random_logged_in_user(self):
        """
        Random logged-in users cannot remove an attachment.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        attachment = self._build_attachment(referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_attachment/",
            {"attachment": str(attachment.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            models.ReferralAttachment.objects.filter(id=attachment.id).exists()
        )

    def test_remove_attachment_by_unit_member(self):
        """
        Unit members who are not requesters cannot remove an attachment.
        """
        referral = factories.ReferralFactory(state=models.ReferralState.DRAFT)
        user = factories.UnitMembershipFactory(
            role=models.UnitMembershipRole.MEMBER, unit=referral.units.get()
        ).user
        attachment = self._build_attachment(referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_attachment/",
            {"attachment": str(attachment.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            models.ReferralAttachment.objects.filter(id=attachment.id).exists()
        )

    def test_remove_attachment_by_requester_on_draft(self):
        """
        The requester of a draft referral can remove one of its attachments.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )
        attachment = self._build_attachment(referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_attachment/",
            {"attachment": str(attachment.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(
            models.ReferralAttachment.objects.filter(id=attachment.id).exists()
        )

    def test_remove_attachment_on_non_draft_referral(self):
        """
        Attachments cannot be removed once the referral has left the DRAFT state.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.RECEIVED, post__users=[user]
        )
        attachment = self._build_attachment(referral)

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_attachment/",
            {"attachment": str(attachment.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "attachments cannot be removed from a non draft referral"
                ]
            },
        )
        self.assertTrue(
            models.ReferralAttachment.objects.filter(id=attachment.id).exists()
        )

    def test_remove_attachment_with_unknown_id(self):
        """
        When the attachment id does not exist on the referral, the endpoint returns 400.
        """
        user = factories.UserFactory()
        referral = factories.ReferralFactory(
            state=models.ReferralState.DRAFT, post__users=[user]
        )
        unknown_id = "00000000-0000-0000-0000-000000000000"

        response = self.client.post(
            f"/api/referrals/{referral.id}/remove_attachment/",
            {"attachment": unknown_id},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("does not exist", response.json()["errors"][0])
