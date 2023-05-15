"""
NoteFactory handling Note creation from provided data
"""
from partaj.core.models import NoteDocument


class NoteDocumentFactory:
    """NoteFactory class"""

    @classmethod
    def create_from_referral(cls, referral):
        """
        Create and save NoteDocument based on referral data
        """
        document = referral.report.final_version.document

        note_document = NoteDocument()
        note_document.file = document.file
        note_document.name = document.name
        note_document.save()

        return note_document
