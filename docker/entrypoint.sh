#!/usr/bin/env bash

# Use linuxserver hack to downgrade to user node
USERHOME=$(grep node /etc/passwd | cut -d ":" -f6)
usermod -d "/root" node
groupmod -o -g "${PGID:-1000}" node
usermod -o -u "${PUID:-1000}" node
usermod -d "${USERHOME}" node
chown -R node: /srv/kmserver/km*

if [ ! -f app/config.yml ]; then
    cp -p config.docker.yml app/config.yml
    sed -i "s/%UUID%/$(uuidgen)/g" app/config.yml
fi

gosu node yarn migrate
nginx

gosu node "$@"
