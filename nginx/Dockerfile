FROM nginx:1.17-alpine
RUN mkdir /images && mkdir /thumbnails && mkdir /certbot && mkdir /letsencrypt
COPY --chown=nginx:nginx ./src /usr/share/nginx/html/
COPY --chown=nginx:nginx nginx-oneoff.template /etc/nginx/nginx.template
COPY --chown=nginx:nginx locations.template /etc/nginx/locations.template
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
