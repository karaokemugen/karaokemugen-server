#!/bin/bash -e

yarn pull
yarn install
yarn build:all
yarn migrate
yarn start --generate > app/generate.log 2>&1 &
      