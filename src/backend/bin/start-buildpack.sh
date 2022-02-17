#!/usr/bin/env bash

###
# Start script to launch the project on hosts using buildpacks, such as Scalingo.
###

python manage.py migrate
python manage.py bootstrap_elasticsearch

gunicorn -c partaj-gunicorn.py partaj.wsgi:application
