# pylint: disable=fixme
# pylint: disable=too-many-branches
# pylint: disable=too-many-statements
"""
Transform referral answers to Notes
"""
import logging
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import models as db_models

import mammoth
from pdfminer.high_level import extract_text, extract_text_to_fp

from partaj.core.models import UnitUtils
from partaj.core.transform_prosemirror_pdf import TransformProsemirrorPdf
from partaj.core.transform_prosemirror_text import TransformProsemirrorText

from ... import models, services
from ...models import NoteDocument, Referral, ReferralAnswer, ReferralNote, ReferralUserLinkRoles

logger = logging.getLogger("partaj")


class SupportedExtensionTypes(db_models.TextChoices):
    """
    Enum of possible extensions handled by Archivaj.
    """

    PDF = ".pdf"
    DOCX = ".docx"


class Command(BaseCommand):
    """
    Send a list of referral's answer to Notix
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
        logger.info("Start exporting notes ...")

        for referral in Referral.objects.order_by("id")[
            options["from"] : options["to"]
        ].all():
            logger.info("Handling referral n° %s", referral.id)

            # TODO Check if referral has already a note and skip
            # OR add force argument to remove and recreate an other one
            # /!\ DELETING A NOTE CAN DELETE ITS DOCUMENT AND THE S3 FILE !!
            # MAYBE RECREATE A NEW FILE FOR NOTES ??
            for unit in referral.units.all():
                if unit.name in UnitUtils.get_exported_blacklist_unit():
                    logger.info(
                        "Referral skipped: Unit %s is blacklisted from export",
                        unit.name,
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

                    # TODO Saving note needed?
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
                    for unit in referral_answer.referral.units.all():
                        if unit.name in UnitUtils.get_exported_blacklist_unit():
                            logger.info(
                                "Ignoring referral n° %s :"
                                " unit %s blacklisted in Archivaj.",
                                referral.id,
                                unit.name,
                            )

                    attachments = referral_answer.attachments.all()
                    if len(attachments) == 0:
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

                        # TODO Saving note needed?
                        note.save()
                        referral.note = note
                        referral.save()
                        continue

                    if len(attachments) > 1:
                        logger.info(
                            "Ignoring %s: "
                            "Found more than one attachment in referral answer",
                            referral.id,
                        )
                        continue

                    note, error = self._handle_document(attachments[0])

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
                    continue

            # TODO Handle Exceptions
            except ValueError as exception:
                logger.warning("Referral n° %s :failed to create notice :", referral.id)
                for i in exception.args:
                    logger.info(i)

            except Exception as exception:
                logger.warning("Referral n° %s :failed to create notice :", referral.id)
                for i in exception.args:
                    logger.info(i)

    def _handle_document(self, document):
        extension = document.get_extension()
        logger.info("Found %s type", extension)

        if extension not in SupportedExtensionTypes.values:
            return None, f"Extension {extension} not supported, ignoring"

        note = ReferralNote()

        if extension == SupportedExtensionTypes.DOCX:
            with document.file.open("rb") as file:
                result = mammoth.convert_to_html(file)
                note.html = result.value
                logger.info("HTML Messages :")
                logger.info(
                    result.messages
                )  # Any messages, such as warnings during conversion

                text = mammoth.extract_raw_text(file)
                note.text = text.value
                logger.info("Text Messages :")
                logger.info(
                    text.messages
                )  # Any messages, such as warnings during conversion

        if extension == SupportedExtensionTypes.PDF:
            with document.file.open("rb") as file:
                text = extract_text(BytesIO(file.read()))
                note.text = text
                html_buffer = BytesIO()
                extract_text_to_fp(
                    inf=file,
                    outfp=html_buffer,
                    output_type="html",
                    debug=True,
                    codec="utf-8",
                )
                # TODO Remove body
                note.html = html_buffer.getvalue().decode("utf-8")
        note_document = NoteDocument()
        note_document.file = document.file
        note_document.name = document.name
        note_document.save()
        note.document = note_document

        return note, None

    def _create_document_v1_editor(self, referral_answer):
        logger.info(
            "No attachment found in referral %s: Sending editor as note",
            referral_answer.referral.id,
        )
        transform_mirror_text = TransformProsemirrorText()
        text = transform_mirror_text.referral_to_text(referral_answer.content)

        transform_mirror_pdf = TransformProsemirrorPdf()
        pdf = transform_mirror_pdf.referral_to_pdf2(referral_answer.content)

        new_file = ContentFile(
            pdf.output(), name=f"reponse_saisine_{referral_answer.referral.id}.pdf"
        )
        document = models.NoteDocument.objects.create(file=new_file)

        note = ReferralNote()
        note.document = document
        note.text = text

        return note, None
