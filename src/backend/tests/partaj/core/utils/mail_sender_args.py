from partaj.core.models import Referral

from partaj.users.models import User

from django.conf import settings


def get_referral_answered_requesters(answered_by: User, referral: Referral, requester: User):
    return ({
                "params": {
                    "answer_sender": answered_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}/answer",
                    "link_to_referral_message": f"https://partaj/app/sent-referrals/referral-detail/{referral.id}/messages",
                    "referral_topic_name": referral.topic.name,
                },
                "replyTo": {
                    "email": "contact@partaj.beta.gouv.fr",
                    "name": "Partaj",
                },
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID"
                ],
                "to": [{"email": requester.email}],
            },)


def get_referral_answered_unit_owners(answered_by: User, referral: Referral, owner: User):
    return ({
                "params": {
                    "answer_sender": answered_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/{referral.units.get().id}"
                        f"/referrals-list/referral-detail/{referral.id}/answer"
                    ),
                    "title": referral.title or referral.object,
                },
                "replyTo": {
                    "email": "contact@partaj.beta.gouv.fr",
                    "name": "Partaj",
                },
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_UNIT_OWNER_TEMPLATE_ID"
                ],
                "to": [{"email": owner.email}],
            },)


def get_referral_answered_created_by(version_by: User, referral: Referral):
    return ({
                "params": {
                    "case_number": referral.id,
                    "title": referral.title or referral.object,
                },
                "replyTo": {
                    "email": "contact@partaj.beta.gouv.fr",
                    "name": "Partaj",
                },
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_CREATED_BY_TEMPLATE_ID"
                ],
                "to": [
                    {"email": version_by.email}
                ],
            },)
