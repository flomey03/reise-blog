#!/usr/bin/env bash
#
# Writes two archives into ./backups:
#   data-<timestamp>.tar.gz     SQLite database + sessions
#   uploads-<timestamp>.tar.gz  media files
#
# The app is stopped for the duration of the copy, so SQLite writes are flushed
# and the database files cannot change mid-tar. It is started again on exit,
# including on failure.

set -euo pipefail

cd "$(dirname "$0")/.."
stamp=$(date +%Y%m%d-%H%M%S)
mkdir -p backups

docker compose stop app
trap 'docker compose start app >/dev/null' EXIT

docker compose run --rm --no-deps -T tools sh -c "
  set -e
  tar -czf /backups/data-$stamp.tar.gz -C /data .
  tar -czf /backups/uploads-$stamp.tar.gz -C /uploads .
"

echo "backups/data-$stamp.tar.gz"
echo "backups/uploads-$stamp.tar.gz"
