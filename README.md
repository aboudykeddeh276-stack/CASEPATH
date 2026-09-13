# CASEPATH — Sovereign Carrier Package
## Operating Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236)
### Architect: Aboudy Keddeh // Keddeh Systems

This package contains the complete local build, governance specifications, design tokens, route-gated micro-runtime, and historical source corpus for **CasePath** (`https://casepath.com.au`).

---

### 📂 Directory Structure
- `index.html`: Production-grade static carrier with embedded build & governance invariants.
- `assets/css/`: Canonical design tokens (`casepath-design-tokens.css`), typography (`casepath-editorial-system.css`), and layout shells.
- `assets/js/core/`: Route gates, cache guards, production invariants, and `keddeh_core_v29.js` (Transactional VFS, Merkle Ledger, DAG Engine).
- `assets/js/governance-quarantine.js`: Legal compliance sandbox enforcing LPUL solicitor review boundaries.
- `governance/`: Master Sovereign Governance & Operative Standards specification.
- `source_corpus/`: Historical market master and PKI engineering reports.

---

### 🚀 Local Testing & Development
To preview locally:
```bash
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```
