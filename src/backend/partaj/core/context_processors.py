"""
Template context processors for Partaj.
"""
import json

from django.middleware.csrf import get_token


def partaj_context(request):
    """
    Build a context object for use in the frontend app. Prevents excessive duplication of
    code for trivial stuff such as release versions, asset paths or csrf tokens.
    """
    return {
        "FRONTEND_CONTEXT": json.dumps({
            "csrftoken": get_token(request)
        })
    }
