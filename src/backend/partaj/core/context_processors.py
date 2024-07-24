"""
Template context processors for Partaj.
"""
import json

from django.conf import settings
from django.middleware.csrf import get_token
from django.templatetags.static import static
from django.urls import reverse

from rest_framework.authtoken.models import Token


def partaj_context(request):
    """
    Build a context object for use in the frontend app. Prevents excessive duplication of
    code for trivial stuff such as release versions, asset paths or csrf tokens.
    """
    frontend_context = {
        "assets": {"icons": static("core/icons.svg")},
        "crisp_website_id": settings.CRISP_WEBSITE_ID,
        "csrftoken": get_token(request),
        "environment": settings.ENVIRONMENT,
        "tracking": {
            "is_enable": settings.ENABLE_TRACKING,
            "tracker_id": settings.TRACKER_ID,
        },
        "url_admin": reverse("admin:index"),
        "url_logout": reverse("cas_ng_logout"),
    }

    if settings.SENTRY_DSN:
        frontend_context["sentry_dsn"] = settings.SENTRY_DSN

    if request.user.is_authenticated:
        frontend_context["token"] = str(
            Token.objects.get_or_create(user=request.user)[0]
        )

    return {"FRONTEND_CONTEXT": json.dumps(frontend_context)}
