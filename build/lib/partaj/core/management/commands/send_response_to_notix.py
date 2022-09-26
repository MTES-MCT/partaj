"""
Send referral's answer to notix
"""
import logging

from django.core.management.base import BaseCommand

from ... import models, services
from ...models import Referral, ReferralAnswer
from ...requests.note_api_request import NoteApiRequest

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    send a list of referral's answer to Notix

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
        Send  referral's answer to notix
        """
        # Keep track of starting time for logging purposes
        logger.info("Start to sending response to Notix...")

        api_note_request = NoteApiRequest()

        for referral in Referral.objects.all()[options["from"] : options["to"]]:
            logger.info("Handling referral n° %s", referral.id)
            try:
                if services.FeatureFlagService.get_referral_version(referral) == 1:
                    if not referral.report or not referral.report.published_at:
                        logger.info(
                            "Ignoring referral n° %s : no report or publishment date founded.",
                            referral.id,
                        )
                        continue

                    api_note_request.post_note_new_answer_version(referral)
                    logger.info(
                        "Referral n° %s : notice created with success.", referral.id
                    )

                else:
                    referral_answer = ReferralAnswer.objects.filter(
                        state=models.ReferralAnswerState.PUBLISHED,
                        referral__id=referral.id,
                    ).last()

                    if not referral_answer:
                        logger.info(
                            "Ignoring referral n° %s : no published referral answer.",
                            referral.id,
                        )
                        continue

                    api_note_request.post_note(referral_answer)

                    logger.info(
                        "Referral n° %s : notice created with success.",
                        referral.id,
                    )

            except ValueError as exception:
                logger.warning("Referral n° %s :failed to create notice :", referral.id)
                for i in exception.args:
                    logger.info(i)

            except Exception as exception:
                logger.warning("Referral n° %s :failed to create notice :", referral.id)
                for i in exception.args:
                    logger.info(i)
