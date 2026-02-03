"""
Serializers for the users django app.
"""

import json

from django.core.signing import JSONSerializer


class FixImpersonateJSONSerializer(JSONSerializer):
    """
    Replace the default session JSON serializer to fix a bug in `django-impersonate`.
    """

    def dumps(self, obj):
        """
        Specifically pluck the broken `_impersonate` value from `django-impersonate` and cast
        it to a string, as JSONSerializer is unable to encode UUIDs.
        """
        try:
            obj["_impersonate"] = str(obj["_impersonate"])
        except KeyError:
            pass

        return json.dumps(obj, separators=(",", ":")).encode("latin-1")
