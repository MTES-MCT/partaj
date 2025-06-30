"""
 Intercepts the signal emitted after automatic creation
 new user
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.dispatch import receiver

from django_cas_ng.signals import cas_user_authenticated
from sentry_sdk import capture_message

from partaj.core import models
from partaj.core.email import Mailer


@receiver(cas_user_authenticated)
def cas_user_authenticated_callback(sender, **kwargs):
    """
    Automatically assign the new user to his unit if it exists
    """
    # pylint: disable=invalid-name
    if kwargs.get("created"):
        User = get_user_model()  # pylint: disable=invalid-name
        newuser = User.objects.get(email=kwargs.get("user").email)

        try:
            if newuser.ministry == settings.ENV_VERSION:
                unit = models.Unit.objects.get(name=newuser.unit_name)

                role = (
                    models.UnitMembershipRole.OWNER
                    if unit.members.count() == 0
                    else models.UnitMembershipRole.MEMBER
                )

                models.UnitMembership.objects.create(user=newuser, unit=unit, role=role)
            else:
                capture_message(
                    f"User {newuser.id} from ministry {newuser.ministry} trying "
                    f"to connect to {settings.ENV_VERSION}"
                )

        except models.Unit.DoesNotExist:
            pass

        Mailer.send_welcome_message(newuser)

    if kwargs.get("invited"):
        Mailer.send_welcome_message(kwargs.get("user"))
