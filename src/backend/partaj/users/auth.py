"""
Create an authentication backend for user authenticated with Cerbère, reusing
django-cas's built-in.
"""
from django_cas_ng.backends import CASBackend

from . import signals  # noqa: F401 # pylint: disable=unused-import


class CerbereCASBackend(CASBackend):
    """
    Cerbere-based CAS authentication backend.
    """

    def user_can_authenticate(self, user):
        """
        Always allow auhentication through the Cerbere CAS backend.
        """
        return True
