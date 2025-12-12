#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-}"
VM_ID="${VM_ID:-}"
TOKEN="${TOKEN:-}"
CPU="${CPU:-0}"
MEMORY="${MEMORY:-0}"
DISK="${DISK:-0}"
NETWORK="${NETWORK:-0}"
PAYLOAD="$(printf '{"vmId":"%s","cpu":%s,"memory":%s,"disk":%s,"network":%s}' "$VM_ID" "$CPU" "$MEMORY" "$DISK" "$NETWORK")"
if [ -n "$API_BASE" ] && [ -n "$VM_ID" ]; then
  if [ -n "$TOKEN" ]; then
    curl -sS -X POST "$API_BASE/api/monitor/metrics" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$PAYLOAD" || true
  else
    curl -sS -X POST "$API_BASE/api/monitor/metrics" -H "Content-Type: application/json" -d "$PAYLOAD" || true
  fi
else
  printf '%s\n' "$PAYLOAD"
fi
