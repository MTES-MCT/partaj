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

    # Default reply target for email methods
    replyTo = {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"}

    # URL to send a single transactional email
    send_email_url = "https://api.sendinblue.com/v3/smtp/email"

    @classmethod
    def send_referral_received(cls, referral, host, scheme="https://"):
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
                    "link_to_referral": f"{scheme}{host}{link_path}",
                    "requester": referral.requester,
                    "topic": referral.topic.name,
                    "unit_name": referral.topic.unit.name,
                    "urgency": referral.get_human_urgency(),
                },
                "replyTo": cls.replyTo,
                "templateId": templateId,
                "to": [{"email": contact.email}],
            }

            requests.request(
                "POST",
                cls.send_email_url,
                data=json.dumps(data),
                headers=cls.default_headers,
            )

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

        requests.request(
            "POST",
            cls.send_email_url,
            data=json.dumps(data),
            headers=cls.default_headers,
        )
