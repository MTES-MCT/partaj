"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""
import logging

from django.core.management.base import BaseCommand

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Update notes
    - Extract and sav text from DB notes files
    - Create / Update / Remove notes in elastic search index
    """

    help = __doc__

    def handle(self, *args, **options):
        logger.info("Starting to update notes...")
        logger.info("Notes updated.")
