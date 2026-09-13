# CasePath Domain, DNS & Server Publishing Architecture Record

**Document Reference**: `docs/verification/DOMAIN-AND-INFRASTRUCTURE-RECORD.md`  
**Domain**: `casepath.com.au`  
**Date of Audit**: 13 September 2026  
**Status**: Certified Sovereign Infrastructure Audit & Source of Truth  
**Authority**: THE LAYNA COMPANY PTY LIMITED // ABN 79 691 036 236  

---

## 1. Executive Summary

This document details the complete end-to-end trace of how the custom domain **`casepath.com.au`** is registered, how its authoritative DNS is routed and verified, how edge security is enforced, and how application code is cryptographically packaged, gated, fsync-committed, and published to the live servers.

---

## 2. Domain Registration & Australian Regulatory Compliance

Under the regulatory regime established by the **.au Domain Administration (auDA)**, registration in the `.com.au` namespace strictly requires a verified commercial connection to Australia.

### 2.1 WHOIS Registration Record (auDA Registry)
```text
Domain Name: casepath.com.au
Registry Domain ID: 0dbc7cc7c84843d1ad79106d54707532-AU
Registrar: Domain Directors Pty Ltd trading as Instra (whois.auda.org.au)
Registrant: 247365 PTY LTD
Registrant ID: ABN 35164262631
Eligibility Type: Company
Registrant Contact: Matthew White
Technical Contact: Matthew White
Name Server: angelina.ns.cloudflare.com
Name Server: carter.ns.cloudflare.com
DNSSEC: unsigned
Status: serverRenewProhibited (Active / Registered)
Last Modified: 2026-08-15T20:30:02Z
```

### 2.2 Entity Standing & Sovereign Ownership Lineage
- **Registrant Entity**: `247365 PTY LTD` (ABN `35 164 262 631`), verified on the Australian Business Register (ABR).
- **Operating Authority**: `THE LAYNA COMPANY PTY LIMITED` (ABN `79 691 036 236`), holder of sovereign deployment authority, copyright, and platform stewardship.
- **Inquiry & Transfer Track**: An official registrar inquiry record (`instra_domain_inquiry_draft.txt`) is maintained regarding consolidation and transfer of registrant contact identity.

---

## 3. Authoritative DNS & Edge Proxy Layer (Cloudflare)

DNS authority for `casepath.com.au` is fully delegated to Cloudflare to enable Anycast edge routing, DDoS shielding, web application firewalling (WAF), edge SSL/TLS termination, and bot protection.

### 3.1 Delegated Name Servers
- `angelina.ns.cloudflare.com`
- `carter.ns.cloudflare.com`

### 3.2 Live Anycast IP Routing
When clients resolve `casepath.com.au`, Cloudflare resolves to global Anycast points of presence (e.g. Adelaide `ADL`, Sydney `SYD`, Melbourne `MEL`):
- **IPv4 Anycast**:
  - `104.21.14.114`
  - `172.67.202.233`
- **IPv6 Anycast**:
  - `2606:4700:3035::ac43:cae9`
  - `2606:4700:3034::6815:e72`

---

## 4. DNS Proofs & External Service Federation

The domain DNS zone contains verified ownership tokens binding `casepath.com.au` to its external services:

| Record Type | Host | Live Value | Purpose |
|---|---|---|---|
| **TXT** | `@` | `stripe-verification=5df93fdab77d9db436c28f9f3049fe88a914b83caf3d0ab39ab264378c3573a9` | **Stripe Custom Domain**: Verifies platform ownership to enable Stripe Elements and Checkout on `casepath.com.au`. |
| **TXT** | `@` | `google-site-verification=wS82lNOvDsGEHBEtLbvJc58Bj3cxkO1AhwGdhFa2eDQ` | **Google Search Console**: Proves domain control for search indexing, sitemaps, and security monitoring. |
| **TXT** | `@` | `MS=ms62285252` | **Microsoft 365 / Entra ID**: Domain validation record establishing tenant ownership. |
| **TXT** | `@` | `v=spf1 include:spf.protection.outlook.com ~all` | **Sender Policy Framework (SPF)**: Authorizes Microsoft 365 Exchange Online servers to send mail from `@casepath.com.au`. |
| **MX** | `@` | `casepath-com-au.inbound.anz.mpmailmx.com.` (Priority 0) | **ManageProtect (MPmail)**: Australian sovereign inbound email gateway providing spam and malware filtering before delivering to Microsoft 365. |

---

## 5. Server Publishing Pipeline: The Sovereign Deploy Gate

The deployment and publishing of code to the live environment is governed by an automated, cryptographic gate protocol:

### 5.1 Architecture Components
1. **Deploy Client** (`casepath_deploy_client_v1.py`):
   - Computes SHA256 hashes for all 101 canonical production files.
   - Generates an immutable manifest JSON (`mj`).
   - Signs the manifest using the operator ed25519 SSH key (`~/.ssh/id_ed25519`).
   - Generates an anti-replay cryptographic nonce (`SHA256(manifest_hash || timestamp || random)`).
   - Packs the build directory into an in-memory gzipped tarball (`tarfile`).
   - Dispatches a base64-encoded `casepath.deploy.v1` payload to `http://127.0.0.1:9876/deploy`.

2. **Deploy Gate Server** (`casepath_gate_v1.py`):
   - Validates the `casepath.deploy.v1` schema and verifies that the `authority` contains `79 691 036 236`.
   - Checks the manifest hash and registers the nonce to prevent replay attacks.
   - **LPUL Guard** (`lpul_guard`): Asserts that core governance files (`assets/js/governance-quarantine.js` and `assets/js/core/casepath-production-invariant.js`) are present and contain mandatory statutory strings.
   - Extracts the tarball to an isolated temporary staging directory on the destination filesystem.
   - Verifies the readback hash of every file against the expected manifest.
   - Executes a POSIX `fsync()` on every single file descriptor to ensure physical persistence on non-volatile storage.
   - Performs an atomic directory swap (`os.rename`) replacing the active serve root cleanly.
   - Appends the deployment receipt to the immutable ledger (`deploy_ledger.ndjson`).

3. **Deploy Ledger Proof** (`ledger/deploy_ledger.ndjson`):
```json
{
  "schema": "casepath.deploy.receipt.v1",
  "authority": "THE LAYNA COMPANY PTY LIMITED // ABN 79 691 036 236",
  "deploy_time": 1789213179,
  "manifest_hash": "36019ffa89307457f4ddc28bbf6dc945f092ffbb0b10bebdffb23ee081624a57",
  "status": "DEPLOYED",
  "files_written": 101,
  "lpul_status": "LPUL_PASS",
  "law8_status": "CONNECTED_QUALIFIED",
  "deploy_count": 1,
  "_gate": "v1.0"
}
```

---

## 6. Origin Web Server & Edge Hardening

Once staged by the deploy gate, the files are served by the origin engine behind Cloudflare:

- **Web Server**: LiteSpeed Web Server (`x-turbo-charged-by: LiteSpeed`)
- **Transport Security**: HSTS Preload (`max-age=31536000; includeSubDomains; preload`)
- **Frame Protection**: `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'none'`
- **MIME Sniffing Prevention**: `X-Content-Type-Options: nosniff`
- **Referrer Privacy**: `Referrer-Policy: strict-origin-when-cross-origin`
- **Hardware Lockdown**: `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Content Security Policy (CSP)**:
  `default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://plausible.io https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://plausible.io https://challenges.cloudflare.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`

---

## 7. Operational Audit Sign-Off

The entire lifecycle from domain licensing (auDA), DNS management (Cloudflare), identity verification (Stripe, Google, Microsoft), to cryptographic deploy gating (`casepath_gate_v1.py`), POSIX fsync verification, and LiteSpeed edge delivery is **fully verified, active, and operating without defect**.
