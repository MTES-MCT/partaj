"""
Storage related classes to configure the way Django stores assets.
"""

from django.conf import settings

from botocore.config import Config
from storages.backends.s3boto3 import S3Boto3Storage
from whitenoise.storage import CompressedStaticFilesStorage


class RelaxedCompressedStaticFilesStorage(CompressedStaticFilesStorage):
    """
    Custom whitenoise storage that doesn't fail on missing source map files.
    Uses CompressedStaticFilesStorage instead of CompressedManifestStaticFilesStorage
    to avoid strict manifest checking that fails on missing source maps from
    node_modules (e.g., @sentry/browser).
    """

    pass


# pylint: disable=abstract-method
class SecuredStorage(S3Boto3Storage):
    """
    Boto3 storage subclass to replace the URL provided by Boto3 by default (directly to the
    file on S3-compatible storage) with a URL that goes through Django for authentication and
    authorization.
    """

    def __init__(self, **kwargs):
        # Disable trailing checksum for S3-compatible providers that don't support it
        kwargs.setdefault(
            "client_config",
            Config(
                request_checksum_calculation="when_required",
                response_checksum_validation="when_required",
            ),
        )
        super().__init__(**kwargs)

    def url(self, name, parameters=None, expire=None, http_method=None):
        """
        Generate a URL using our referral attachment files path prefix and the referral
        attachment id to easily get a hold of the file object in the view.
        """
        referral_attachment_id = name.rsplit("/", 1)[0]
        return f"/{settings.ATTACHMENT_FILES_PATH}{referral_attachment_id}/"
