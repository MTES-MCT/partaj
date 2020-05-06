#!/usr/bin/env bash

set -eo pipefail

REPO_DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd)"
UNSET_USER=0
COMPOSE_PROJECT="partaj"
COMPOSE_FILE="${REPO_DIR}/docker-compose.yml"

# docker_compose: wrap docker-compose command
#
# usage: docker_compose [options] [ARGS...]
#
# options: docker-compose command options
# ARGS   : docker-compose command arguments
function _docker_compose() {

    echo "🐳(compose) project: '${COMPOSE_PROJECT}' file: '${COMPOSE_FILE}'"
    docker-compose \
        -p "${COMPOSE_PROJECT}" \
        -f "${COMPOSE_FILE}" \
        --project-directory "${REPO_DIR}" \
        "$@"
}

# _dc_run: wrap docker-compose run command
#
# usage: _dc_run [options] [ARGS...]
#
# options: docker-compose run command options
# ARGS   : docker-compose run command arguments
function _dc_run() {

    user_args="--user=$USER_ID"
    if [ -z $USER_ID ]; then
        user_args=""
    fi

    _docker_compose run --rm $user_args "$@"
}

# _dc_exec: wrap docker-compose exec command
#
# usage: _dc_exec [options] [ARGS...]
#
# options: docker-compose exec command options
# ARGS   : docker-compose exec command arguments
function _dc_exec() {

    echo "🐳(compose) exec command: '$@'"

    user_args="--user=$USER_ID"
    if [ -z $USER_ID ]; then
        user_args=""
    fi

    _docker_compose exec $user_args "$@"
}
