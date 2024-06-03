#!/bin/bash

curl -sSf https://rye.astral.sh/get | RYE_INSTALL_OPTION="--yes" bash
echo 'source "$HOME/.rye/env"' >> ~/.bashrc

curl -fsSL https://fnm.vercel.app/install | bash
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.bashrc

. ~/.bashrc

fnm install 18
npm i -g yarn

cd frontend
yarn install

cd ../server
rye sync
alembic upgrade head
pip install mypy

echo "Setup complete"