#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"
HOST="${2:-0.0.0.0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="/tmp/test-http-${PORT}.pid"
LOG_FILE="/tmp/test-http-${PORT}.log"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" || true)"
  if [[ -n "${OLD_PID}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" || true
    sleep 0.3
  fi
fi

nohup python3 -m http.server "$PORT" --bind "$HOST" --directory "$ROOT_DIR" >"$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" > "$PID_FILE"

for _ in {1..20}; do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    echo "Server is running"
    echo "- URL: http://127.0.0.1:${PORT}/"
    echo "- PID: ${PID}"
    echo "- LOG: ${LOG_FILE}"
    exit 0
  fi
  sleep 0.2
done

echo "Failed to start server. Check log: ${LOG_FILE}" >&2
exit 1
