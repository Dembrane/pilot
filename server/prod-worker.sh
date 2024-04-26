#!/bin/sh
echo "Starting worker"
cd /code/server 
celery -A server.tasks worker --loglevel=info 