#!/bin/sh

frontend() {
  cd frontend
  yarn build
}

server() {
  cd server
  mypy .
  ruff .
}

frontend &
frontend_pid=$!

server &
server_pid=$!

wait $server_pid
wait $frontend_pid

echo "Done"