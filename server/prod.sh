#!/bin/sh

echo "Starting server"
cd /code/server && uvicorn server.main:app --host 0.0.0.0 --proxy-headers