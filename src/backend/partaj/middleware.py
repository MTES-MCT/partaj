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
        response["Content-Security-Policy"] = (
            # fmt: off
            # pylint: disable=line-too-long
            "default-src 'self'; connect-src 'self' *.partaj.incubateur.net ws: *.crisp.chat; style-src 'self' 'unsafe-inline' *.crisp.chat *.partaj.incubateur.net; img-src 'self' *.din.developpement-durable.gouv.fr *.crisp.chat data:; script-src 'self' 'unsafe-inline' *.crisp.chat *.partaj.incubateur.net cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.js;font-src 'self' *.crisp.chat; frame-src *.partaj.incubateur.net partaj-metabase-masaf.osc-secnum-fr1.scalingo.io"
            # fmt: on
        )

        return response
