#!/bin/sh
echo "Starting worker"
celery -A dembrane.tasks worker --loglevel=info 