"""WSGI script for the partaj project."""

from configurations.wsgi import get_wsgi_application


application = get_wsgi_application()  # pylint: disable=invalid-name
