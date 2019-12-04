#!/usr/bin/env sh


### Sustitute environment variables in ngnix configuration templates
set -eu
envsubst '${NODE_HOST} ${DOMAIN}' < /etc/nginx/locations.template > /etc/nginx/locations.conf
envsubst '${NODE_HOST} ${DOMAIN}' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf
#cat /etc/nginx/nginx.conf
#cat /etc/nginx/locations.conf

### Send certbot Emission/Renewal to background
$(while :; do /opt/certbot.sh; sleep 24h; done;) &

### Check for changes in the certificate (i.e renewals or first start) and send this process to background
$(while inotifywait -e close_write /usr/share/nginx/certificates; do nginx -s reload; done) &

### Start nginx with daemon off as our main pid
nginx -g "daemon off;"
