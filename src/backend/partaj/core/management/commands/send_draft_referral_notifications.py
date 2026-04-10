"""
Sending notifications to remind users about the existence of referrals that are still in draft status.
Must defined feature flag "referral_draft_reminder" in feature flag table with limit_date = start referral reminder
"""

import logging

from django.core.management.base import BaseCommand, CommandParser, CommandError
from django.utils import timezone
from datetime import timedelta

from partaj.core.models import Referral, ReferralReminder, ReferralState, ReminderType, FeatureFlag, FeatureFlagTag
from partaj.core.services.file_handler import HtmlConverter, TextExtractor
from partaj.core.email import Mailer

logger = logging.getLogger("partaj")
# pylint: disable=broad-except
# pylint: disable=too-many-branches


class Command(BaseCommand):
    """
    Notification rules:
    - Script can be run every day
    - Reminder sended only tuesday and thrusday
    - For referrals created after the feature flag date  

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
            logger.info("Reminders sent only on tuesday and thursday at 9 am")
            return

        logger.info("Starting draft referrals reminders...")

        # Reading feature flag
        try:
            feature_flag = FeatureFlag.objects.get(tag=FeatureFlagTag.REFERRAL_DRAFT_REMINDER)
        except FeatureFlag.DoesNotExist as e:
            logger.error(f"Erreur : {e}")
            raise CommandError("Please create FeatureFlag '%s' before using this command" % FeatureFlagTag.REFERRAL_DRAFT_REMINDER)

        # Load referrals and send reminders
        draft_referrals = self.load_draft_referrals_without_reminder(feature_flag.limit_date)

        for referral in draft_referrals:
            try:
                self.process_reminder(referral)
            except (ValueError, Exception) as e:
                logger.error(f"Erreur : {e}")
                logger.error("Can't notify referral %i", referral.id)

    def load_draft_referrals_without_reminder(self,start_date):

        threshold = start_date - timedelta(days=self.DELTA)  # exemple : plus récent que 7 jours

        # Extract referrals with state DRAFT and without DRAFT_REMINDER reminder sent
        draft_referrals = (
            Referral.objects.filter(
                state=ReferralState.DRAFT,
                created_at__gt=start_date
            )
            .exclude(reminders__type=ReminderType.DRAFT_REMINDER)
            .distinct()
            .order_by("-id")[:5]
        )

        return draft_referrals

    def process_reminder(self, referral):

        logger.info("Notify referal %i created_at: %s", referral.id, referral.created_at)

        for requester in referral.get_requesters():
            logger.info("Mail to: %s", requester.email)

        Mailer.send_referral_draft_reminder(referral)

        # notification = ReferralReminder.objects.create(
        #     referral=referral, type=ReminderType.DRAFT_REMINDER
        # )
