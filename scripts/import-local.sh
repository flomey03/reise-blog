#!/usr/bin/env bash
#
# Copies the local development database and media uploads into the volumes, so
# a fresh container continues with the content you already have.
#
#   docker compose up -d --build   # once, to create the containers
#   scripts/import-local.sh
#
# Existing data in the volumes is overwritten.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f data.db ]; then
  echo "no ./data.db to import" >&2
  exit 1
fi

container=$(docker compose ps -aq app)
if [ -z "$container" ]; then
  echo "app container does not exist yet — run: docker compose up -d --build" >&2
  exit 1
fi

docker compose stop app
trap 'docker compose start app >/dev/null' EXIT

echo "importing ./data.db"
docker cp data.db "$container:/data/data.db"
# Leftover WAL files from the local database would confuse SQLite.
docker compose run --rm --no-deps -T tools sh -c "rm -f /data/data.db-wal /data/data.db-shm"

if [ -d uploads ] && [ -n "$(ls -A uploads 2>/dev/null)" ]; then
  echo "importing ./uploads"
  docker compose cp uploads/. "$container:/uploads/"
fi

echo "done"
