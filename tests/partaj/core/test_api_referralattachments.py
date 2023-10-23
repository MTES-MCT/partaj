from io import BytesIO

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralAttachmentApiTestCase(TestCase):
    """
    Test API routes related to ReferralAttachment endpoints.
    """

    def test_create_referralattachment_by_requester(self):
        """
        An requestr can create attachments for it.
        """

        referral = factories.ReferralFactory()
        token = Token.objects.get_or_create(user=referral.users.first())[0]

        attachment_file = BytesIO(b"attachment_file")
        attachment_file.name = "the attachment file name.docx"

        response = self.client.post(
            "/api/referralattachments/",
            {"referral": str(referral.id), "files": (attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {token}",
        )

        self.assertEqual(response.status_code, 201)
        attachment = models.ReferralAttachment.objects.get(id=response.json()["id"])
        self.assertEqual(attachment.name, "the attachment file name")
        self.assertEqual(attachment.size, 15)

    def test_create_referralattachment_by_requester_with_format_not_supported(self):
        """
        It does not accept executable format
        """

        referral = factories.ReferralFactory()
        token = Token.objects.get_or_create(user=referral.users.first())[0]

        attachment_file = BytesIO(b"attachment_file")
        attachment_file.name = "the attachment file name.exe"

        response = self.client.post(
            "/api/referralattachments/",
            {"referral": str(referral.id), "files": (attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(response.status_code, 415)
        self.assertEqual(response.json()["errors"][0], "Uploaded File cannot be in exe format.")
        self.assertEqual(response.json()["code"], "error_file_format_forbidden")
