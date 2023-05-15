"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""
import logging

from django.core.management.base import BaseCommand

from partaj.core.indexers import NotesIndexer

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Send notes to ElasticSearch depending on publication date's range
    specified in args.
    """

    help = __doc__

    def add_arguments(self, parser):
        """
        Define arguments
        """
        parser.add_argument("from", type=str)
        parser.add_argument("to", type=str)

    def handle(self, *args, **options):
        # Keep track of starting time for logging purposes
        from_date = options["from"]
        to_date = options["to"]
        logger.info(
            "Starting to populate Note index with notes from %s to %s ...",
            from_date,
            to_date,
        )

        NotesIndexer.upsert_notes_documents_by_publication_date(
            from_date=from_date, to_date=to_date, logger=logger
        )

        logger.info("ES notes sent")
