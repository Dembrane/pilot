#!/bin/sh

celery -A dembrane.tasks worker --loglevel=debug 