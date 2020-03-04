from django.conf import settings

from storages.backends.s3boto3 import S3Boto3Storage


class SecuredStorage(S3Boto3Storage):
    """
    Boto3 storage subclass to replace the URL provided by Boto3 by default (directly to the
    file on S3-compatible storage) with a URL that goes through Django for authentication and
    authorization.
    """

    def url(self, name, parameters=None, expire=None):
        """
        Generate a URL using our referral attachment files path prefix and the refeerral
        attachment id to easily get a hold of the file object in the view.
        """
        referral_attachment_id = name.rsplit("/", 1)[0]
        return f"/{settings.REFERRAL_ATTACHMENT_FILES_PATH}{referral_attachment_id}/"
