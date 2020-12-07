"""
Function helpers to decouple email sending from the code handling the views themselves,
for views that need to trigger emails.
"""
import json

from django.conf import settings
from django.urls import reverse

import requests


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
        link_path = reverse(
            "requester-referral-detail", kwargs={"referral_id": referral.id},
        )

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
    def send_referral_assigned(cls, referral, assignee, assigned_by):
        """
        Send the "referral assigned" email to the user who was just assigned to work on
        a referral.
        """

        templateId = settings.SENDINBLUE["REFERRAL_ASSIGNED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = reverse(
            "unit-inbox-referral-detail",
            kwargs={"unit_id": referral.topic.unit.id, "pk": referral.id},
        )

        data = {
            "params": {
                "assigned_by": assigned_by.get_full_name(),
                "case_number": referral.id,
                "link_to_referral": f"{cls.location}{link_path}",
                "requester": referral.requester,
                "topic": referral.topic.name,
                "unit_name": referral.topic.unit.name,
                "urgency": referral.urgency_level.name,
            },
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": assignee.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_received(cls, referral, contacts):
        """
        Send the "referral received" email to the owners & admins of the unit who
        is responsible for handling it.
        """

        templateId = settings.SENDINBLUE["REFERRAL_RECEIVED_TEMPLATE_ID"]

        # Get the path to the referral detail view from the unit inbox
        link_path = reverse(
            "unit-inbox-referral-detail",
            kwargs={"unit_id": referral.topic.unit.id, "pk": referral.id},
        )

        for contact in contacts:
            data = {
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": f"{cls.location}{link_path}",
                    "requester": referral.requester,
                    "topic": referral.topic.name,
                    "unit_name": referral.topic.unit.name,
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

        # Get the path to the referral detail view from the unit inbox
        referral = validation_request.answer.referral
        link_path = reverse(
            "unit-inbox-referral-detail",
            kwargs={"unit_id": referral.topic.unit.id, "pk": referral.id},
        )

        for contact in assignees:
            data = {
                "params": {
                    "case_number": referral.id,
                    "link_to_referral": f"{cls.location}{link_path}",
                    "requester": referral.requester,
                    "topic": referral.topic.name,
                    "unit_name": referral.topic.unit.name,
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

        # Get the path to the referral detail view from the unit inbox
        referral = validation_request.answer.referral
        link_path = reverse(
            "unit-inbox-referral-detail",
            kwargs={"unit_id": referral.topic.unit.id, "pk": referral.id},
        )

        data = {
            "params": {
                "case_number": referral.id,
                "created_by": activity.actor.get_full_name(),
                "link_to_referral": f"{cls.location}{link_path}",
                "requester": referral.requester,
                "topic": referral.topic.name,
                "unit_name": referral.topic.unit.name,
            },
            "replyTo": cls.reply_to,
            "templateId": templateId,
            "to": [{"email": contact.email}],
        }

        cls.send(data)
