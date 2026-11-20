#!/bin/bash
set -e

apt-get update
apt-get install -y jq # json formatter
rm -rf /var/lib/apt/lists/*
yarn install
yarn pull
touch mpv
touch patch
mkdir -p app
node -v
