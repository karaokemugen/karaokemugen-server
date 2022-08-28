#!/bin/bash -eu

cp "$GITPOD_REPO_ROOT/.gitpod/config.yml" "$GITPOD_REPO_ROOT/app/config.yml"
sed -i "{
        s/changeit_InstanceID/$(uuidgen)/ ;
        s/changeit_JwtSecret/$(uuidgen)/ ;
        s/changeit_APIHost/${application_port}-${HOSTNAME}.${GITPOD_WORKSPACE_CLUSTER_HOST}/ ;
        s/changeit_FrontendPort/${application_port}/ ;
        s/changeit_database/${pg_dbname}/ ;
        s/changeit_password/${pg_password}/ ;
        s/changeit_username/${pg_user}/ ;
        s|changeit_karaokebase|${karaokebase_url:-$default_karaokebase_url}| ;
    }" "$GITPOD_REPO_ROOT/app/config.yml"

sed -i "s|changeit_GitlabHost|${GITLAB_HOST:-https://gitlab.com}|" "$GITPOD_REPO_ROOT/app/config.yml"

if test -n "${GITLAB_TOKEN:-}" && \
   test -n "${GITLAB_PROJECT_ID:-}"; then
    sed -i "s|changeit_GitlabToken|${GITLAB_TOKEN}|" "$GITPOD_REPO_ROOT/app/config.yml"
    sed -i "s|changeit_GitlabProjectId|${GITLAB_PROJECT_ID}|" "$GITPOD_REPO_ROOT/app/config.yml"
    sed -i "s|changeit_GitlabEnabled|${GITLAB_ENABLED:-true}|" "$GITPOD_REPO_ROOT/app/config.yml"
else
    sed -i "s|changeit_GitlabEnabled|false|" "$GITPOD_REPO_ROOT/app/config.yml"
fi