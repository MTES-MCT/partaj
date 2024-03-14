THIS_FILE := $(lastword $(MAKEFILE_LIST))
.PHONY: help build up start down destroy stop restart
help:
	make -pRrq  -f $(THIS_FILE) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$'
build:
	docker-compose -f docker-compose.yml build
up:
	docker-compose -f docker-compose.yml up
start:
	docker-compose -f docker-compose.yml start
down:
	docker-compose -f docker-compose.yml down
destroy:
	docker-compose -f docker-compose.yml down -v
stop:
	docker-compose -f docker-compose.yml stop
restart:
	docker-compose -f docker-compose.yml stop
	docker-compose -f docker-compose.yml up
sh:
	docker exec -it partaj_app_1 $(c)
makemigrations:
	docker-compose exec app python manage.py makemigrations
migrate:
	docker-compose exec app python manage.py migrate $(c)
pylint:
	docker-compose exec app  pylint ./partaj --rcfile=./.pylintrc
black:
	docker-compose exec app black ./partaj
flake8:
	docker-compose exec app flake8 ../backend
isort:
	isort src/backend/partaj/core
	isort src/backend/partaj/users
	isort src/backend/tests
bunit:
	docker-compose exec app pytest
makemessages:
	docker-compose exec app django-admin makemessages --all
prettier:
	yarn prettier --write ./js
elastic:
	docker-compose exec app python manage.py bootstrap_elasticsearch
es_init_notes:
	docker-compose exec app python manage.py es_init_notes
es_index_notes:
	docker-compose exec app python manage.py es_index_notes
update_notes:
	docker-compose exec app python manage.py update_notes
btranslate:
	docker-compose exec app python manage.py makemessages -l fr
	docker-compose exec app python manage.py makemessages -l en
bcompile:
	docker-compose exec app python manage.py compilemessages
