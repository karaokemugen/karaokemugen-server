#!/bin/bash

if [ -z "${GIT_URL}" ]; then
     echo "GIT_URL env var is not assigned"
     exit 1
fi

mkdir -p app/repos/
git clone --depth 1 "${GIT_URL}" app/repos/karaokebase || exit 1

export DISPLAY=':99.0'
Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &

set -o pipefail

if yarn startHeadless --verbose --validate --strict | tee validation.log; then
    echo "Validation succeeded, deploying"
    curl -f -X POST -H "authorization: ${KMSERVER_AUTH_TOKEN}" "${KMSERVER_UPDATE_URL}"
else
    echo "Validation failed"
    if [ -n "${NOTIFICATION_URL}" ]; then
        # Trim to 1800 characters, Discord limit is 2000
        ERROR_LINES=$(grep error validation.log | head -c 1800)
        MESSAGE_CONTENT=$(printf '🟥 Validation failed!\n```\n%s\n```' "${ERROR_LINES}")
        curl -i -H "Accept: application/json" -H "Content-Type:application/json" -X POST --data "{\"content\": $(printf '%s' "${MESSAGE_CONTENT}" | jq -Rsa --raw-output)}" "${NOTIFICATION_URL}"
    fi
    exit 1
fi
