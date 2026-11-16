#!/bin/sh
#
# Prepares the data volume and makes sure EMDASH_ENCRYPTION_KEY exists before
# the server starts.
#
# The key is generated once and kept in the data volume, next to the database,
# so a volume backup restores into a working site without carrying a separate
# secret. An operator-provided EMDASH_ENCRYPTION_KEY always wins.
set -eu

DATA_DIR=/app/data
KEY_FILE="${EMDASH_KEY_FILE:-$DATA_DIR/secrets/encryption.key}"

mkdir -p "$DATA_DIR/uploads" "$DATA_DIR/sessions" "$(dirname "$KEY_FILE")"

if [ -z "${EMDASH_ENCRYPTION_KEY:-}" ]; then
	if [ -s "$KEY_FILE" ]; then
		EMDASH_ENCRYPTION_KEY="$(cat "$KEY_FILE")"
	else
		umask 077
		./node_modules/.bin/emdash secrets generate >"$KEY_FILE"
		EMDASH_ENCRYPTION_KEY="$(cat "$KEY_FILE")"
	fi
	export EMDASH_ENCRYPTION_KEY
fi

exec "$@"
