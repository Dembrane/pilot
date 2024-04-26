#!/bin/sh

# Update system and install ffmpeg only if it's not already installed
sudo apt-get update -y
dpkg -s ffmpeg &>/dev/null || sudo apt-get install ffmpeg -y

# Parallel installation for frontend and server dependencies
( cd frontend && yarn install ) &
frontend_pid=$!
( cd server && pip install -r requirements.txt && alembic upgrade head ) &
server_pid=$!

# Wait for the parallel tasks to complete
wait $frontend_pid
wait $server_pid

echo "Setup complete"
