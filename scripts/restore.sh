#!/usr/bin/env bash
#
# Restores the volumes from archives made by scripts/backup.sh.
#
#   scripts/restore.sh backups/data-20261115-190000.tar.gz \
#                      backups/uploads-20261115-190000.tar.gz
#
# The uploads archive is optional. The app is stopped while the data volume is
# replaced, so SQLite never sees a half-written file.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "usage: scripts/restore.sh <data-archive> [uploads-archive]" >&2
  echo "available:" >&2
  ls -1 backups 2>/dev/null >&2 || true
  exit 1
fi

data_archive=$(basename "$1")
uploads_archive=${2:+$(basename "$2")}

for archive in "$data_archive" ${uploads_archive:+"$uploads_archive"}; do
  if [ ! -f "backups/$archive" ]; then
    echo "missing backups/$archive" >&2
    exit 1
  fi
done

docker compose stop app

echo "restoring $data_archive -> /data"
docker compose run --rm --no-deps -T tools sh -c "
  set -e
  rm -rf /data/* /data/.[!.]* 2>/dev/null || true
  tar -xzf /backups/$data_archive -C /data
"

if [ -n "$uploads_archive" ]; then
  echo "restoring $uploads_archive -> /uploads"
  docker compose run --rm --no-deps -T tools sh -c "
    set -e
    rm -rf /uploads/* /uploads/.[!.]* 2>/dev/null || true
    tar -xzf /backups/$uploads_archive -C /uploads
  "
fi

docker compose start app
echo "done — check: docker compose logs -f app"
