#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENGINE="$ROOT/runtime/layer2/kex_l2_engine.js"
OUT="${KEX_EVIDENCE_DIR:-$ROOT/evidence/self-runner}"
mkdir -p "$OUT"
node --check "$ENGINE" >"$OUT/syntax.txt" 2>&1
node "$ENGINE" >"$OUT/layer2-receipt.json"
node -e 'const fs=require("node:fs");const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(!r.all_passed||r.passed!==r.total)process.exit(1);' "$OUT/layer2-receipt.json"
node - "$OUT/layer2-receipt.json" "$OUT/runner-receipt.json" <<'NODE'
const fs=require("node:fs"),crypto=require("node:crypto");
const r=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
const out={schema:"kex.self-runner.receipt.v1",runner:"kex-self-runner",authority:"local-self-hosted",github_role:"source_distribution_only",engine:"runtime/layer2/kex_l2_engine.js",syntax:"PASS",runtime:r.all_passed?"PASS":"FAIL",passed:r.passed,total:r.total,tests:r.tests,engine_receipt_hash:r.receipt_hash};
out.receipt_hash=crypto.createHash("sha256").update(JSON.stringify(out)).digest("hex");
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,2)+"\n");
NODE
printf "SELF_RUNNER=PASS\n" >"$OUT/status.txt"
cat "$OUT/runner-receipt.json"