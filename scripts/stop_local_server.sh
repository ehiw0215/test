#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8080}"
PID_FILE="/tmp/test-http-${PORT}.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No pid file for port ${PORT}."
  exit 0
fi

PID="$(cat "$PID_FILE" || true)"
if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Stopped server on port ${PORT} (pid ${PID})."
else
  echo "Process is already stopped for port ${PORT}."
fi

rm -f "$PID_FILE"
