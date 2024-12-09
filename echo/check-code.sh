#!/bin/sh

frontend() {
  cd frontend
  pnpm run build
}

server() {
  cd server
  mypy .
  ruff check .
}

frontend &
frontend_pid=$!

server &
server_pid=$!

wait $server_pid
wait $frontend_pid

echo "Before deploying check the following:"
echo "1. Check if all translations are correct"