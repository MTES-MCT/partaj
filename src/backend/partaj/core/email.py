"""
Function helpers to decouple email sending from the code handling the views themselves,
for views that need to trigger emails.
"""
import json

from django.conf import settings

import requests


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
    def unit_referral_detail(unit, referral):
        """
        Link to a referral detail view in a given unit.
        """
        return f"/app/unit/{unit}/referral-detail/{referral}"


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
    reply_to = {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"}

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
    def send_referral_answered(cls, referral, answer):
        """
        Send the "referral answered" email to the requester when an answer is added to
        a referral.
        """

        templateId = settings.SENDINBLUE["REFERRAL_ANSWERED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the requester's "my referrals" view
        link_path = FrontendLink.sent_referrals_referral_detail(referral)

        data = {
            "params": {
                "answer_author": answer.created_by.get_full_name(),
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "referral_topic_name": referral.topic.name,
            },
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": referral.user.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_assigned(cls, referral, assignment, assigned_by):
        """
        Send the "referral assigned" email to the user who was just assigned to work on
        a referral.
        """

        templateId = settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(
            unit=assignment.unit.id, referral=referral.id
        )

        data = {
            "params": {
                "assigned_by": assigned_by.get_full_name(),
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "requester": referral.requester,
                "topic": referral.topic.name,
                "unit_name": assignment.unit.name,
                "urgency": referral.urgency_level.name,
            },
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": assignment.assignee.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_received(cls, referral, contact, unit):
        """
        Send the "referral received" email to the owners & admins of the unit who
        is responsible for handling it.
        """

        templateId = settings.SENDINBLUE["REFERRAL_RECEIVED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(
            unit=unit.id, referral=referral.id
        )

        data = {
            "params": {
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "requester": referral.requester,
                "topic": referral.topic.name,
                "unit_name": unit.name,
                "urgency": referral.urgency_level.name,
            },
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": contact.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_saved(cls, referral):
        """
        Send the "referral saved" email to the user who just created the referral.
        """

        templateId = settings.SENDINBLUE["REFERRAL_SAVED_TEMPLATE_ID"]

        data = {
            "params": {"case_number": referral.id},
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": referral.user.email}],
        }

        cls.send(data)

    @classmethod
    def send_validation_performed(cls, validation_request, assignees, is_validated):
        """
        Send the "validation performed" email to unit members assigned to the referral when
        the validator has performed the validation.
        """

        templateId = (
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
            link_path = FrontendLink.unit_referral_detail(
                unit=unit.id, referral=referral.id
            )

            data = {
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": f"{cls.location}{link_path}",
                    "requester": referral.requester,
                    "topic": referral.topic.name,
                    "unit_name": unit.name,
                    "validator": validation_request.validator.get_full_name(),
                },
                "replyTo": cls.reply_to,
                "templateId": templateId,
                "to": [{"email": contact.email}],
            }

            cls.send(data)

    @classmethod
    def send_validation_requested(cls, validation_request, activity):
        """
        Send the "validation requested" method to the person who was tasked with validating
        a given answer to a referral.
        """

        templateId = settings.SENDINBLUE[
            "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID"
        ]

        contact = validation_request.validator

        # Get the first unit from referral linked units the user is a part of.
        # Having a user in two different units both assigned on the same referral is a very
        # specific edge case and picking between those is not an important distinction.
        referral = validation_request.answer.referral
        unit = referral.units.filter(members__id=activity.actor.id).first()

        # Get the path to the referral detail view from the unit inbox
        link_path = FrontendLink.unit_referral_detail(
            unit=unit.id, referral=referral.id
        )

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": activity.actor.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "requester": referral.requester,
                "topic": referral.topic.name,
                "unit_name": unit.name,
            },
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": contact.email}],
        }

        cls.send(data)
