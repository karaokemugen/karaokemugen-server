#!/bin/bash -euo pipefail

# When running a fork, ensure submodules are available
if upstreamUrl="$(git remote get-url upstream)"; then
    upstreamBaseUrl="$(echo "$upstreamUrl" | awk -F/ -v OFS='/' 'NF-=1')"
    git config --file "$GITPOD_REPO_ROOT/.gitmodules" --get-regexp 'submodule\..*\.path' | while read -r confKey smPath; do
        if ! test -d "${smPath}/.git"; then # Not cloned
            urlConfKey="$(echo "$confKey" | sed 's/path$/url/')"
            git config --file "$GITPOD_REPO_ROOT/.git/config" "$urlConfKey" \
                "$(git config --file "$GITPOD_REPO_ROOT/.gitmodules" --get "$urlConfKey" | sed  "s|\.\.|$upstreamBaseUrl|")"
        fi
    done
    git submodule update --init
fi