"""
Sending notifications to remind users about the existence of referrals that are still in draft status.
"""

import logging

from django.core.management.base import BaseCommand, CommandParser
from django.utils import timezone

from partaj.core.management.commands.generate_notes import SupportedExtensionTypes
from partaj.core.models import Referral, ReferralReminder, ReferralState, ReminderType
from partaj.core.services.file_handler import HtmlConverter, TextExtractor

logger = logging.getLogger("partaj")
# pylint: disable=broad-except
# pylint: disable=too-many-branches


class Command(BaseCommand):
    """
    Notification rules:
    - ***********
    - ***********

    """

    help = __doc__

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force sending reminders",
        )

    def handle(self, *args, **options):

        forced = False
        if options["force"]:
            self.stdout.write("Mode forcé activé")
            forced = True

        today = timezone.now().weekday()

        # Monday = 0, Tuesday = 1, ..., Sunday = 6
        if today not in (1, 3, 4) and not forced:  # 1 = mardi, 3 = jeudi
            logger.info("Reminders sent only on tuesday and thursday at 9am")
            return

        logger.info("Starting draft referrals reminders...")

        draft_referrals = self.load_draft_referrals_without_reminder()

        for referral in draft_referrals:
            try:
                self.process_reminder(referral)
            except (ValueError, Exception) as e:
                logger.error(f"Erreur : {e}")
                logger.error("Can't notify referral %i", referral.id)

    def load_draft_referrals_without_reminder(self):

        # Extract referrals with state DRAFT and without DRAFT_REMINDER reminder sent
        draft_referrals = (
            Referral.objects.filter(state=ReferralState.DRAFT)
            .exclude(reminders__type=ReminderType.DRAFT_REMINDER)
            .distinct()
            .order_by("-id")[:5]
        )

        return draft_referrals

    def process_reminder(self, referral):

        logger.info("Notify referal %i", referral.id)

        for requester in referral.get_requesters():
            logger.info("Mail to: %s", requester.email)

        notification = ReferralReminder.objects.create(
            referral=referral, type=ReminderType.DRAFT_REMINDER
        )
