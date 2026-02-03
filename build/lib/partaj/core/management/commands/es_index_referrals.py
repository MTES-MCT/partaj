"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""

import logging

from django.core.management.base import BaseCommand

from partaj.core.indexers import ReferralsIndexer

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Send referrals to ElasticSearch depending on id range
    specified in args.
    Ex: docker-compose exec app python manage.py es_index_referrals 0 1000
    """

    help = __doc__

    def add_arguments(self, parser):
        """
        Define arguments
        """
        parser.add_argument("from", type=int)
        parser.add_argument("to", type=int)

    def handle(self, *args, **options):
        # Keep track of starting time for logging purposes
        from_id = options["from"]
        to_id = options["to"]
        logger.info(
            "Starting to populate Referrals index with referrals from %s to %s ...",
            from_id,
            to_id,
        )

        ReferralsIndexer.insert_referrals_documents_by_id_range(
            from_id=from_id, to_id=to_id, logger=logger
        )

        logger.info("ES Referrals sent")
