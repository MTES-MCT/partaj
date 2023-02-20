"""
Transform docx to html
"""
import logging
import os
import sys
from io import BytesIO, StringIO

import mammoth
from django.core.files import File
from django.core.files.base import ContentFile
from partaj.core.transform_prosemirror_pdf import TransformProsemirrorPdf
from partaj.core.transform_prosemirror_text import TransformProsemirrorText
from pdfminer.high_level import extract_text, extract_text_to_fp

from django.core.management.base import BaseCommand
from partaj.core.models import UnitUtils
from django.db import models as db_models
from typing.io import TextIO

from ... import models, services
from ...models import Referral, ReferralAnswer, ReferralNote, ReferralUserLinkRoles, NoteDocument

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

    # pylint: disable=broad-except
    def handle(self, *args, **options):
        """
        Send  referral's answer to notix
        """
        logger.info("Start exporting notes ...")

        for referral in Referral.objects.all():
            logger.info("Handling referral n° %s", referral.id)

            for unit in referral.units.all():
                if unit.name in UnitUtils.get_exported_blacklist_unit():
                    logger.info(f"Referral skipped: Unit {unit.name} is blacklisted from export")
                    continue
            try:
                if services.FeatureFlagService.get_referral_version(referral) == 1:
                    logger.info("Referral answer Version 2 detected")

                    if not referral.report or not referral.report.published_at:
                        logger.info(f"Referral skipped: no report or publishment date founded.")
                        continue

                    logger.info("Checking for final report version sent document")
                    extension = referral.report.final_version.document.get_extension()
                    logger.info(f"Found {extension} type")

                    if extension not in SupportedExtensionTypes.values:
                        logger.info(f"Extension {extension} not supported, ignoring")
                        continue

                    note = ReferralNote()

                    if extension == SupportedExtensionTypes.DOCX:
                        with referral.report.final_version.document.file.open("rb") as file:
                            result = mammoth.convert_to_html(file)
                            note.html = result.value
                            logger.info("HTML Messages :")
                            logger.info(result.messages)  # Any messages, such as warnings during conversion

                            text = mammoth.extract_raw_text(file)
                            note.text = text.value
                            logger.info("Text Messages :")
                            logger.info(text.messages)  # Any messages, such as warnings during conversion

                            #TODO Here export to index !!
                    if extension == SupportedExtensionTypes.PDF:
                        with referral.report.final_version.document.file.open("rb") as file:
                            text = extract_text(BytesIO(file.read()))
                            note.text = text
                            html_buffer = BytesIO()
                            extract_text_to_fp(
                                inf=file,
                                outfp=html_buffer,
                                output_type="html",
                                debug=True,
                                codec="utf-8"
                            )
                            #TODO Remove body
                            note.html = html_buffer.getvalue().decode("utf-8")
                    note.referral_id = str(referral.id)
                    note.publication_date = referral.report.published_at
                    note.object = referral.object
                    note.topic = referral.topic.name
                    note.author = referral.report.final_version.created_by.get_full_name()
                    note.assigned_units_names = [unit.name for unit in referral.units.all()]
                    note.requesters_unit_names = [
                        user.unit_name
                        for user in referral.users.filter(
                            referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                        ).all()
                    ]
                    note_document = NoteDocument()
                    note_document.file = referral.report.final_version.document.file
                    note_document.name = referral.report.final_version.document.name
                    note_document.save()
                    note.document = note_document
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
                        logger.info(f"Ignoring referral n° {referral.id} : no published referral answer.")
                        continue
                    for unit in referral_answer.referral.units.all():
                        if unit.name in UnitUtils.get_exported_blacklist_unit():
                            logger.info(f"Ignoring referral n° {referral.id} : unit {unit.name} blacklisted in Archivaj.",)

                    note = ReferralNote()
                    note.referral_id = str(referral.id)
                    note.object = referral.object
                    note.topic = referral.topic.name

                    note.publication_date = referral_answer.created_at
                    note.author = referral_answer.created_by.get_full_name()

                    note.assigned_units_names = [unit.name for unit in referral.units.all()]
                    note.requesters_unit_names = [
                        user.unit_name
                        for user in referral.users.filter(
                            referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                        ).all()
                    ]

                    attachments = referral_answer.attachments.all()
                    if len(attachments) == 0:
                        logger.info(f"No attachment found in referral {referral.id}: Sending editor as note")
                        transform_mirror_text = TransformProsemirrorText()
                        text = transform_mirror_text.referral_to_text(referral_answer.content)
                        note.text = text

                        transform_mirror_pdf = TransformProsemirrorPdf()
                        pdf = transform_mirror_pdf.referral_to_pdf2(referral_answer.content)

                        new_file = ContentFile(pdf.output(), name=f"{}.pdf")
                        file = models.NoteDocument.objects.create(
                            file=new_file
                        )

                        note.document = file
                        note.save()
                        referral.note = note
                        referral.save()

                    if len(attachments) > 1:
                        logger.info(f"Ignoring {referral.id}: Found more than one attachment in referral answer")
                        continue

        
                    #TODO handle len(attachments) == 1!

                    logger.info(f"Referral n° {referral.id} : TIEPS version 1")

            # TODO Handle Exceptions
            except ValueError as exception:
                logger.warning("Referral n° %s :failed to create notice :", referral.id)
                for i in exception.args:
                    logger.info(i)

            except Exception as exception:
                logger.warning("Referral n° %s :failed to create notice :", referral.id)
                for i in exception.args:
                    logger.info(i)
