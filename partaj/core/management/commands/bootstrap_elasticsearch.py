"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""

import logging

from django.core.management.base import BaseCommand

from ...index_manager import regenerate_indices

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Bootstrap tasks include:
    - create indices for all relevant objects,
    - index all records in their respective indices;
    """

    help = __doc__

    def handle(self, *args, **options):
        # Keep track of starting time for logging purposes
        logger.info("Starting to regenerate ES indices...")

        # Creates new indices each time, populates them, and atomically replaces
        # the old indices once the new ones are ready.
        regenerate_indices(logger)

        # Confirm operation success through the logger
        logger.info("ES indices regenerated.")
