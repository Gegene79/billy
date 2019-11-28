FROM eclipse-mosquitto:latest
RUN mkdir /mosquitto/conf
VOLUME "/mosquitto/conf/"
COPY config/mosquitto.conf /mosquitto/conf/
CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/conf/mosquitto.conf"]
#RUN cat /mosquitto/config/mosquitto.conf

