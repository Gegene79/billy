FROM nginx:1.17-alpine
RUN apk add inotify-tools certbot openssl

RUN mkdir /images && mkdir /thumbnails && mkdir /certbot && mkdir /letsencrypt && mkdir -p /usr/share/nginx/certificates
COPY --chown=nginx:nginx certbot.sh /opt/certbot.sh
COPY --chown=nginx:nginx docker-entrypoint.sh /opt/docker-entrypoint.sh
COPY --chown=nginx:nginx $DH_PARAM /etc/nginx/ssl-dhparams.pem

# upload configurations
COPY --chown=nginx:nginx options-ssl-nginx.conf /etc/nginx/options-ssl-nginx.conf
COPY --chown=nginx:nginx nginx.template /etc/nginx/nginx.template
COPY --chown=nginx:nginx locations.template /etc/nginx/locations.template

COPY --chown=nginx:nginx ./src /usr/share/nginx/html/
ENTRYPOINT ["/opt/docker-entrypoint.sh"]
