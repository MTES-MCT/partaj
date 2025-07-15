"""
Update ReferralNote states
"""
import logging

from django.core.management.base import BaseCommand

from partaj.core.models import Referral, ReferralNoteStatus

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Update notes of unit kdb_export=False to DELETE state
    in order to remove them from Knowledge Database
    """

    help = __doc__

    def handle(self, *args, **options):
        logger.info("Starting to update notes...")

        referrals = Referral.objects.filter(units__kdb_export=False)
        logger.info("Found %d referrals to process", referrals.count())

        for referral in referrals:
            logger.info("Processing referral %s", referral.id)
            if referral.note:
                logger.info("Updating note for referral %s", referral.id)
                referral.note.state = ReferralNoteStatus.TO_DELETE
                referral.note.save()

        logger.info("Notes updated.")
