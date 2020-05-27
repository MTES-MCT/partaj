from django.utils.deprecation import MiddlewareMixin


class FixImpersonateMiddleware(MiddlewareMixin):
    """
    A simple middleware to fix a bug in `django-impersonate`.
    """

    def process_request(self, request):
        """
        Specifically pluck the `_impersonate` key from `django-impersonate` and cast it
        to a string.

        This prevents an exception in the session middleware when the User model pk is an
        UUID, and therefore cannot be serialized by the session serializer (JSONSerializer).
        """
        try:
            request.session["_impersonate"] = str(request.session["_impersonate"])
        except KeyError:
            pass
