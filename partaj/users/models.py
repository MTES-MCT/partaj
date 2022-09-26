"""
Models for our cerbere app.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

from phonenumber_field.modelfields import PhoneNumberField


class User(AbstractBaseUser, PermissionsMixin):
    """
    Partaj users are expected to authenticate themselves through Cerbère, an identity
    provider that uses CAS/SAML to interoperate with applications.
    """

    # Generic fields to build up minimal data on any user
    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("Primary key for the user as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    date_joined = models.DateTimeField(verbose_name=_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("updated at"), auto_now=True)
    is_active = models.BooleanField(
        verbose_name=_("active"),
        help_text=_(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
        default=True,
    )

    is_staff = models.BooleanField(
        verbose_name=_("staff status"),
        help_text=_("Designates whether the user can log into this admin site."),
        default=False,
    )

    # Information we can pick up from our identity provider
    username = models.CharField(
        verbose_name=_("username"),
        help_text=_("unique human readable username"),  # ==email for Cerbère users
        max_length=255,
        unique=True,
    )
    first_name = models.CharField(
        verbose_name=_("first name"), max_length=255, blank=True
    )
    last_name = models.CharField(
        verbose_name=_("last name"), max_length=255, blank=True
    )
    email = models.EmailField(verbose_name=_("email"), max_length=255, unique=True)
    phone_number = PhoneNumberField(
        verbose_name=_("phone number"),
        help_text=_("Phone number for this user"),
        blank=True,
    )
    unit_name = models.CharField(
        verbose_name=_("unit name"), max_length=255, blank=True
    )
    title = models.CharField(verbose_name=_("title"), max_length=255, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        """
        String representation of a user, for internal purposes.
        """
        return f"{self._meta.verbose_name.title()} <{self.username}>"

    def get_full_name(self):
        """
        Get a string showing a user's full name. Avoid doing random concatenation throughout the
        app and get a consistent name for our user.
        """
        return f"{self.first_name} {self.last_name}"

    def get_note_value(self):
        """
        Get a string showing a user's full name for notix
        """
        return f"{self.first_name} {self.last_name}"

    def get_notification_name(self):
        """
        Get a string showing a user's name for notification.
        """
        return f"{self.first_name[0].lower()}.{self.last_name.lower()}"

    class Meta:
        db_table = "partaj_user"
        verbose_name = _("user")
