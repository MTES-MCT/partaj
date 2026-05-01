"""
Transform all ReferralReportAttachment into ReferralReportAppendix.
For each attachment, creates an AppendixDocument (copying file metadata)
and a ReferralReportAppendix linked to it.
"""

import logging

from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import ReferralReportAppendix, ReferralReportAttachment
from ...models.attachment import AppendixDocument

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Transform all ReferralReportAttachment into ReferralReportAppendix.
    """

    help = __doc__

    def add_arguments(self, parser):
        parser.add_argument("from", type=int)
        parser.add_argument("to", type=int)

    def handle(self, *args, **options):
        attachments = ReferralReportAttachment.objects.select_related("report").filter(
            report__referral__id__gte=options["from"],
            report__referral__id__lte=options["to"],
        )

        total = attachments.count()
        logger.info("Found %d ReferralReportAttachment(s) to transform", total)

        # Track appendix_number per report
        report_counters = {}
        created = 0
        skipped = 0

        for attachment in attachments:
            report_id = attachment.report_id

            # Initialize counter for this report, starting after existing appendices
            if report_id not in report_counters:
                existing_max = (
                    ReferralReportAppendix.objects.filter(report_id=report_id)
                    .order_by("-appendix_number")
                    .values_list("appendix_number", flat=True)
                    .first()
                ) or 0
                report_counters[report_id] = existing_max

            report_counters[report_id] += 1

            try:
                with transaction.atomic():
                    if not attachment.report.get_last_publishment():
                        logger.info(
                            "No publishment found for referral appendix %s",
                            attachment.report.referral.id,
                        )
                        continue

                    # Create AppendixDocument with same file metadata
                    # name is preserved by save() since it's not empty
                    doc = AppendixDocument(
                        file=attachment.file,
                        name=attachment.name,
                        scan_id=attachment.scan_id,
                        scan_status=attachment.scan_status,
                    )
                    doc.save()

                    # Create ReferralReportAppendix
                    appendix = ReferralReportAppendix.objects.create(
                        report=attachment.report,
                        document=doc,
                        appendix_number=report_counters[report_id],
                    )
                    # attachment.report.get_last_publishment().appendices.add(appendix)

                    # Add it to the last report publishment
                    # Detach file from old attachment so delete() won't remove it from S3
                    attachment.detach_file()
                    attachment.delete()

                    created += 1
                    logger.info(
                        "Transformed attachment %s -> appendix %s (report %s)",
                        attachment.id,
                        appendix.id,
                        report_id,
                    )
            except (AttributeError, ValueError, TypeError, RuntimeError) as e:
                skipped += 1
                logger.error(
                    "Error transforming attachment in referral %s: %s",
                    attachment.report.referral.id,
                    e,
                )

        logger.info("Done: %d created, %d skipped out of %d", created, skipped, total)
