#!/usr/bin/env bash
docker run -it -d -p 27017:27017 --name billy-mongo -v /mnt/sda/data/mongo/:/data/db billy-mongo --auth
exit $?
