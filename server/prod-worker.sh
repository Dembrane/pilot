#!/bin/sh
echo "Starting worker"
cd /code/server 
celery -A dembrane.tasks worker --loglevel=info 