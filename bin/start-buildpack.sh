#!/usr/bin/env bash

###
# Start script to launch the project on hosts using buildpacks, such as Scalingo.
###

# NB:

# Build binary translation files for use by Django
python manage.py compilemessages

# The default commanddd runs gunicorn WSGI server
python manage.py migrate

gunicorn -c docker/files/usr/local/etc/gunicorn/partaj.py partaj.wsgi:application
