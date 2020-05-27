"""
Template context processors for Partaj.
"""
import json

from django.middleware.csrf import get_token
from django.templatetags.static import static

from rest_framework.authtoken.models import Token


def partaj_context(request):
    """
    Build a context object for use in the frontend app. Prevents excessive duplication of
    code for trivial stuff such as release versions, asset paths or csrf tokens.
    """
    frontend_context = {
        "assets": {"icons": static("core/icons.svg")},
        "csrftoken": get_token(request),
    }

    if request.user.is_authenticated:
        frontend_context["token"] = str(Token.objects.get_or_create(user=request.user)[0])

    return {"FRONTEND_CONTEXT": json.dumps(frontend_context)}
