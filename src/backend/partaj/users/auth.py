"""
Create an authentication backend for user authenticated with Cerbère, reusing
django-cas's built-in.
"""

from django_cas_ng.backends import CASBackend


class CerbereCASBackend(CASBackend):
    def user_can_authenticate(self, user):
        return True
