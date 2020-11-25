"""Django settings for partaj project.

Uses django-configurations to manage environments inheritance and the loading of some
config from the environment

"""

import json
import os

from django.utils.translation import gettext_lazy as _

import sentry_sdk
from configurations import Configuration, values
from sentry_sdk.integrations.django import DjangoIntegration


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def get_release():
    """
    Get the current release of the application.

    By release, we mean the release from the version.json file à la Mozilla [1]
    (if any). If this file has not been found, it defaults to "NA".
    [1]
    https://github.com/mozilla-services/Dockerflow/blob/master/docs/version_object.md
    """
    # Try to get the current release from the version.json file generated by the
    # CI during the Docker image build
    try:
        with open(os.path.join(BASE_DIR, "version.json")) as version:
            return json.load(version)["version"]
    except FileNotFoundError:
        return "NA"  # Default: not available


class DRFMixin:
    """
    Django Rest Framework configuration mixin.
    NB: DRF picks its settings from the REST_FRAMEWORK namespace on the settings, hence
    the nesting of all our values inside that prop
    """

    REST_FRAMEWORK = {
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.TokenAuthentication",
        ],
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
        "PAGE_SIZE": 10,
    }


class SendinblueMixin:
    """
    The current implementation of emails is tied to our provider (Sendinblue) and their
    proprietary API. This allows us to take advantage of their WYSIWYG email template builder
    and have our backend send these templated emails directly using API calls.
    """

    SENDINBLUE = {
        # Use settings to stitch together our send email API calls and the templates we built in
        # Sendinblue's template builder.
        "API_KEY": values.Value(environ_name="EMAIL_PROVIDER_API_KEY"),
        "REFERRAL_ANSWER_VALIDATION_REQUESTED_TEMPLATE_ID": 9,
        "REFERRAL_ANSWERED_TEMPLATE_ID": 8,
        "REFERRAL_ASSIGNED_TEMPLATE_ID": 7,
        "REFERRAL_RECEIVED_TEMPLATE_ID": 3,
        "REFERRAL_SAVED_TEMPLATE_ID": 6,
        "SEND_HTTP_ENDPOINT": values.Value(
            "https://api.sendinblue.com/v3/smtp/email",
            environ_name="EMAIL_PROVIDER_SEND_ENDPOINT",
        ),
    }


class Base(SendinblueMixin, DRFMixin, Configuration):
    """
    Base configuration every configuration (aka environment) should inherit from.

    It depends on an environment variable that SHOULD be defined:
    - DJANGO_SECRET_KEY

    You may also want to override default configuration by setting the following
    environment variables:
    - DJANGO_DEBUG
    """

    # Static files (CSS, JavaScript, Images)
    STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)
    STATIC_URL = "/static/"
    MEDIA_URL = "/media/"
    MEDIA_ROOT = os.path.join(str(BASE_DIR), "data/media")
    STATIC_ROOT = os.path.join(str(BASE_DIR), "data/static")

    # Store uploaded files in object storage
    DEFAULT_FILE_STORAGE = "partaj.core.storage.SecuredStorage"
    AWS_ACCESS_KEY_ID = values.Value()
    AWS_SECRET_ACCESS_KEY = values.Value()
    AWS_S3_ENDPOINT_URL = values.Value()
    AWS_STORAGE_BUCKET_NAME = values.Value()
    # Uploaded files are not meant to be publicly available, or easy to access with shareable links
    AWS_DEFAULT_ACL = "private"
    AWS_QUERYSTRING_AUTH = False

    # Path prefix to access attachment files that are served by Django after
    # authenticating and authorizing a logged-in user
    ATTACHMENT_FILES_PATH = "attachment-file/"

    SECRET_KEY = values.SecretValue()

    DEBUG = values.BooleanValue(False)

    DATABASES = {
        "default": {
            "ENGINE": values.Value(
                "django.db.backends.postgresql_psycopg2",
                environ_name="DATABASE_ENGINE",
                environ_prefix=None,
            ),
            "NAME": values.Value(
                "partaj", environ_name="POSTGRES_DB", environ_prefix=None
            ),
            "USER": values.Value(
                "admin", environ_name="POSTGRES_USER", environ_prefix=None
            ),
            "PASSWORD": values.Value(
                "admin", environ_name="POSTGRES_PASSWORD", environ_prefix=None
            ),
            "HOST": values.Value(
                "db", environ_name="POSTGRES_HOST", environ_prefix=None
            ),
            "PORT": values.Value(
                5432, environ_name="POSTGRES_PORT", environ_prefix=None
            ),
        }
    }

    ALLOWED_HOSTS = []
    PARTAJ_PRIMARY_LOCATION = values.Value()

    SITE_ID = 1

    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SILENCED_SYSTEM_CHECKS = values.ListValue([])

    # Application definition
    INSTALLED_APPS = [
        "partaj.core.apps.CoreConfig",
        "partaj.users.apps.UsersConfig",
        "django.contrib.admin",
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        "django_extensions",
        "dockerflow.django",
        "phonenumber_field",
        "django_cas_ng",
        "rest_framework",
        "rest_framework.authtoken",
        "impersonate",
    ]

    MIDDLEWARE = [
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "impersonate.middleware.ImpersonateMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
        "dockerflow.django.middleware.DockerflowMiddleware",
    ]

    ROOT_URLCONF = "partaj.urls"

    TEMPLATES = [
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [],
            "APP_DIRS": True,
            "OPTIONS": {
                "context_processors": [
                    "django.template.context_processors.debug",
                    "django.template.context_processors.request",
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                    "partaj.core.context_processors.partaj_context",
                ]
            },
        }
    ]

    WSGI_APPLICATION = "partaj.wsgi.application"

    # Password validation
    # https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators
    AUTH_PASSWORD_VALIDATORS = [
        {
            "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        },
        {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
        {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
        {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    ]

    AUTH_USER_MODEL = "users.User"
    # Enable our CAS/SAML authentication in addition to the default
    AUTHENTICATION_BACKENDS = [
        "django.contrib.auth.backends.ModelBackend",
        "partaj.users.auth.CerbereCASBackend",
    ]
    # Plug our CAS/SAML login view with django's authentication system
    LOGIN_URL = "cas_ng_login"

    CAS_VERSION = "CAS_2_SAML_1_0"
    CAS_SERVER_URL = "https://authentification.din.developpement-durable.gouv.fr/cas/"
    CAS_APPLY_ATTRIBUTES_TO_USER = True
    CAS_RENAME_ATTRIBUTES = {
        "UTILISATEUR.LOGIN": "username",
        "UTILISATEUR.NOM": "last_name",
        "UTILISATEUR.PRENOM": "first_name",
        "UTILISATEUR.MEL": "email",
        "UTILISATEUR.CIVILITE": "title",
        "UTILISATEUR.TEL_FIXE": "phone_number",
        "UTILISATEUR.UNITE": "unit_name",
    }
    CAS_REDIRECT_AFTER_LOGOUT = "/"
    # Don't disconnect users from Cerbère when they log out of Partaj
    CAS_LOGOUT_COMPLETELY = False

    # Internationalization
    # https://docs.djangoproject.com/en/2.0/topics/i18n/

    # Django sets `LANGUAGES` by default with all supported languages. Let's save it to a
    # different setting before overriding it with the languages active in Partaj. We can use it
    # for example for the choice of time text tracks languages which should not be limited to
    # the few languages active in Partaj.
    # pylint: disable=no-member
    ALL_LANGUAGES = Configuration.LANGUAGES

    # Default language for the app. If the LocaleMiddleware is not enabled (which is the case
    # here), this will be the language for all users.
    LANGUAGE_CODE = "fr"

    # Careful! Languages should be ordered by priority, as this tuple is used to get
    # fallback/default languages throughout the app.
    # Use "en" as default as it is the language that is most likely to be spoken by any visitor
    # when their preferred language, whatever it is, is unavailable
    LANGUAGES = [("fr", _("french")), ("en", _("english"))]
    LANGUAGES_DICT = dict(LANGUAGES)

    # Tell Django where to store and find localization files.
    LOCALE_PATHS = (os.path.join(BASE_DIR, "locale"),)

    # Internationalization
    TIME_ZONE = "UTC"
    USE_I18N = True
    USE_L10N = True
    USE_TZ = True

    # Settings for the django-phonenumber-field package
    PHONENUMBER_DB_FORMAT = "E164"
    PHONENUMBER_DEFAULT_REGION = "FR"

    # Logging
    LOGGING = values.DictValue(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                }
            },
            "loggers": {
                "partaj": {"handlers": ["console"], "level": "INFO", "propagate": True}
            },
        }
    )

    # Sentry
    SENTRY_DSN = values.Value(None, environ_name="SENTRY_DSN")

    # Enable impersonation from the back-office
    SESSION_SERIALIZER = "partaj.users.serializers.FixImpersonateJSONSerializer"
    IMPERSONATE = {"REDIRECT_URL": "/"}

    # pylint: disable=invalid-name
    @property
    def RELEASE(self):
        """
        Return the release information.

        Delegate to the module function to enable easier testing.
        """
        return get_release()

    # pylint: disable=invalid-name
    @property
    def ENVIRONMENT(self):
        """Environment in which the application is launched."""
        return self.__class__.__name__.lower()

    @classmethod
    def post_setup(cls):
        """
        Post setup configuration.
        """
        super().post_setup()

        # The SENTRY_DSN setting should be available to activate sentry for an environment
        if cls.SENTRY_DSN is not None:
            sentry_sdk.init(
                dsn=cls.SENTRY_DSN,
                environment=str(cls.ENVIRONMENT),
                release=str(cls.RELEASE),
                integrations=[DjangoIntegration()],
            )
            with sentry_sdk.configure_scope() as scope:
                scope.set_extra("application", "backend")


class Development(Base):
    """Development environment settings.

    We set ``DEBUG`` to ``True`` by default, configure the server to respond to all hosts,
    and use a local sqlite database by default.
    """

    ALLOWED_HOSTS = ["*"]
    DEBUG = values.BooleanValue(True)
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}

    LOGGING = values.DictValue(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                }
            },
            "loggers": {
                "partaj": {"handlers": ["console"], "level": "DEBUG", "propagate": True}
            },
        }
    )


class Test(Base):
    """Test environment settings."""

    DEFAULT_FILE_STORAGE = "inmemorystorage.InMemoryStorage"


class Staging(Base):
    """
    Staging environment settings.

    Our staging environment is basically attempting to replicate Production, although
    with smaller machines and fewer constraints.

    For settings this means we're expecting them to be very similar.
    """

    # Store uploaded files in object storage
    AWS_ACCESS_KEY_ID = values.Value(
        environ_name="CELLAR_ADDON_KEY_ID", environ_prefix=None
    )
    AWS_SECRET_ACCESS_KEY = values.Value(
        environ_name="CELLAR_ADDON_KEY_SECRET", environ_prefix=None
    )
    AWS_S3_ENDPOINT_URL = values.Value()
    AWS_STORAGE_BUCKET_NAME = values.Value()

    # Enable unique filenames & compression for static files through WhiteNoise
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

    # Postgresql config that maps to Clever-Cloud environment variablees
    DATABASES = {
        "default": {
            "ENGINE": values.Value(
                "django.db.backends.postgresql_psycopg2",
                environ_name="DATABASE_ENGINE",
                environ_prefix=None,
            ),
            "NAME": values.Value(
                "partaj", environ_name="POSTGRESQL_ADDON_DB", environ_prefix=None
            ),
            "USER": values.Value(
                "admin", environ_name="POSTGRESQL_ADDON_USER", environ_prefix=None
            ),
            "PASSWORD": values.Value(
                "admin", environ_name="POSTGRESQL_ADDON_PASSWORD", environ_prefix=None
            ),
            "HOST": values.Value(
                "db", environ_name="POSTGRESQL_ADDON_HOST", environ_prefix=None
            ),
            "PORT": values.Value(
                5432, environ_name="POSTGRESQL_ADDON_PORT", environ_prefix=None
            ),
        }
    }

    # Actual allowed hosts are specified directly through an environment variable
    ALLOWED_HOSTS = values.ListValue(None)

    # Force use of SSL, stop redirect loops by picking up the header that signifies the request
    # already went through HTTPS
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True


class Production(Base):
    """
    Production environment settings.

    You must define the DJANGO_ALLOWED_HOSTS environment variable in Production
    configuration (and derived configurations):

    DJANGO_ALLOWED_HOSTS="foo.com,foo.fr"
    """

    # Store uploaded files in object storage
    AWS_ACCESS_KEY_ID = values.Value(
        environ_name="CELLAR_ADDON_KEY_ID", environ_prefix=None
    )
    AWS_SECRET_ACCESS_KEY = values.Value(
        environ_name="CELLAR_ADDON_KEY_SECRET", environ_prefix=None
    )
    AWS_S3_ENDPOINT_URL = values.Value()
    AWS_STORAGE_BUCKET_NAME = values.Value()

    # Enable unique filenames & compression for static files through WhiteNoise
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

    # Postgresql config that maps to Clever-Cloud environment variablees
    DATABASES = {
        "default": {
            "ENGINE": values.Value(
                "django.db.backends.postgresql_psycopg2",
                environ_name="DATABASE_ENGINE",
                environ_prefix=None,
            ),
            "NAME": values.Value(
                "partaj", environ_name="POSTGRESQL_ADDON_DB", environ_prefix=None
            ),
            "USER": values.Value(
                "admin", environ_name="POSTGRESQL_ADDON_USER", environ_prefix=None
            ),
            "PASSWORD": values.Value(
                "admin", environ_name="POSTGRESQL_ADDON_PASSWORD", environ_prefix=None
            ),
            "HOST": values.Value(
                "db", environ_name="POSTGRESQL_ADDON_HOST", environ_prefix=None
            ),
            "PORT": values.Value(
                5432, environ_name="POSTGRESQL_ADDON_PORT", environ_prefix=None
            ),
        }
    }

    # Actual allowed hosts are specified directly through an environment variable
    ALLOWED_HOSTS = values.ListValue(None)

    # Force use of SSL, stop redirect loops by picking up the header that signifies the request
    # already went through HTTPS
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
