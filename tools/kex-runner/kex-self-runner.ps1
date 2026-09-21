$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Engine = Join-Path $Root "runtime\layer2\kex_l2_engine.js"
$Out = if ($env:KEX_EVIDENCE_DIR) { $env:KEX_EVIDENCE_DIR } else { Join-Path $Root "evidence\self-runner" }
New-Item -ItemType Directory -Force -Path $Out | Out-Null
node --check $Engine *> (Join-Path $Out "syntax.txt")
node $Engine | Out-File -Encoding utf8 (Join-Path $Out "layer2-receipt.json")
$r = Get-Content (Join-Path $Out "layer2-receipt.json") -Raw | ConvertFrom-Json
if (-not $r.all_passed -or $r.passed -ne $r.total) { exit 1 }
@{ schema="kex.self-runner.receipt.v1"; runner="kex-self-runner"; authority="local-self-hosted"; github_role="source_distribution_only"; engine="runtime/layer2/kex_l2_engine.js"; syntax="PASS"; runtime="PASS"; passed=$r.passed; total=$r.total; engine_receipt_hash=$r.receipt_hash } | ConvertTo-Json | Out-File -Encoding utf8 (Join-Path $Out "runner-receipt.json")
Set-Content -Path (Join-Path $Out "status.txt") -Value "SELF_RUNNER=PASS"
Get-Content (Join-Path $Out "runner-receipt.json")
