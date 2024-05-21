#!/usr/bin/env bash

ENV=$1

if [ -z "$ENV" ]; then
    echo "No environment provided, exiting..."
    exit 1
fi

echo "Pulling latest changes"
git pull

BUILD_VERSION=$(git rev-parse --short HEAD)
echo "Deploying new version: $BUILD_VERSION"

echo "Building"

if [[ $ENV == "prod" ]]; then
    echo "Using production settings"
    export BUILD_VERSION=$BUILD_VERSION
    export API_BASE_URL="api.findcommonground.app"
    export ADMIN_BASE_URL="admin.findcommonground.app"
    export PARTICIPANT_BASE_URL="participant.findcommonground.app"
    docker compose up --build -d
# for "local"
elif [[ $ENV == "local" ]]; then
    echo "Using local settings"
    export BUILD_VERSION="local-$BUILD_VERSION"
    export API_BASE_URL="localhost:8000"
    export ADMIN_BASE_URL="localhost:8001"
    export PARTICIPANT_BASE_URL="localhost:8002"
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

echo "Reloading CADDY_CONTAINER"
docker compose restart caddy