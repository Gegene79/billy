#!/usr/bin/env bash
docker build . --force-rm -t billy-node
exit $?
