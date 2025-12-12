#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-}"
VM_ID="${VM_ID:-}"
TOKEN="${TOKEN:-}"
STATUS_INPUT="${STATUS:-}"
CONNECTED="${CONNECTED:-}"
STATUS="${STATUS_INPUT:-}"
if [ -z "$STATUS" ]; then
  if [ "${CONNECTED:-}" = "1" ]; then STATUS="RUNNING"; else STATUS="STOPPED"; fi
fi
PAYLOAD="$(printf '{"status":"%s"}' "$STATUS")"
if [ -n "$API_BASE" ] && [ -n "$VM_ID" ]; then
  if [ -n "$TOKEN" ]; then
    curl -sS -X PUT "$API_BASE/api/infrastructure/vms/$VM_ID" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$PAYLOAD" || true
  else
    curl -sS -X PUT "$API_BASE/api/infrastructure/vms/$VM_ID" -H "Content-Type: application/json" -d "$PAYLOAD" || true
  fi
else
  printf '%s\n' "$PAYLOAD"
fi
