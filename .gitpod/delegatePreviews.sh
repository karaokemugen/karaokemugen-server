#!/bin/bash -eu

main_host="https://kara.moe"

# No media on gitpod, delegate previews to main deployment
if [[ ${1:-} == "undo" ]]; then
    sed_expr="s|${main_host}/previews/|/previews/|g"
else
    sed_expr="s|/previews/|${main_host}/previews/|g"
fi

find "$GITPOD_REPO_ROOT/kmexplorer/" -name '*.vue' \
    -exec grep -q '/previews/' "{}" \; \
    -print0 \
    | xargs -r0 \
        sed -i "$sed_expr"