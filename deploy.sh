#!/usr/bin/env bash

ENV=$1

if [ -z "$ENV" ]; then
    echo "No environment provided, exiting..."
    exit 1
fi

echo "$(date --utc +%FT%TZ): Pulling latest changes"
git pull

BUILD_VERSION=$(git rev-parse --short HEAD)
echo "$(date --utc +%FT%TZ): Deploying new version: $BUILD_VERSION"

echo "$(date --utc +%FT%TZ): Building"

if [[ $ENV == "prod" ]]; then
    echo "Using production settings"
    export BUILD_VERSION=$BUILD_VERSION
    export API_BASE_URL="api.findcommonground.app"
    export ADMIN_BASE_URL="admin.findcommonground.app"
    export PARTICIPANT_BASE_URL="participant.findcommonground.app"
    docker compose up --build -d
else
    echo "Using test settings"
    export BUILD_VERSION="test-$BUILD_VERSION"
    export API_BASE_URL="api-test.findcommonground.app"
    export ADMIN_BASE_URL="admin-test.findcommonground.app"
    export PARTICIPANT_BASE_URL="participant-test.findcommonground.app"
    # docker compose down
    # docker builder prune
    # docker system prune
    docker compose up --build -d
fi

echo "$(date --utc +%FT%TZ): reloading CADDY_CONTAINER"
docker compose restart caddy

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