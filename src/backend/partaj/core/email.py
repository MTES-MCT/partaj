"""
Function helpers to decouple email sending from the code handling the views themselves,
for views that need to trigger emails.
"""

import json

from django.conf import settings
from django.utils import dateformat
from django.utils.translation import gettext as _

import requests

from . import models
from .models.unit import UnitMembershipRole

# pylint: disable=too-many-public-methods


class FrontendLink:
    """
    Centralize building of links to frontend views. This way if frontend URLs evolve, there is
    only one place in the backend to modify.
    """

    @staticmethod
    def sent_referrals_referral_detail(referral):
        """
        Link to a referral detail view in "sent referrals" for the current user.
        """
        return f"/app/sent-referrals/referral-detail/{referral}"

    @staticmethod
    def draft_referrals_referral_detail(referral):
        """
        Link to a new referral detail view for the current user.
        """
        return f"/app/new-referral/{referral}"

    @classmethod
    def sent_referrals_referral_detail_messages(cls, referral):
        """
        Link to a referral detail view in "sent referrals" for the current user,
        opening the "Messages" tab.
        """
        return f"{cls.sent_referrals_referral_detail(referral)}/messages"

    @classmethod
    def sent_referrals_referral_answer(cls, referral):
        """
        Link to a referral detail view in "sent referrals" for the current user,
        opening the "Answer" tab.
        """
        return f"{cls.sent_referrals_referral_detail(referral)}/answer"

    @staticmethod
    def unit_referral_detail(referral):
        """
        Link to a referral detail view in a given unit.
        """
        return f"/app/unit/referral-detail/{referral}"

    @classmethod
    def unit_referral_detail_messages(cls, referral):
        """
        Link to a referral detail view in a given unit, opening the "Messages" tab.
        """
        return f"{cls.unit_referral_detail(referral)}/messages"

    @classmethod
    def unit_referral_detail_answer(cls, referral):
        """
        Link to a referral detail view in a given unit, opening the "Answer" tab.
        """
        return f"{cls.unit_referral_detail(referral)}/answer"

    @staticmethod
    def referral_report(referral_id):
        """
        Link to a referral report view.
        """
        return f"/app/dashboard/referral-detail/{referral_id}/draft-answer"


class Mailer:
    """
    Centralize email sending logic, reusing as much as we can between similar calls.
    """

    # Default headers for email methods
    default_headers = {
        "accept": "application/json",
        "api-key": settings.SENDINBLUE["API_KEY"],
        "content-type": "application/json",
    }

    # Use settings to get a straightforward location for where Partaj is running incl. protocol
    location = settings.PARTAJ_PRIMARY_LOCATION

    # Default reply target for email methods
    reply_to = {"email": settings.CONTACT_EMAIL, "name": "Partaj"}

    # URL to send a single transactional email
    send_email_url = settings.SENDINBLUE["SEND_HTTP_ENDPOINT"]

    @classmethod
    def send(cls, data):
        """
        Factorize the actual call to the email provider's endpoint.
        """
        if settings.SENDINBLUE["API_KEY"]:
            requests.request(
                "POST",
                cls.send_email_url,
                data=json.dumps(data),
                headers=cls.default_headers,
            )

    @classmethod
    def send_new_message_for_unit_member(cls, contact, referral, message):
        """
        Send the "new message" email to unit members (assignees if they exist, otherwise
        unit owners) when a new message is created in the "Messages" tab.
        """
        template_id = settings.SENDINBLUE[
            "REFERRAL_NEW_MESSAGE_FOR_UNIT_MEMBER_TEMPLATE_ID"
        ]

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail_messages(referral=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "message_author": message.user.get_full_name(),
                "referral_author": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_new_message_for_requester(cls, user, referral, message):
        """
        Send the "new message" email to the requester when a new message is created by
        unit members in the "Messages" tab.
        """

        template_id = settings.SENDINBLUE[
            "REFERRAL_NEW_MESSAGE_FOR_REQUESTER_TEMPLATE_ID"
        ]

        # Get the path to the referral detail view from the requester's "my referrals" view
        link_path = FrontendLink.sent_referrals_referral_detail_messages(
            referral=referral.id
        )

        data = {
            "params": {
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "message_author": message.user.get_full_name(),
                "topic": referral.topic.name,
                "units": ", ".join([unit.name for unit in referral.units.all()]),
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": user.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_answered_to_users(cls, referral, published_by):
        """
        Send the "referral answered" email to the requester when an answer is added to
        a referral.
        """

        template_id = settings.SENDINBLUE["REFERRAL_ANSWERED_REQUESTERS_TEMPLATE_ID"]

        # Get the path to the referral detail view from the requester's "my referrals" view
        link_path = FrontendLink.sent_referrals_referral_answer(referral.id)

        link_path_message = FrontendLink.sent_referrals_referral_detail_messages(
            referral.id
        )

        for user in referral.users.filter(
            referraluserlink__notifications__in=[
                models.ReferralUserLinkNotificationsTypes.RESTRICTED,
                models.ReferralUserLinkNotificationsTypes.ALL,
            ],
        ).all():
            data = {
                "params": {
                    "answer_sender": published_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"{cls.location}{link_path}",
                    "link_to_referral_message": f"{cls.location}{link_path_message}",
                    "referral_topic_name": referral.topic.name,
                },
                "replyTo": cls.reply_to,
                "templateId": template_id,
                "to": [{"email": user.email}],
            }

            cls.send(data)

    @classmethod
    def send_referral_answered_to_unit_owners(cls, referral, published_by):
        """
        Send the "referral answered" email to the units'owner when an answer is added to
        a referral.
        """
        template_unit_owner_id = settings.SENDINBLUE[
            "REFERRAL_ANSWERED_UNIT_OWNER_TEMPLATE_ID"
        ]

        for unit in referral.units.all():
            contacts = unit.members.filter(
                unitmembership__role=UnitMembershipRole.OWNER
            )
            # Get the path to the referral detail view from the requester's "my referrals" view
            link_path = FrontendLink.unit_referral_detail_answer(referral=referral.id)

            for contact in contacts:
                data = {
                    "params": {
                        "answer_sender": published_by.get_full_name(),
                        "case_number": referral.id,
                        "link_to_referral": f"{cls.location}{link_path}",
                        "title": referral.title or referral.object,
                    },
                    "replyTo": cls.reply_to,
                    "templateId": template_unit_owner_id,
                    "to": [{"email": contact.email}],
                }
                cls.send(data)

    @classmethod
    def send_referral_answered_to_created_by(cls, referral, version):
        """
        Send the "referral answered" email to the response owner when an answer is added to
        a referral.
        """
        template_created_by_id = settings.SENDINBLUE[
            "REFERRAL_ANSWERED_CREATED_BY_TEMPLATE_ID"
        ]

        data = {
            "params": {
                "case_number": referral.id,
                "title": referral.title or referral.object,
            },
            "replyTo": cls.reply_to,
            "templateId": template_created_by_id,
            "to": [{"email": version.created_by.email}],
        }
        cls.send(data)

    @classmethod
    def send_referral_assigned(cls, referral, assignment, assigned_by):
        """
        Send the "referral assigned" email to the user who was just assigned to work on
        a referral.
        """

        template_id = settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(referral=referral.id)

        data = {
            "params": {
                "assigned_by": assigned_by.get_full_name(),
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": assignment.unit.name,
                "urgency": referral.urgency_level.name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": assignment.assignee.email}],
        }

        cls.send(data)

    @classmethod
    def send_validation_performed(cls, validation_request, assignees, is_validated):
        """
        Send the "validation performed" email to unit members assigned to the referral when
        the validator has performed the validation.
        """

        template_id = (
            settings.SENDINBLUE["REFERRAL_ANSWER_VALIDATED_TEMPLATE_ID"]
            if is_validated
            else settings.SENDINBLUE["REFERRAL_ANSWER_NOT_VALIDATED_TEMPLATE_ID"]
        )

        referral = validation_request.answer.referral

        for contact in assignees:
            # Get the first unit from referral linked units the user is a part of.
            # Having a user in two different units both assigned on the same referral is a very
            # specific edge case and picking between those is not an important distinction.
            unit = referral.units.filter(members__id=contact.id).first()

            # Get the path to the referral detail view from the unit inbox
            link_path = FrontendLink.unit_referral_detail(referral=referral.id)

            data = {
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": f"{cls.location}{link_path}",
                    "referral_users": referral.get_users_text_list(),
                    "title": referral.title or referral.object,
                    "topic": referral.topic.name,
                    "unit_name": unit.name,
                    "validator": validation_request.validator.get_full_name(),
                },
                "replyTo": cls.reply_to,
                "templateId": template_id,
                "to": [{"email": contact.email}],
            }

            cls.send(data)

    @classmethod
    def send_referral_assigned_unit(
        cls, referral, assignment, assignunit_explanation, assigned_by
    ):
        """
        Send the "referral assigned to new unit" email to the owners of the unit who was
        just assigned on the referral.
        """
        template_id = settings.SENDINBLUE["REFERRAL_ASSIGNED_UNIT_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(referral=referral.id)

        for owner in assignment.unit.members.filter(
            unitmembership__role=UnitMembershipRole.OWNER
        ):
            data = {
                "params": {
                    "assigned_by": assigned_by.get_full_name(),
                    "case_number": referral.id,
                    "link_to_referral": f"{cls.location}{link_path}",
                    "referral_users": referral.get_users_text_list(),
                    "title": referral.title or referral.object,
                    "topic": referral.topic.name,
                    "unit_name": assignment.unit.name,
                    "urgency": referral.urgency_level.name,
                    "message": assignunit_explanation,
                },
                "replyTo": cls.reply_to,
                "templateId": template_id,
                "to": [{"email": owner.email}],
            }

            cls.send(data)

    @classmethod
    def send_referral_received(cls, referral, contact, unit):
        """
        Send the "referral received" email to the owners & admins of the unit who
        is responsible for handling it.
        """

        template_id = settings.SENDINBLUE["REFERRAL_RECEIVED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(referral=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": unit.name,
                "urgency": referral.urgency_level.name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_requester_added(cls, referral, contact, created_by):
        """
        Send the "requester added" email to the person who was added as a requester
        on the referral.
        """

        template_id = settings.SENDINBLUE["REFERRAL_REQUESTER_ADDED_TEMPLATE_ID"]

        if referral.state == models.ReferralState.DRAFT:
            link_path = FrontendLink.draft_referrals_referral_detail(referral.id)
        else:
            # Get the path to the referral detail view from the requesters' "my referrals" view
            link_path = FrontendLink.sent_referrals_referral_detail(referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": created_by.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "topic": referral.topic.name if referral.topic else _("In progress"),
                "urgency": (
                    referral.urgency_level.name
                    if referral.urgency_level
                    else _("In progress")
                ),
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_observer_added(cls, referral, contact, created_by):
        """
        Send the "observer added" email to the person who was added as an observer
        on the referral.
        """

        template_id = settings.SENDINBLUE["REFERRAL_OBSERVER_ADDED_TEMPLATE_ID"]

        if referral.state == models.ReferralState.DRAFT:
            link_path = FrontendLink.draft_referrals_referral_detail(referral.id)
        else:
            # Get the path to the referral detail view from the requesters' "my referrals" view
            link_path = FrontendLink.sent_referrals_referral_detail(referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": created_by.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "topic": referral.topic.name if referral.topic else _("In progress"),
                "urgency": referral.urgency_level.name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_saved(cls, referral, created_by):
        """
        Send the "referral saved" email to the user who just created the referral.
        """

        template_id = settings.SENDINBLUE["REFERRAL_SAVED_TEMPLATE_ID"]

        data = {
            "params": {"case_number": referral.id},
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": created_by.email}],
        }

        cls.send(data)

    @classmethod
    def send_version_change_requested(cls, referral, version, notification):
        """
        Send the "change requested" performed email to user
        """

        # Get the path to the referral report view
        link_path = FrontendLink.referral_report(referral_id=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": notification.notifier.unit_name,
                "version_number": version.version_number,
                "validator": notification.notifier.get_full_name(),
            },
            "replyTo": cls.reply_to,
            "templateId": settings.SENDINBLUE["REFERRAL_VERSION_REQUEST_CHANGE"],
            "to": [{"email": notification.notified.email}],
        }

        cls.send(data)

    @classmethod
    def send_version_validated(cls, referral, version, notification):
        """
        Send the "version validated" performed email to user
        """

        # Get the path to the referral report view
        link_path = FrontendLink.referral_report(referral_id=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": notification.notifier.unit_name,
                "version_number": version.version_number,
                "validator": notification.notifier.get_full_name(),
            },
            "replyTo": cls.reply_to,
            "templateId": settings.SENDINBLUE["REFERRAL_VERSION_VALIDATED"],
            "to": [{"email": notification.notified.email}],
        }

        cls.send(data)

    @classmethod
    def send_validation_requested(cls, validation_request, activity):
        """
        Send the "validation requested" method to the person who was tasked with validating
        a given answer to a referral.
        """

        template_id = settings.SENDINBLUE[
            "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID"
        ]

        contact = validation_request.validator

        # Get the first unit from referral linked units the user is a part of.
        # Having a user in two different units both assigned on the same referral is a very
        # specific edge case and picking between those is not an important distinction.
        referral = validation_request.answer.referral
        unit = referral.units.filter(members__id=activity.actor.id).first()

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(referral=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": activity.actor.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": unit.name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_request_validation(cls, referral, notification):
        """
        Send the "validation requested" method to the person who was tasked with validating
        a given version to a referral report.
        """

        template_id = settings.SENDINBLUE[
            "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID"
        ]

        contact = notification.notified
        unit_name = notification.item_content_object.metadata.receiver_unit_name

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.referral_report(referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": notification.notifier.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": unit_name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_request_changes(cls, referral, notification):
        """
        Notification to the requester of the request to change its version.
        """

        template_id = settings.SENDINBLUE["REFERRAL_ANSWER_NOT_VALIDATED_TEMPLATE_ID"]

        contact = notification.notified
        unit_name = notification.item_content_object.metadata.receiver_unit_name

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.referral_report(referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": notification.notifier.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_users": referral.get_users_text_list(),
                "title": referral.title or referral.object,
                "topic": referral.topic.name,
                "unit_name": unit_name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_closed(cls, contact, referral, close_explanation, closed_by):
        """
        Send the "referral closed" email. Pick the correct template based on
        the contact's identity.
        """

        requester_template_id = settings.SENDINBLUE[
            "REFERRAL_CLOSED_FOR_REQUESTER_TEMPLATE_ID"
        ]
        unit_member_template_id = settings.SENDINBLUE[
            "REFERRAL_CLOSED_FOR_UNIT_MEMBER_TEMPLATE_ID"
        ]

        if referral.users.filter(id=contact.id).exists():
            template_id = requester_template_id
            # Get the path to the referral detail view from the requester's "my referrals" view
            link_path = FrontendLink.sent_referrals_referral_detail(referral.id)
        else:
            template_id = unit_member_template_id
            # Get the path to the referral detail view from the unit inbox
            link_path = FrontendLink.unit_referral_detail(referral=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "closed_by": closed_by.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "message": close_explanation,
                "referral_authors": referral.get_users_text_list(),
                "topic": referral.topic.name,
                "units": ", ".join([unit.name for unit in referral.units.all()]),
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }
        cls.send(data)

    @classmethod
    def send_referral_changeurgencylevel(
        cls, contact, referral, history_object, created_by
    ):
        """
        Send the "referral changeurgencylevel" email to all stakeholders.
        """

        requester_template_id = settings.SENDINBLUE[
            "REFERRAL_CHANGED_URGENCYLEVEL_FOR_REQUESTER_TEMPLATE_ID"
        ]
        unit_member_template_id = settings.SENDINBLUE[
            "REFERRAL_CHANGED_URGENCYLEVEL_FOR_UNIT_MEMBER_TEMPLATE_ID"
        ]

        if referral.users.filter(id=contact.id).exists():
            template_id = requester_template_id
            # Get the path to the referral detail view from the requester's "my referrals" view
            link_path = FrontendLink.sent_referrals_referral_detail(referral.id)
        else:
            template_id = unit_member_template_id
            # Get the path to the referral detail view from the unit inbox
            link_path = FrontendLink.unit_referral_detail(referral=referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": created_by.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "message": history_object.explanation,
                "old_due_date": dateformat.format(
                    referral.created_at + history_object.old_referral_urgency.duration,
                    "j F Y",
                ),
                "new_due_date": dateformat.format(referral.get_due_date(), "j F Y"),
                "topic": referral.topic.name,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": contact.email}],
        }
        cls.send(data)

    @classmethod
    def send_report_notification(cls, referral, notification):
        """
        Send the "referral closed" email. Pick the correct template based on
        the contact's identity.
        """

        template_id = settings.SENDINBLUE["REPORT_MESSAGE_NOTIFICATION_TEMPLATE_ID"]

        link_path = FrontendLink.referral_report(referral.id)

        data = {
            "params": {
                "case_number": referral.id,
                "notifier": notification.notifier.first_name
                + " "
                + notification.notifier.last_name,
                "link_to_report": f"{cls.location}{link_path}",
                "preview": notification.preview,
            },
            "replyTo": cls.reply_to,
            "templateId": template_id,
            "to": [{"email": notification.notified.email}],
        }

        cls.send(data)
