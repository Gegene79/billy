#!/usr/bin/env bash
docker run -it -d -u "node" -p 3000:3000 --name billy-node billy-node
exit $?
