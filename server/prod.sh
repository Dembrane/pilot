#!/bin/sh
echo "Starting server"
cd /code/server 
alembic upgrade head
uvicorn server.main:app --host 0.0.0.0 --proxy-headers