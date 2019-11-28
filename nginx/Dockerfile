FROM nginx:1.17-alpine
RUN mkdir /images && mkdir /thumbnails
COPY ./src/* /usr/share/nginx/html/
COPY nginx.template /etc/nginx/nginx.template
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
