"""
Function helpers to decouple email sending from the code handling the views themselves,
for views that need to trigger emails.
"""
import json

from django.conf import settings

import requests


def send_email_referral_saved(referral):
    """
    Email helper. Sends the "referral saved" email to the relevant user.
    """
    url = "https://api.sendinblue.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.EMAIL_PROVIDER_API_KEY,
        "content-type": "application/json",
    }

    data = json.dumps(
        {
            "to": [{"email": referral.user.email}],
            "replyTo": {"email": "contact@partaj.beta.gouv.fr", "name": "Partaj"},
            "templateId": settings.EMAIL_REFERRAL_SAVED_TEMPLATE_ID,
        }
    )

    requests.request("POST", url, data=data, headers=headers)
