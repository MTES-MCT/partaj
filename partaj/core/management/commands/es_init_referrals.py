"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""
import logging

from django.core.management.base import BaseCommand

from ...index_manager import regenerate_referral_index

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Initialize an empty note index
    """

    help = __doc__

    def handle(self, *args, **options):
        logger.info("Starting referrals index creation...")

        regenerate_referral_index(logger=logger)

        logger.info("Referral index setup finished")
