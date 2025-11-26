"""
Partaj custom middlewares
"""

import logging

from django.conf import settings
from ipware import get_client_ip
from django.shortcuts import redirect

logger = logging.getLogger("partaj")


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
            "default-src 'self'; connect-src 'self' *.partaj.incubateur.net ws: *.crisp.chat; style-src 'self' 'unsafe-inline' *.crisp.chat *.partaj.incubateur.net; img-src 'self' *.din.developpement-durable.gouv.fr *.crisp.chat data:; script-src 'self' 'unsafe-inline' *.crisp.chat *.partaj.incubateur.net cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.js;font-src 'self' *.crisp.chat; frame-src *.partaj.incubateur.net partaj-metabase-masaf.osc-secnum-fr1.scalingo.io blob:"
            # fmt: on
        )

        return response


class AdminIPWhitelistMiddleware:
    """
    Middleware restricting the access to the admin with a whitelist of IP addresses
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/admin") and settings.ADMIN_IP_WHITELIST:
            client_ip, _ = get_client_ip(request)
            if client_ip is None:
                logger.info("Unable to verify client's IP address")
            if client_ip not in settings.ADMIN_IP_WHITELIST:
                logger.warning(
                    f"IP address {client_ip} is not in whitelist, redirecting to homepage"
                )
                return redirect("/app")

        response = self.get_response(request)

        return response
