#!/bin/bash -e

mkdir -p "$GITPOD_REPO_ROOT/app/data/git"
git clone --depth=1 ${karaokebase_url:-$default_karaokebase_url}.git ${KARAOKEBASE_BRANCH:+--branch $KARAOKEBASE_BRANCH} "$GITPOD_REPO_ROOT/app/data/git"
