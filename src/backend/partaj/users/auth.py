# pylint: disable=E1101
# pylint: disable=R0914
# pylint: disable=R1702
# pylint: disable=R0912
# pylint: disable=R0915
# pylint: disable=W0611
"""
Create an authentication backend for user authenticated with Cerbère, reusing
django-cas's built-in.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpRequest

from django_cas_ng.backends import CASBackend
from django_cas_ng.models import UserMapping
from django_cas_ng.signals import cas_user_authenticated
from django_cas_ng.utils import get_cas_client
from sentry_sdk import capture_message

from . import signals  # noqa: F401


class CerbereCASBackend(CASBackend):
    """
    Cerbere-based CAS authentication backend.
    """

    def user_can_authenticate(self, user):
        """
        Always allow auhentication through the Cerbere CAS backend.
        """
        return True

    def authenticate(self, request: HttpRequest, ticket: str, service: str):
        """
        Verifies CAS ticket and gets or creates User object

        :returns: [User] Authenticated User object or None if authenticate failed.
        """
        user_model = get_user_model()

        client = get_cas_client(service_url=service, request=request)
        username, attributes, pgtiou = client.verify_ticket(ticket)

        # Get the user from a user mapping that links a user with their identity provider id
        try:
            user_mapping = UserMapping.objects.get(id=username)

        except UserMapping.DoesNotExist:
            user_mail = (
                attributes["UTILISATEUR.MEL"]
                if "UTILISATEUR.MEL" in attributes
                else None
            )
            user_mapping = (
                UserMapping.objects.filter(user__email=user_mail).first()
                if user_mail
                else None
            )

            if user_mapping and username:
                capture_message(
                    "[DJANGO_CAS_UPDATE_NEEDED] User with email "
                    + user_mail
                    + " has changed his Cerbere id from "
                    + user_mapping.id
                    + " to "
                    + username
                )
                user = user_mapping.user
                new_user_mapping = UserMapping.objects.create(id=username, user=user)
                user_mapping.delete()
                user_mapping = new_user_mapping

        # Dictionary of fields to add to the user as we create or update it
        user_kwargs = {}

        if attributes and request:
            attributes["UTILISATEUR.UNITE"] = "[AGRI]" + attributes["UTILISATEUR.UNITE"]

            if attributes["UTILISATEUR.UNITE"].find("[") == 0:
                if attributes["UTILISATEUR.UNITE"].find("[AGRI]") == 0:
                    attributes["UTILISATEUR.UNITE"] = attributes[
                        "UTILISATEUR.UNITE"
                    ].replace("[AGRI]", "")
                else:
                    capture_message(
                        f"User with email {attributes['UTILISATEUR.MEL']} founded with "
                        f"prefixed unit {attributes['UTILISATEUR.UNITE']}"
                        "warning",
                    )

            request.session["attributes"] = attributes

        if (
            settings.CAS_USERNAME_ATTRIBUTE != "uid"
            and settings.CAS_VERSION != "CAS_2_SAML_1_0"
        ):
            if attributes:
                username = attributes.get(settings.CAS_USERNAME_ATTRIBUTE)
            else:
                return None

        if not username:
            return None
        user = None
        username = self.clean_username(username)

        if attributes:
            reject = self.bad_attributes_reject(request, username, attributes)
            if reject:
                return None

            # If we can, we rename the attributes as described in the settings file
            # Existing attributes will be overwritten
            for cas_attr_name, req_attr_name in settings.CAS_RENAME_ATTRIBUTES.items():
                if cas_attr_name in attributes and cas_attr_name is not req_attr_name:
                    attributes[req_attr_name] = attributes[cas_attr_name]
                    attributes.pop(cas_attr_name)

            if settings.CAS_APPLY_ATTRIBUTES_TO_USER:
                # If we are receiving None for any values which cannot be NULL
                # in the User model, set them to an empty string instead.
                # Possibly it would be desirable to let these throw an error
                # and push the responsibility to the CAS provider or remove
                # them from the dictionary entirely instead. Handling these
                # is a little ambiguous.
                user_model_fields = user_model._meta.fields

                for field in user_model_fields:
                    # Handle null -> '' conversions mentioned above
                    if not field.null:
                        try:
                            if attributes[field.name] is None:
                                user_kwargs[field.name] = ""
                            else:
                                user_kwargs[field.name] = attributes[field.name]
                        except KeyError:
                            continue
                    # Coerce boolean strings into true booleans
                    elif field.get_internal_type() == "BooleanField":
                        try:
                            boolean_value = attributes[field.name] == "True"
                            user_kwargs[field.name] = boolean_value
                        except KeyError:
                            continue
                    else:
                        try:
                            user_kwargs[field.name] = attributes[field.name]
                        except KeyError:
                            continue

        if not user_mapping and not settings.CAS_CREATE_USER:
            return None

        if user_mapping:
            # If the user already exists in our mapping, we're not creating it
            created = False
            user = user_mapping.user
            if settings.CAS_APPLY_ATTRIBUTES_TO_USER:
                for field_name, value in user_kwargs.items():
                    setattr(user, field_name, value)
                user.save()
        else:
            # Apply attributes to our user as we create it, if appropriate
            user = user_model.objects.create(**user_kwargs)
            # Create a mapping to associate the user with their CAS/SMAL provider id
            UserMapping.objects.create(id=username, user=user)
            created = True

        if not self.user_can_authenticate(user):
            return None

        if pgtiou and settings.CAS_PROXY_CALLBACK and request:
            request.session["pgtiou"] = pgtiou

        # send the `cas_user_authenticated` signal
        cas_user_authenticated.send(
            sender=self,
            user=user,
            created=created,
            username=username,
            attributes=attributes,
            pgtiou=pgtiou,
            ticket=ticket,
            service=service,
            request=request,
        )
        return user
