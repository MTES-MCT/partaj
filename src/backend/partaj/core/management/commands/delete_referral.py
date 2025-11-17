"""
Transform referral report final version to publishment
"""
import logging

from django.core.management.base import BaseCommand

from ...indexers import ReferralsIndexer
from ...models import Referral, ReferralNote

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    For a referral and its note if exists
    - Delete referral and its dashboard (ES) link
    - Delete referral's note and its knowledge database (ES) link
    """

    help = __doc__

    def add_arguments(self, parser):
        """
        Define arguments
        """
        parser.add_argument("referral", type=int)

    # pylint: disable=broad-except
    def handle(self, *args, **options):
        """
        Delete referral and note depending on all ES links
        """
        logger.info("Handling referral %s", options["referral"])

        try:
            logger.info("Looking for referral %s in db", options["referral"])
            referral = Referral.objects.get(id=options["referral"])
            referral.delete()
            logger.info("Referral deleted")
        except Referral.DoesNotExist:
            logger.info(
                "Referral %s do not exist, check for its dashboard link and delete notes",
                options["referral"],
            )
            ReferralsIndexer.delete_referral_document(Referral(id=options["referral"]))
            logger.info("Deleting note %s in db", options["referral"])
            try:
                note = ReferralNote.objects.get(referral_id=options["referral"])
                note.delete()
            except ReferralNote.DoesNotExist:
                logger.info("Note with referral %s do not exist", options["referral"])
        except Exception as exception:
            logger.warning(
                "A problem occured deleting the referral %s :", options["referral"]
            )
            for i in exception.args:
                logger.warning(i)
