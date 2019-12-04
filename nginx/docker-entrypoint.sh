#!/usr/bin/env sh
set -eu
envsubst '${NODE_HOST} ${IMAGE_DATA} ${THUMB_DATA}' < /etc/nginx/locations.template > /etc/nginx/locations.conf
envsubst '${NODE_HOST} ${IMAGE_DATA} ${THUMB_DATA}' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf
cat /etc/nginx/nginx.conf
exec "$@"
