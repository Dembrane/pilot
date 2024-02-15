# Startup

Cmd shift p repoen in container (have docker running)
Add openai api key in /sever/.env
Installing deps will take a while

## Run in development mode

In terminal:
./server/run.sh
cd frontend && yarn dev

## Processing

All the prompts are in chains.py
process.py is run after docs are uploaded (calling prompts in chains.py)
