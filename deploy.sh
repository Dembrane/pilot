#!/usr/bin/env bash

echo "$(date --utc +%FT%TZ): Pulling latest changes"
git pull

BUILD_VERSION=$(git rev-parse --short HEAD)
echo "$(date --utc +%FT%TZ): Deploying new version: $BUILD_VERSION"

echo "$(date --utc +%FT%TZ): Building"
docker compose up -e BUILD_VERSION=$BUILD_VERSION --build -d

CADDY_CONTAINER=$(docker ps -aqf "name=caddy")
echo "$(date --utc +%FT%TZ): reloading CADDY_CONTAINER: $CADDY_CONTAINER"
docker exec $CADDY_CONTAINER caddy reload -c /etc/caddy/Caddyfile

# Use later for zero downtime deployment

# docker compose rm -f docker compose build
# OLD_CONTAINER=$(docker ps -aqf "name=server")
# echo
# "$(date --utc +%FT%TZ): Scaling server up..."
# BUILD_VERSION=$BUILD_VERSION docker compose up -d --no-deps --scale server=2
# --no-recreate server
# sleep 30
# echo "$(date --utc +%FT%TZ): Scaling old server down..." docker container rm -f $OLD_CONTAINER
# docker compose up -d --no-deps --scale server=1 --no-recreate server
# echo "$(date --utc +%FT%TZ): Reloading caddy..."
# CADDY_CONTAINER=$(docker ps -aqf "name=caddy" )
# docker exec $CADDY_CONTAINER caddy reload -c /etc/caddy/Caddyfile