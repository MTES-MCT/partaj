import logging

from django.core.management.base import BaseCommand
from ...models import (  # isort:skip
    Referral,
    ReferralState,
)

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    def handle(self, *args, **options):
        for referral in Referral.objects.all():
            if (
                referral.state != ReferralState.DRAFT
                and referral.default_send_to_knowledge_base is None
            ):
                logger.info("Found a non draft referral without send to kdb state")

                # Get the default value depending on the unit
                send_to_knowledge_base = False
                for unit in referral.units.all():
                    if unit.kdb_export == True:
                        send_to_knowledge_base = True

                # We set the default send status to the current selected defaults for the units
                referral.default_send_to_knowledge_base = send_to_knowledge_base

                # Case when a referral has a note in knowledge base but shouldn't have one by default
                if referral.note and send_to_knowledge_base == False:
                    logger.info(
                        "Found a referral in kdb that shouldn't be there, overriding send to kdb state"
                    )
                    # If the default value is False but the note exist, then we set the override value
                    referral.override_send_to_knowledge_base = True
                # Case when it's a referral that wasn't sent to the knowledge base, but by default it should
                elif (
                    not referral.note
                    and referral.report
                    and referral.report.published_at
                    and send_to_knowledge_base == True
                ):
                    logger.info(
                        "Found a referral not in kdb that should be there, overriding send to kdb state"
                    )
                    # If the default value is True but the note doesn't exist, then we set the override value
                    referral.override_send_to_knowledge_base = False

                referral.save()
