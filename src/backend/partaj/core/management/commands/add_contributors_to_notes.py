"""
Regenerate notes with the new contributors field
"""
import logging

from django.core.management.base import BaseCommand

from partaj.core.indexers import NotesIndexer
from partaj.core.models import Referral, ReferralNote

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    Regenerate notes with the new contributors field
    """

    help = __doc__

    def handle(self, *args, **options):
        """
        Regenerate notes with the new contributors field
        """
        logger.info("Starts notes regeneration")

        es_notes = []

        logger.info("Update notes in Postgres")

        for note in ReferralNote.objects.all():
            logger.info("Handling note %s", note.id)

            if note.contributors is not None and len(note.contributors) > 0:
                logger.info("--- Note already has a contributor list!")
                continue

            referral = Referral.objects.get(pk=note.referral_id)

            contributors = [user.get_full_name() for user in referral.assignees.all()]
            contributors.append(note.author)
            contributors = list(set(contributors))

            logger.info("--- Current author: %s", note.author)
            logger.info("--- Identified contributors: %s", contributors)

            note.contributors = contributors
            note.save()

            es_note = NotesIndexer.get_es_document_for_note(note)
            es_notes.append(es_note)
