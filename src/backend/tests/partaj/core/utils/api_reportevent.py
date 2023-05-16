import json

from rest_framework.authtoken.models import Token


def api_send_report_event(client, report, sender_user, notified_users=None):
    form_data = {"content": "some message", "report": str(report.id)}

    if notified_users:
        form_data["notifications"] = json.dumps(
            [str(notified_user.id) for notified_user in notified_users]
        )
    token = Token.objects.get_or_create(user=sender_user)[0]

    # Send a notification to the unit admin with no previous version sent
    return client.post(
        "/api/reportevents/",
        form_data,
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Token {token}",
    )
