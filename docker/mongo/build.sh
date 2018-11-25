#!/usr/bin/env bash
docker build . --force-rm -t billy-mongo
exit $?
