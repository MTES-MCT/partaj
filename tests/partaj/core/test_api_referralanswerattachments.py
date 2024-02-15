import uuid
from io import BytesIO

from django.test import TestCase

from rest_framework.authtoken.models import Token

from partaj.core import factories, models


class ReferralAnswerAttachmentApiTestCase(TestCase):
    """
    Test API routes related to ReferralAnswerAttachment endpoints.
    """

    # CREATE TESTS
    def test_create_referralanswerattachment_by_anonymous_user(self):
        """
        Anonymous users cannot create referral answer attachments.
        """
        answer = factories.ReferralAnswerFactory()
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": str(answer.id), "files": (BytesIO(b"attachment_file"),)},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_by_random_logged_in_user(self):
        """
        Random logged in users cannot create attachments for referral answers they have no
        link to.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory()
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": str(answer.id), "files": (BytesIO(b"attachment_file"),)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_by_referral_linked_user(self):
        """
        A referral's linked user cannot create attachments for answers to their referral.
        """
        answer = factories.ReferralAnswerFactory()
        user = answer.referral.users.first()
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": str(answer.id), "files": (BytesIO(b"attachment_file"),)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_by_referral_linked_unit_member(self):
        """
        A member of a referral's linked unit cannot create attachments for answers to the referral
        if they are not said answer's author.
        """
        user = factories.UserFactory()
        answer = factories.ReferralAnswerFactory()
        answer.referral.units.get().members.add(user)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": str(answer.id), "files": (BytesIO(b"attachment_file"),)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_by_answer_author(self):
        """
        An answer's author can create attachments for it.
        """
        answer = factories.ReferralAnswerFactory()
        attachment_file = BytesIO(b"attachment_file")
        attachment_file.name = "the attachment file name"

        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": str(answer.id), "files": (attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=answer.created_by)[0]}",
        )

        self.assertEqual(response.status_code, 201)
        attachment = models.ReferralAnswerAttachment.objects.get(
            id=response.json()["id"]
        )
        self.assertEqual(attachment.name, "the attachment file name")
        self.assertEqual(attachment.size, 15)

    def test_create_referralanswerattachment_for_nonexistent_answer(self):
        """
        The request fails with an apprioriate error when a user attempts to create an attachment
        for an answer that does not exist.
        """
        user = factories.UserFactory()
        attachment_file = BytesIO(b"attachment_file")
        attachment_file.name = "the attachment file name"

        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": uuid.uuid4(), "files": (attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_missing_answer_param(self):
        """
        The request fails with an apprioriate error when a user attempts to create an attachment
        but does not provide the answer param.
        """
        user = factories.UserFactory()
        attachment_file = BytesIO(b"attachment_file")
        attachment_file.name = "the attachment file name"

        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"files": (attachment_file,)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=user)[0]}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_missing_file(self):
        """
        The request fails with an apprioriate error when a user attempts to create an attachment
        but does not any file.
        """
        answer = factories.ReferralAnswerFactory()

        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {"answer": str(answer.id)},
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=answer.created_by)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Referral answer attachments cannot be created without a file."
                ]
            },
        )
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)

    def test_create_referralanswerattachment_multiple_files(self):
        """
        The request fails with an apprioriate error when a user attempts to create an attachment
        with more than one attached file.
        """
        answer = factories.ReferralAnswerFactory()

        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
        response = self.client.post(
            "/api/referralanswerattachments/",
            {
                "answer": str(answer.id),
                "files": (BytesIO(b"firstfile"), BytesIO(b"secondfile")),
            },
            HTTP_AUTHORIZATION=f"Token {Token.objects.get_or_create(user=answer.created_by)[0]}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "errors": [
                    "Referral answer attachments cannot be created with more than one file."
                ]
            },
        )
        self.assertEqual(models.ReferralAnswerAttachment.objects.all().count(), 0)
