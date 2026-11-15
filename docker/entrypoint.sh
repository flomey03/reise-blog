#!/bin/sh
#
# Generates the encryption key into the data volume on first start.
#
# Precedence:
#   1. EMDASH_ENCRYPTION_KEY from the environment (or compose env_file) wins —
#      an operator-provided key is never overridden.
#   2. Otherwise the key file inside the volume is used.
#   3. Otherwise a key is generated and written there.
#
# Because the key lives next to the database, a volume backup restores into a
# working site without any extra secret to carry along.
set -eu

KEY_FILE="${EMDASH_KEY_FILE:-/data/secrets/encryption.key}"

generate_key() {
	# Prefer EmDash's own generator: it owns the key format, so a format
	# change ships with the package instead of drifting in this script.
	key="$(./node_modules/.bin/emdash secrets generate 2>/dev/null | head -n 1 || true)"
	case "$key" in
	emdash_enc_v1_*) printf '%s' "$key" && return 0 ;;
	esac

	# Fallback if the CLI is unavailable: 32 random bytes, base64url, prefixed.
	node -e 'process.stdout.write("emdash_enc_v1_" + require("node:crypto").randomBytes(32).toString("base64url"))'
}

if [ -z "${EMDASH_ENCRYPTION_KEY:-}" ]; then
	if [ -s "$KEY_FILE" ]; then
		EMDASH_ENCRYPTION_KEY="$(cat "$KEY_FILE")"
	else
		mkdir -p "$(dirname "$KEY_FILE")"
		umask 077
		generate_key >"$KEY_FILE"
		EMDASH_ENCRYPTION_KEY="$(cat "$KEY_FILE")"
		echo "[entrypoint] generated encryption key at $KEY_FILE"
	fi
	export EMDASH_ENCRYPTION_KEY
fi

exec "$@"
