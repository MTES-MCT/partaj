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
        "api-key": settings.EMAIL_PROVIDER_API_KEY,
        "content-type": "application/json",
    }

    # Use settings to get a straightforward location for where Partaj is running incl. protocol
    location = settings.PARTAJ_PRIMARY_LOCATION

    # Default reply target for email methods
    replyTo = {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"}

    # URL to send a single transactional email
    send_email_url = settings.EMAIL_PROVIDER_SEND_ENDPOINT

    @classmethod
    def send(cls, data):
        """
        Factorize the actual call to the email provider's endpoint.
        """
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

        templateId = settings.EMAIL_REFERRAL_ANSWERED_TEMPLATE_ID

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
            "replyTo": cls.replyTo,
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

        templateId = settings.EMAIL_REFERRAL_ASSIGNED_TEMPLATE_ID

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
                "urgency": referral.get_human_urgency(),
            },
            "replyTo": cls.replyTo,
            "templateId": templateId,
            "to": [{"email": assignee.email}],
        }

        cls.send(data)

    @classmethod
    def send_referral_received(cls, referral):
        """
        Send the "referral received" email to the owners & admins of the unit who
        is responsible for handling it.
        """

        templateId = settings.EMAIL_REFERRAL_RECEIVED_TEMPLATE_ID

        # Send this email to all managers for the unit (meaning admins & owners)
        contacts = referral.topic.unit.get_organizers()

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
                    "urgency": referral.get_human_urgency(),
                },
                "replyTo": cls.replyTo,
                "templateId": templateId,
                "to": [{"email": contact.email}],
            }

            cls.send(data)

    @classmethod
    def send_referral_saved(cls, referral):
        """
        Send the "referral saved" email to the user who just created the referral.
        """

        templateId = settings.EMAIL_REFERRAL_SAVED_TEMPLATE_ID

        data = {
            "params": {"case_number": referral.id},
            "replyTo": cls.replyTo,
            "templateId": templateId,
            "to": [{"email": referral.user.email}],
        }

        cls.send(data)
