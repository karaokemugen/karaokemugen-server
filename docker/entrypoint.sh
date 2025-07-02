#!/usr/bin/env bash

if [ ! -f app/config.yml ]; then
    cp config.docker.yml app/config.yml
    sed -i "s/%UUID%/$(uuidgen)/g" app/config.yml
fi

yarn migrate
yarn workspace kmserver-core qstart --createAdmin $ADMIN_USERNAME,$ADMIN_PASSWORD || true
yarn generate
nginx

exec "$@"
