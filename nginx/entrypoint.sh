#!/usr/bin/env sh

### Sustituir las variables de entorno en la config ngnix
set -eu
envsubst '${NODE_HOST} ${DOMAIN}' < /etc/nginx/locations.template > /etc/nginx/locations.conf
envsubst '${NODE_HOST} ${DOMAIN}' < /etc/nginx/nginx.template > /etc/nginx/nginx.conf

### Lanzar el script de renovación de certificados en background
/opt/certbot.sh &

### Lanzar nginx sin el daemonio para tenerlo como PID principal 
nginx -g "daemon off;"
