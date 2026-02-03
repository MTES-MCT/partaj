"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""

import logging

from django.core.management.base import BaseCommand

from ...index_manager import regenerate_note_index

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Initialize an empty note index
    """

    help = __doc__

    def handle(self, *args, **options):
        logger.info("Starting notes index creation...")

        regenerate_note_index(logger=logger)

        logger.info("Notes index setup finished")
