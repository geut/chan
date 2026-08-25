#!/bin/sh
set -e

# The workspace is mounted at runtime, and node_modules lives on a named volume
# so it does not collide with the host's installed binaries. Ensure dependencies
# are installed (or refreshed when package-lock.json changes) before running any
# user command.

if [ ! -f /workspace/node_modules/.cowork-installed ] || [ /workspace/package-lock.json -nt /workspace/node_modules/.cowork-installed ]; then
  echo "[cowork] Installing dependencies..."
  npm install
  touch /workspace/node_modules/.cowork-installed
fi

exec "$@"
