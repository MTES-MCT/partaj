"""
Transform all ReferralReportAttachment into ReferralReportAppendix.
For each attachment, creates an AppendixDocument (copying file metadata)
and a ReferralReportAppendix linked to it.
"""

import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import ReferralReportAppendix

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Add all ReferralReportAppendix to Publishments.
    """

    help = __doc__

    def add_arguments(self, parser):
        parser.add_argument("from", type=int)
        parser.add_argument("to", type=int)

    def handle(self, *args, **options):
        appendices = ReferralReportAppendix.objects.select_related("report").filter(
            report__referral__id__gte=options["from"],
            report__referral__id__lte=options["to"],
        )

        total = appendices.count()
        logger.info("Found %d ReferralReportAppendix(ces) to transform", total)

        # Track appendix_number per report
        created = 0
        skipped = 0

        for appendix in appendices:

            try:
                with transaction.atomic():
                    publishment = appendix.report.get_last_publishment()

                    if publishment is None:
                        skipped += 1
                        logger.warning(
                            "No publishment found for report %s, skipping appendix %s",
                            appendix.report.id,
                            appendix.id,
                        )
                        continue

                    if publishment.appendices.filter(id=appendix.id).exists():
                        skipped += 1
                        logger.info(
                            "Appendix %s already in publishment %s, skipping",
                            appendix.id,
                            publishment.id,
                        )
                        continue

                    publishment.appendices.add(appendix)

                    created += 1
                    logger.info(
                        "Add appendix %s to report from referral %s",
                        appendix.id,
                        appendix.report.id,
                    )
            except (ValueError, TypeError, RuntimeError) as e:
                skipped += 1
                logger.error("Error adding appendix %s: %s", appendix.id, e)

        logger.info("Done: %d created, %d skipped out of %d", created, skipped, total)
