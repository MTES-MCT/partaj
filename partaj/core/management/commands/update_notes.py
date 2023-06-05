"""
Handle ElasticSearch setup that needs to be done at bootstrap time.
"""
import logging

from django.core.management.base import BaseCommand

from partaj.core.indexers import NotesIndexer
from partaj.core.management.commands.generate_notes import SupportedExtensionTypes
from partaj.core.models import ReferralNote, ReferralNoteStatus
from partaj.core.services.file_handler import HtmlConverter, TextExtractor

logger = logging.getLogger("partaj")
# pylint: disable=broad-except
# pylint: disable=too-many-branches


class Command(BaseCommand):
    """
    Update notes
    - 1- Extract and save text from RECEIVED status notes files
    - 2- Create / Remove notes in elastic search index
    """

    help = __doc__

    def handle(self, *args, **options):
        logger.info("Starting to update notes...")

        # 1- Extract and save text from RECEIVED status notes files
        received_notes = ReferralNote.objects.filter(
            state=ReferralNoteStatus.RECEIVED
        ).all()

        for note in received_notes:
            try:
                extension = note.document.get_extension()
                logger.info("Found %s type", extension)

                if extension not in SupportedExtensionTypes.values:
                    logger.warning("Extension %s not supported, ignoring", extension)
                    note.state = ReferralNoteStatus.ERROR
                    note.save()
                    continue

                if extension == SupportedExtensionTypes.DOCX:
                    if not note.text:
                        note.text = TextExtractor().from_docx(note.document)
                    if not note.html:
                        note.html = HtmlConverter().from_docx(note.document)

                elif extension == SupportedExtensionTypes.PDF:
                    if not note.text:
                        note.text = TextExtractor.from_pdf(note.document)

                note.state = ReferralNoteStatus.TO_SEND
                note.save()
            except (ValueError, Exception) as error:
                note.state = ReferralNoteStatus.ERROR
                note.save()
                logger.warning(
                    "Value Error: Referral n° %s :failed to create notice :",
                    note.referral.id,
                )
                for i in error.args:
                    logger.info(i)

        # 2- Create / Remove notes in elastic search index
        try:
            upsert_result = NotesIndexer.upsert_notes_documents_by_state(
                state=ReferralNoteStatus.TO_SEND, logger=logger
            )
            logger.info("Result: %s", upsert_result)
            ReferralNote.objects.filter(state=ReferralNoteStatus.TO_SEND).update(
                state=ReferralNoteStatus.ACTIVE
            )
        except (ValueError, Exception) as error:
            logger.error("Unable to upsert notes:")
            for i in error.args:
                logger.error(i)

        try:
            delete_result = NotesIndexer.delete_notes_documents_by_state(
                state=ReferralNoteStatus.TO_DELETE, logger=logger
            )
            logger.info("Delete result: %s", delete_result)
            ReferralNote.objects.filter(state=ReferralNoteStatus.TO_DELETE).update(
                state=ReferralNoteStatus.INACTIVE
            )
        except (ValueError, Exception) as error:
            logger.error("Unable to delete notes:")
            for i in error.args:
                logger.error(i)

        logger.info("Notes updated.")
