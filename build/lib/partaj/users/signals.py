"""
 Intercepts the signal emitted after automatic creation
 new user
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.dispatch import receiver

from django_cas_ng.signals import cas_user_authenticated

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
            if (
                newuser.unit_name.find("[AGRI]") == 0 and settings.ENV_VERSION == "MASA"
            ) or (
                settings.ENV_VERSION == "MTES"
                and newuser.unit_name.find("[AGRI]") == -1
            ):
                expert_unit_name = newuser.unit_name.replace("[AGRI]", "")
                unit = models.Unit.objects.get(name=expert_unit_name)

                role = (
                    models.UnitMembershipRole.OWNER
                    if unit.members.count() == 0
                    else models.UnitMembershipRole.MEMBER
                )

                models.UnitMembership.objects.create(user=newuser, unit=unit, role=role)

        except models.Unit.DoesNotExist:
            pass

        Mailer.send_welcome_message(newuser)

    if kwargs.get("invited"):
        Mailer.send_welcome_message(kwargs.get("user"))
