#!/bin/sh
echo "Starting worker"
celery -A dembrane.tasks worker -l INFO -n worker.normal -Q normal