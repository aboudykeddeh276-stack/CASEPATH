# CASEPATH KEX Public Runtime

This directory is an executable public runtime projection, not a documentation mock.

Architecture:

private/authoritative system
→ validated node definition
→ deterministic instance factory
→ public runtime artifact
→ public repository carrier
→ browser execution

The runtime deliberately keeps protected service authority outside the public projection.

## Runtime surface

- index.html: public HCI entrypoint
- runtime.js: executable deterministic instantiation/validation engine
- node-definition.json: canonical public node definition
- manifest.json: carrier and verification contract

## Evidence boundary

Successful browser execution proves this public runtime surface executes. It does not by itself prove protected backend services, hardware pass-through, mesh persistence, legal service outcomes, or other external capabilities.

Seed: KEX-NODE-PUBLIC-CASEPATH-20260921-7A3F91C2
