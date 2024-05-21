#!/bin/sh

# Function to install Rye
install_rye() {
    curl -sSf https://rye-up.com/get | RYE_NO_AUTO_INSTALL=1 RYE_INSTALL_OPTION="--yes" bash
    source "$HOME/.rye/env"
}

# Parallel installation for frontend and server dependencies
(
  cd frontend
  yarn install
) &
frontend_pid=$!

(
  cd server
  install_rye
  rye sync
  alembic upgrade head
) &
server_pid=$!

# Wait for the parallel tasks to complete
wait $frontend_pid
wait $server_pid

echo "Setup complete"