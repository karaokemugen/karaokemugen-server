#!/usr/bin/env bash

if [ ! -f app/config.yml ]; then
    cp config.docker.yml app/config.yml
    sed -i "s/%UUID%/$(uuidgen)/g" app/config.yml
fi

yarn migrate
nginx

exec "$@"
