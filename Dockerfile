# Partaj, manage and drive internal advice activity
#
# Nota bene:
#
# this container expects two volumes for statics and media files (that will be
# served by nginx):
#
# * /data/media
# * /data/static
#
# Once mounted, you will need to collect static files via the eponym django
# admin command:
#
#     python ./manage.py collectstatic
#

# ---- base image to inherit from ----
FROM python:3.7-stretch as base

# ---- back-end builder image ----
FROM base as back-builder

# We want the most up-to-date stable pip release
RUN pip install --upgrade pip

WORKDIR /builder

COPY src/backend/partaj src/backend/setup.* /builder/

RUN mkdir /install && \
    pip install --prefix=/install .

# ---- final application image ----
FROM base

# Install gettext
RUN apt-get update && \
    apt-get install -y \
    gettext && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy partaj application (see .dockerignore)
COPY . /app/

WORKDIR /app/src/backend

# Gunicorn
RUN mkdir -p /usr/local/etc/gunicorn
COPY docker/files/usr/local/etc/gunicorn/partaj.py /usr/local/etc/gunicorn/partaj.py

# Give the "root" group the same permissions as the "root" user on /etc/passwd
# to allow a user belonging to the root group to add new users; typically the
# docker user (see entrypoint).
RUN chmod g=u /etc/passwd

# We wrap commands run in this container by the following entrypoint that
# creates a user on-the-fly with the container user ID (see USER) and root group
# ID.
ENTRYPOINT [ "/app/bin/entrypoint" ]

# Make Django-related arguments available as environment variables to Python/Django
ARG DJANGO_CONFIGURATION=Development
ENV DJANGO_CONFIGURATION ${DJANGO_CONFIGURATION}

ARG DJANGO_SECRET_KEY=ThisIsAnExampleKeyForDevPurposeOnly
ENV DJANGO_SECRET_KEY ${DJANGO_SECRET_KEY}

ARG DJANGO_SETTINGS_MODULE=partaj.settings
ENV DJANGO_SETTINGS_MODULE ${DJANGO_SETTINGS_MODULE}

# Collectstatic can run before CMD as it does not need a database connection
RUN python manage.py collectstatic --noinput

# Build binary translation files for use by Django
RUN python manage.py compilemessages

# The default command runs gunicorn WSGI server
CMD python manage.py migrate && \
    gunicorn -c /usr/local/etc/gunicorn/partaj.py partaj.wsgi:application
