"""
Transform referral report final version to publishment
"""

import logging

from django.core.management.base import BaseCommand

from ...models import Referral, ReferralReportPublishment

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    For referral with a report already published:
    - Create a ReferralReport Publishment
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
        logger.info("Start creating publishments")

        for referral in Referral.objects.filter(
            id__gte=options["from"], id__lte=options["to"]
        ).all():
            logger.info("Handling referral n° %s", referral.id)

            if not referral.report:
                logger.info(
                    "Referral %s skipped: no existing report",
                    referral.id,
                )
                continue

            try:
                if not referral.report.published_at:
                    logger.info(
                        "Referral %s skipped: report is not published yet.",
                        referral.id,
                    )
                    continue

                logger.info("Creating publishment from existing report data")

                if ReferralReportPublishment.objects.filter(
                    version=referral.report.get_last_version(), report=referral.report
                ).exists():
                    logger.info(
                        "Referral %s skipped: publishment with %s version "
                        "and %s report already exists",
                        referral.id,
                        referral.report.id,
                        referral.report.get_last_version(),
                    )
                    continue

                publishment = ReferralReportPublishment(
                    report=referral.report,
                    comment=referral.report.comment,
                    version=referral.report.get_last_version(),
                    created_by=referral.report.get_last_version().created_by,
                )

                publishment.save()
                logger.info("Publishment creation done.")

            except Exception as exception:
                logger.warning(
                    "Global Exception: Referral n° %s :failed to create publishment :",
                    referral.id,
                )
                for i in exception.args:
                    logger.info(i)
