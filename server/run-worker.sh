#!/bin/sh

celery -A server.tasks worker --loglevel=info 