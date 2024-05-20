#!/bin/sh
echo "Starting worker"
cd /workspace/server 
celery -A dembrane.tasks worker --loglevel=info 