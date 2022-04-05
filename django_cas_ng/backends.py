"""CAS authentication backend"""

from typing import Mapping, Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpRequest
from django_cas_ng.signals import cas_user_authenticated

from .models import UserMapping
from .utils import get_cas_client

__all__ = ["CASBackend"]


class CASBackend(ModelBackend):
    """CAS authentication backend"""

    def authenticate(
        self, request: HttpRequest, ticket: str, service: str
    ) -> Optional[User]:
        """
        Verifies CAS ticket and gets or creates User object

        :returns: [User] Authenticated User object or None if authenticate failed.
        """
        UserModel = get_user_model()

        client = get_cas_client(service_url=service, request=request)
        username, attributes, pgtiou = client.verify_ticket(ticket)

        print('------------ AUTHENTICATE --------------')
        print('----------------------------------------')
        print('----------------------------------------')
        print('----------------------------------------')
        print('----------------------------------------')
        # Get the user from a user mapping that links a user with their identity provider id
        try:
            print("looking for user mapping", username)
            user_mapping = UserMapping.objects.get(id=username)
        except UserMapping.DoesNotExist:
            user_mapping = None
        print('user mapping lookup result', user_mapping)

        # Dictionary of fields to add to the user as we create or update it
        user_kwargs = {}

        if attributes and request:
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
                user_model_fields = UserModel._meta.fields

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
            print("got user mapping, updating user")
            # If the user already exists in our mapping, we're not creating it
            created = False
            user = user_mapping.user
            if settings.CAS_APPLY_ATTRIBUTES_TO_USER:
                for field_name, value in user_kwargs.items():
                    setattr(user, field_name, value)
                user.save()
        else:
            print("no user mapping, creating user", user_kwargs)
            # Apply attributes to our user as we create it, if appropriate
            try:
                user = UserModel.objects.create(**user_kwargs)
            except Exception:
                from partaj.core import factories
                urgency = factories.ReferralUrgencyFactory()
                urgency.index = username
                urgency.save()

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

    def clean_username(self, username: str) -> str:
        """
        Performs any cleaning on the ``username`` prior to using it to get or
        create the user object.

        By default, changes the username case according to
        `settings.CAS_FORCE_CHANGE_USERNAME_CASE`.

        :param username: [string] username.

        :returns: [string] The cleaned username.
        """
        username_case = settings.CAS_FORCE_CHANGE_USERNAME_CASE
        if username_case == "lower":
            username = username.lower()
        elif username_case == "upper":
            username = username.upper()
        elif username_case is not None:
            raise ImproperlyConfigured(
                "Invalid value for the CAS_FORCE_CHANGE_USERNAME_CASE setting. "
                "Valid values are `'lower'`, `'upper'`, and `None`."
            )
        return username

    def configure_user(self, user: User) -> User:
        """
        Configures a user after creation and returns the updated user.

        This method is called immediately after a new user is created,
        and can be used to perform custom setup actions.

        :param user: User object.

        :returns: [User] The user object. By default, returns the user unmodified.
        """
        return user

    def bad_attributes_reject(
        self, request: HttpRequest, username: str, attributes: Mapping[str, str]
    ) -> bool:
        """
        Rejects a user if the returned username/attributes are not OK.

        :returns: [boolean] ``True/False``. Default is ``False``.
        """
        return False
