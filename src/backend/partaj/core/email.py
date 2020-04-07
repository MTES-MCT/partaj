"""
Function helpers to decouple email sending from the code handling the views themselves,
for views that need to trigger emails.
"""
import json

from django.conf import settings

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
    def send_referral_saved(cls, referral):
        """
        Send the "referral saved" email to the user who just created the referral.
        """

        templateId = settings.EMAIL_REFERRAL_SAVED_TEMPLATE_ID

        data = json.dumps(
            {
                "to": [{"email": referral.user.email}],
                "replyTo": cls.replyTo,
                "templateId": templateId,
            }
        )

        requests.request(
            "POST", cls.send_email_url, data=data, headers=cls.default_headers
        )
