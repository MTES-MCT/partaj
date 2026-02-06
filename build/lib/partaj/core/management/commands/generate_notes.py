# pylint: disable=fixme
# pylint: disable=too-many-branches
# pylint: disable=too-many-statements
# pylint: disable=too-many-nested-blocks
"""
Transform referral answers to Notes
"""

import logging

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from partaj.core.transform_prosemirror_pdf import TransformProsemirrorPdf
from partaj.core.transform_prosemirror_text import TransformProsemirrorText

from ... import models, services
from ...services.file_handler import HtmlConverter, TextExtractor

from ...models import (  # isort:skip
    NoteDocument,
    Referral,
    ReferralAnswer,
    ReferralNote,
    ReferralUserLinkRoles,
    SupportedExtensionTypes,
    ReferralNoteStatus,
)

logger = logging.getLogger("partaj")


class Command(BaseCommand):
    """
    For referral without notes yet :
    - Retrieve every referral according to provided dates
    - Create a ReferralNote with its document depending on referral answer version
    - Set state to ReferralNoteStatus.TO_SEND
    -> Notes are ready to be sent in ElasticSearch with update_notes command
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
        Send  referral's answer to ES
        """
        logger.info("Start exporting notes ...")
        for referral in Referral.objects.filter(
            id__gte=options["from"], id__lte=options["to"]
        ).all():
            logger.info("Handling referral n° %s", referral.id)

            send_to_knowledge_base = referral.override_send_to_knowledge_base

            if send_to_knowledge_base is None:
                send_to_knowledge_base = referral.default_send_to_knowledge_base

            if referral.note:
                logger.info(
                    "Referral %s skipped: note %s already exists",
                    referral.id,
                    referral.note.id,
                )
                continue

            if not send_to_knowledge_base:
                logger.info(
                    "Referral skipped: Unit is blacklisted from export",
                )
                continue
            try:
                if services.FeatureFlagService.get_referral_version(referral) == 1:
                    logger.info("Referral answer Version 2 detected")

                    if not referral.report or not referral.report.published_at:
                        logger.info(
                            "Referral %s skipped: no report or published date founded.",
                            referral.id,
                        )
                        continue

                    logger.info("Checking for final report version sent document")
                    document = referral.report.final_version.document

                    # Creates note and fill extracted text and html with a freshly saved
                    # NoteDocument
                    note, error = self._handle_document(document)

                    if error:
                        logger.info(error)
                        continue

                    # Commons v1 / v2
                    note.referral_id = str(referral.id)
                    note.object = referral.object
                    note.topic = referral.topic.name
                    note.assigned_units_names = [
                        unit.name for unit in referral.units.all()
                    ]
                    note.requesters_unit_names = [
                        user.unit_name
                        for user in referral.users.filter(
                            referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                        ).all()
                    ]
                    # Specific v2
                    note.publication_date = referral.report.published_at
                    note.author = (
                        referral.report.final_version.created_by.get_full_name()
                    )

                    contributors = [
                        user.get_full_name() for user in referral.assignees.all()
                    ]
                    contributors.append(note.author)

                    # The last version author isn't necessarily an assigned user
                    # of the referral, hence why we need to add it manually and then
                    # filter duplicates
                    note.contributors = list(set(contributors))

                    note.state = ReferralNoteStatus.TO_SEND
                    note.save()
                    referral.note = note
                    referral.save()

                else:
                    logger.info("Referral answer Version 1 detected")
                    referral_answer = ReferralAnswer.objects.filter(
                        state=models.ReferralAnswerState.PUBLISHED,
                        referral__id=referral.id,
                    ).last()

                    if not referral_answer:
                        logger.info(
                            "Ignoring referral n° %s : "
                            "no published referral answer.",
                            referral.id,
                        )
                        continue

                    attachments = referral_answer.attachments.all()

                    # Case no attachment with the answer or answer manually forced to EDITOR
                    if len(attachments) == 0 or referral.answer_properties == "EDITOR":
                        note, error = self._create_document_v1_editor(referral_answer)
                        if error:
                            logger.info(error)
                            continue

                        # Commons v1 / v2
                        note.referral_id = str(referral.id)
                        note.object = referral.object
                        note.topic = referral.topic.name
                        note.assigned_units_names = [
                            unit.name for unit in referral.units.all()
                        ]
                        note.requesters_unit_names = [
                            user.unit_name
                            for user in referral.users.filter(
                                referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                            ).all()
                        ]

                        # Specific v1
                        note.publication_date = referral_answer.created_at
                        note.author = referral_answer.created_by.get_full_name()

                        note.state = ReferralNoteStatus.TO_SEND
                        note.save()
                        referral.note = note
                        referral.save()

                    # Case one or multiple attachments with the answer
                    elif len(attachments) > 0:
                        if not referral.answer_properties:
                            logger.info(
                                "Ignoring %s: "
                                "Unable to choose between multiple attachments or "
                                "attachment and editor, no answer properties filled yet",
                                referral.id,
                            )
                        else:
                            # Get referral attachment id
                            attachment_id = referral.answer_properties.replace(
                                "ATTACHMENT_", ""
                            )
                            try:
                                logger.info(
                                    "Searching fo attachment %s: ",
                                    attachment_id,
                                )
                                attachment = (
                                    models.ReferralAnswerAttachment.objects.get(
                                        id=attachment_id
                                    )
                                )

                                note, error = self._handle_document(attachment)

                                if error:
                                    logger.info(error)
                                    continue

                                # Commons v1 / v2
                                note.referral_id = str(referral.id)
                                note.object = referral.object
                                note.topic = referral.topic.name
                                note.assigned_units_names = [
                                    unit.name for unit in referral.units.all()
                                ]
                                note.requesters_unit_names = [
                                    user.unit_name
                                    for user in referral.users.filter(
                                        referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                                    ).all()
                                ]

                                # Specific v1
                                note.author = referral_answer.created_by.get_full_name()
                                note.publication_date = referral_answer.created_at

                                # TODO Saving note needed?
                                note.save()
                                referral.note = note
                                referral.save()
                                logger.info("Referral n° %s : OK", referral.id)
                            except models.ReferralAnswerAttachment.DoesNotExist:
                                logger.warning(
                                    "Ignoring %s: "
                                    "Unable to find attachment with id %s :/",
                                    referral.id,
                                    attachment_id,
                                )

            except ValueError as exception:
                logger.warning(
                    "Value Error: Referral n° %s :failed to create notice :",
                    referral.id,
                )
                for i in exception.args:
                    logger.info(i)

            except Exception as exception:
                logger.warning(
                    "Global Exception: Referral n° %s :failed to create notice :",
                    referral.id,
                )
                logger.warning(exception)
                for i in exception.args:
                    logger.info(i)

    def _handle_document(self, document):
        extension = document.get_extension()
        logger.info("Found %s type", extension)

        if extension not in SupportedExtensionTypes.values:
            return None, f"Extension {extension} not supported, ignoring"

        note = ReferralNote()

        if extension == SupportedExtensionTypes.DOCX:
            note.text = TextExtractor().from_docx(document)
            note.html = HtmlConverter().from_docx(document)

        if extension == SupportedExtensionTypes.PDF:
            note.text = TextExtractor.from_pdf(document)

        note_document = NoteDocument()
        note_document.file = document.file
        note_document.name = document.name
        note_document.save()
        note.document = note_document

        return note, None

    def _create_document_v1_editor(self, referral_answer):
        logger.info(
            "Handling referral %s: Create pdf document from editor",
            referral_answer.referral.id,
        )

        transform_mirror_text = TransformProsemirrorText()
        text = transform_mirror_text.referral_to_text(referral_answer.content)

        transform_mirror_pdf = TransformProsemirrorPdf()
        pdf = transform_mirror_pdf.referral_to_pdf2(referral_answer.content)

        new_file = ContentFile(
            pdf.output(), name=f"PARTAJ_note_saisine_{referral_answer.referral.id}.pdf"
        )
        document = models.NoteDocument.objects.create(file=new_file)

        note = ReferralNote()
        note.document = document
        note.text = text

        return note, None
