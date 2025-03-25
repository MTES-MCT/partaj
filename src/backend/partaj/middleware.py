"""
Partaj custom middlewares
"""


class HeadersMiddleware:
    """
    Middleware adding security headers to responses
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        response["X-Content-Type-Options"] = "nosniff"
        response["X-XSS-Protection"] = 0
        response["Content-Security-Policy"] = "upgrade-insecure-requests"

        return response
