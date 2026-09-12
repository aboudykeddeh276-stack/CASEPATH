#!/usr/bin/env bash
set -euo pipefail

# CasePath production deployment wrapper.
# The deployment command is intentionally injected by the authoritative
# infrastructure actuator. This script refuses to invent a host, provider,
# credential or deployment route.

: "${CASEPATH_DEPLOY_COMMAND:?CASEPATH_DEPLOY_COMMAND must point to the authoritative deployment actuator}"

SOURCE_REVISION="${CASEPATH_SOURCE_REVISION:-$(git rev-parse HEAD)}"
TARGET="${CASEPATH_TARGET:-https://casepath.com.au/}"
RECEIPT_DIR="${CASEPATH_RECEIPT_DIR:-ops/production/receipts}"

mkdir -p "$RECEIPT_DIR"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

set +e
bash -lc "$CASEPATH_DEPLOY_COMMAND"
DEPLOY_STATUS=$?
set -e

COMPLETED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat > "$RECEIPT_DIR/deployment-receipt.json" <<JSON
{
  "source_revision": "${SOURCE_REVISION}",
  "target": "${TARGET}",
  "actuator": "${CASEPATH_DEPLOY_COMMAND}",
  "started_at": "${STARTED_AT}",
  "completed_at": "${COMPLETED_AT}",
  "deployment_status": "$([ "$DEPLOY_STATUS" -eq 0 ] && echo SUCCESS || echo FAILED)",
  "deployment_exit_code": ${DEPLOY_STATUS}
}
JSON

exit "$DEPLOY_STATUS"
