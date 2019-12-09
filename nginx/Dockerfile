FROM nginx:1.17-alpine
RUN apk add certbot

RUN mkdir /images && mkdir /thumbnails && mkdir /certbot && mkdir -p /etc/letsencrypt
# permisos al grupo nginx (101) en los certificados
RUN chown :101 /etc/letsencrypt
RUN chmod 775 /etc/letsencrypt
RUN chmod g+s /etc/letsencrypt

# Sube los scripts y ficheros de configuración
COPY --chown=nginx:nginx certbot.sh /opt/certbot.sh
COPY --chown=nginx:nginx entrypoint.sh /opt/entrypoint.sh
COPY --chown=nginx:nginx $DH_PARAM /etc/nginx/ssl-dhparams.pem

COPY --chown=nginx:nginx options-ssl-nginx.conf /etc/nginx/options-ssl-nginx.conf
COPY --chown=nginx:nginx nginx.template /etc/nginx/nginx.template
COPY --chown=nginx:nginx locations.template /etc/nginx/locations.template

# Sube el contenido estatico
COPY --chown=nginx:nginx ./src /usr/share/nginx/html/
ENTRYPOINT ["/opt/entrypoint.sh"]
