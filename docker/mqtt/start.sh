#!/usr/bin/env bash
docker run -it -d -p 1883:1883 --name billy-mosquitto -v /docker/mosquitto/config/:/mosquitto/conf/ billy-mosquitto
exit $?

