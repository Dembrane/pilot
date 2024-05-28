#!/bin/bash

curl -sSf https://rye.astral.sh/get | RYE_INSTALL_OPTION="--yes" bash
echo 'source "$HOME/.rye/env"' >> ~/.bashrc

curl -fsSL https://fnm.vercel.app/install | bash
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.bashrc

. ~/.bashrc

fnm completions --shell bash
fnm install 18
npm i -g yarn

# Parallel installation for frontend and server dependencies
(
  cd frontend
  yarn install
) &
frontend_pid=$!

(
  cd server
  rye sync
  alembic upgrade head
  pip install mypy
) &
server_pid=$!

# Wait for the parallel tasks to complete
wait $frontend_pid
wait $server_pid

echo "Setup complete"