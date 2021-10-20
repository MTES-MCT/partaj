#!/usr/bin/env bash

###
# Start script to launch the project on hosts using buildpacks, such as Scalingo.
###

# Build binary translation files for use by Django
python manage.py compilemessages

# The default commanddd runs gunicorn WSGI server
python manage.py migrate

gunicorn -c partaj-gunicorn.py partaj.wsgi:application
