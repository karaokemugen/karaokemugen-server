#!/bin/bash
git pull
yarn pull
yarn
yarn build:all
yarn migrate
sudo /bin/systemctl restart kmserver