from django.conf import settings

from partaj.core.email import FrontendLink, Mailer
from partaj.core.models import Referral, ReferralReportVersion, Unit
from partaj.users.models import User


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
                    "email": settings.CONTACT_EMAIL,
                    "name": "Partaj",
                },
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID"
                ],
                "to": [{"email": requester.email}],
            },)


def get_request_validation(requester: User, referral: Referral, validator: User, unit: Unit):
    return ({
                "params": {
                    "case_number": referral.id,
                    "created_by": requester.get_full_name(),
                    "link_to_referral": f"{Mailer.location}{FrontendLink.referral_report(referral.id)}",
                    "referral_users": referral.get_users_text_list(),
                    "title": referral.title or referral.object,
                    "topic": referral.topic.name,
                    "unit_name": unit.name,
                },
                "replyTo": Mailer.reply_to,
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID"
                ],
                "to": [{"email": validator.email}],
            },)


def get_request_change(notified_user: User, referral: Referral, validator: User, unit_name: str, version: ReferralReportVersion):
    return ({
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": f"{Mailer.location}{FrontendLink.referral_report(referral.id)}",
                    "referral_users": referral.get_users_text_list(),
                    "title": referral.title or referral.object,
                    "topic": referral.topic.name,
                    "unit_name": unit_name,
                    "version_number": version.version_number,
                    "validator": validator.get_full_name(),
                },
                "replyTo": Mailer.reply_to,
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_VERSION_REQUEST_CHANGE"
                ],
                "to": [{"email": notified_user.email}],
            },)


def get_validate(notified_user: User, referral: Referral, validator: User, unit_name: str, version: ReferralReportVersion):
    return ({
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": f"{Mailer.location}{FrontendLink.referral_report(referral.id)}",
                    "referral_users": referral.get_users_text_list(),
                    "title": referral.title or referral.object,
                    "topic": referral.topic.name,
                    "unit_name": unit_name,
                    "version_number": version.version_number,
                    "validator": validator.get_full_name(),
                },
                "replyTo": Mailer.reply_to,
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_VERSION_VALIDATED"
                ],
                "to": [{"email": notified_user.email}],
            },)


def get_referral_answered_unit_owners_and_assignees(answered_by: User, referral: Referral, receiver: User):
    return ({
                "params": {
                    "answer_sender": answered_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": (
                        f"https://partaj/app/unit/referral-detail/{referral.id}/answer"
                    ),
                    "title": referral.title or referral.object,
                },
                "replyTo": {
                    "email": settings.CONTACT_EMAIL,
                    "name": "Partaj",
                },
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_UNIT_OWNER_TEMPLATE_ID"
                ],
                "to": [{"email": receiver.email}],
            },)


def get_referral_answered_published_by(published_by: User, referral: Referral):
    return ({
                "params": {
                    "case_number": referral.id,
                    "title": referral.title or referral.object,
                },
                "replyTo": {
                    "email": settings.CONTACT_EMAIL,
                    "name": "Partaj",
                },
                "templateId": settings.SENDINBLUE[
                    "REFERRAL_ANSWERED_CREATED_BY_TEMPLATE_ID"
                ],
                "to": [
                    {"email": published_by.email}
                ],
            },)
