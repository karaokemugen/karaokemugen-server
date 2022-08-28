#!/bin/bash -eu

function sed_replace() {
    eval 'echo ${'$1':+"s|:'$1':|$'$1'|g;"}'
}

function sed_command() {
    echo "'{
        $(sed_replace pg_dbname)
        $(sed_replace pg_user)
        $(sed_replace pg_password)
    }'"
}

eval sed -e $(sed_command) "$GITPOD_REPO_ROOT/.gitpod/pg_mugenserver_init.sql.template" > "$GITPOD_REPO_ROOT/app/pg_mugenserver_init.sql"

docker start db || docker run -d \
    --name db \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=postgres \
    -v "$GITPOD_REPO_ROOT/app/pg_mugenserver_init.sql":/docker-entrypoint-initdb.d/init.sql:ro \
    postgres
      