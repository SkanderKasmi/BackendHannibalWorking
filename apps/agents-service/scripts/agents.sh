#!/usr/bin/env bash
set -euo pipefail
API_BASE="${API_BASE:-}"
AGENT_ID="${AGENT_ID:-}"
TOKEN="${TOKEN:-}"
TYPE="${TYPE:-}"
COMMAND="${COMMAND:-}"
SCRIPT_BODY="${SCRIPT_BODY:-}"
if [ -n "$API_BASE" ] && [ -n "$AGENT_ID" ]; then
  if [ -n "$TOKEN" ]; then
    curl -sS "$API_BASE/api/agents/$AGENT_ID/status" -H "Authorization: Bearer $TOKEN" || true
  else
    curl -sS "$API_BASE/api/agents/$AGENT_ID/status" || true
  fi
fi
if [ -n "$API_BASE" ] && [ -n "$AGENT_ID" ] && [ -n "$TYPE" ]; then
  PAYLOAD="$(printf '{"agentId":"%s","type":"%s","command":"%s","script":"%s"}' "$AGENT_ID" "$TYPE" "${COMMAND:-}" "${SCRIPT_BODY:-}")"
  if [ -n "$TOKEN" ]; then
    curl -sS -X POST "$API_BASE/api/agents/tasks" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$PAYLOAD" || true
  else
    curl -sS -X POST "$API_BASE/api/agents/tasks" -H "Content-Type: application/json" -d "$PAYLOAD" || true
  fi
fi
