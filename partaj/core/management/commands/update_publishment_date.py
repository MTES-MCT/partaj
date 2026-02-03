"""
Update ReferralNote states
"""

import logging

from django.core.management.base import BaseCommand

from partaj.core.models import Referral

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Update report publishment date to last publishment
    creation if exists
    """

    help = __doc__

    def add_arguments(self, parser):
        """
        Define arguments
        """
        parser.add_argument("from", type=int)
        parser.add_argument("to", type=int)

    # pylint: disable=broad-except
    def handle(self, *args, **options):
        """
        Create ReferralReportPublishment from Report Final Version
        """
        logger.info("Start updating publishment dates")

        for referral in Referral.objects.filter(
            id__gte=options["from"], id__lte=options["to"]
        ).all():
            logger.info("Handling referral n° %s", referral.id)

            if (
                referral.report
                and len(referral.report.publishments.all()) > 0
                and not referral.report.published_at
            ):
                logger.info(
                    "Referral n° %s has a publishment, update its publishment date",
                    referral.id,
                )
                publishment_date = referral.report.get_last_publishment().created_at

                referral.report.published_at = publishment_date
                referral.report.save()
