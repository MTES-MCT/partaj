"""
NoteFactory handling Note creation from provided data
"""
from partaj.core.models import ReferralNote, ReferralUserLinkRoles

from .note_document_factory import NoteDocumentFactory

# pylint: disable=consider-using-set-comprehension


class NoteFactory:
    """NoteFactory class"""

    @classmethod
    def create_from_referral(cls, referral):
        """
        Create and save Note based on referral data
        """
        note = ReferralNote()
        note_document = NoteDocumentFactory().create_from_referral(referral)
        note.document = note_document
        note.referral_id = str(referral.id)
        note.object = referral.title or referral.object
        note.topic = referral.topic.name
        note.assigned_units_names = [unit.name for unit in referral.units.all()]

        note.requesters_unit_names = list(
            set(
                [
                    user.unit_name
                    for user in referral.users.filter(
                        referraluserlink__role=ReferralUserLinkRoles.REQUESTER
                    ).all()
                ]
            )
        )

        note.publication_date = referral.report.published_at
        note.author = referral.report.final_version.created_by.get_full_name()

        contributors = [user.get_full_name() for user in referral.assignees.all()]
        contributors.append(note.author)

        # The last version author isn't necessarily an assigned user
        # of the referral, hence why we need to add it manually and then
        # filter duplicates
        note.contributors = list(set(contributors))

        note.save()

        return note
