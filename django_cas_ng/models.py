from importlib import import_module

from cas import CASError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.http import HttpRequest

from .utils import get_cas_client, get_user_from_session

SessionStore = import_module(settings.SESSION_ENGINE).SessionStore


class ProxyError(ValueError):
    pass


class ProxyGrantingTicket(models.Model):
    class Meta:
        unique_together = ("session_key", "user")

    session_key = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    pgtiou = models.CharField(max_length=255, null=True, blank=True)
    pgt = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    @classmethod
    def clean_deleted_sessions(cls) -> None:
        for pgt in cls.objects.all():
            session = SessionStore(session_key=pgt.session_key)
            user = get_user_from_session(session)
            if not user.is_authenticated:
                pgt.delete()

    @classmethod
    def retrieve_pt(cls, request: HttpRequest, service: str) -> str:
        """`request` should be the current HttpRequest object
        `service` a string representing the service for witch we want to
        retrieve a ticket.
        The function return a Proxy Ticket or raise `ProxyError`
        """
        try:
            pgt = cls.objects.get(
                user=request.user, session_key=request.session.session_key
            ).pgt
        except cls.DoesNotExist:
            raise ProxyError(
                "INVALID_TICKET", "No proxy ticket found for this HttpRequest object"
            )
        else:
            client = get_cas_client(service_url=service, request=request)
            try:
                return client.get_proxy_ticket(pgt)
            # change CASError to ProxyError nicely
            except CASError as error:
                raise ProxyError(*error.args)
            # just embed other errors
            except Exception as e:
                raise ProxyError(e)


class SessionTicket(models.Model):
    session_key = models.CharField(max_length=255)
    ticket = models.CharField(max_length=255)

    @classmethod
    def clean_deleted_sessions(cls) -> None:
        for st in cls.objects.all():
            session = SessionStore(session_key=st.session_key)
            user = get_user_from_session(session)
            if not user.is_authenticated:
                st.delete()


class UserMapping(models.Model):
    """
    Map and existing or newly created user in the Django application with their id
    as it comes from the CAS/SAML identity provider.

    In our opinion, it is a good practice to do this in the dependency as it avoids
    forcing the user to add unwanted fields to their users just to handle these identity
    provider ids, or having to hardcode them in the username field of their users.
    """

    id = models.CharField(
        verbose_name="identity provider id",
        help_text="main unique ID for the user from the identity provider",
        max_length=255,
        primary_key=True,
    )
    user = models.ForeignKey(
        verbose_name="linked user",
        help_text="actual django user object",
        to=get_user_model(),
        on_delete=models.CASCADE,
    )
