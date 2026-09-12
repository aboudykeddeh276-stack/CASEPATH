/**
 * CasePath — maintenance mode is OFF for public traffic.
 *
 * This file intentionally does nothing except expose a stable global so any
 * future code can read `window.CASEPATH_MAINTENANCE_MODE === false`.
 *
 * The full redirect / modal / Stripe–Vault lock implementation lives in
 * `maintenance-mode.active.js` (not loaded by any HTML in normal operation).
 * See MAINTENANCE_MODE_NOTES.md at the repo root.
 */
(function () {
  "use strict";
  try {
    window.CASEPATH_MAINTENANCE_MODE = false;
  } catch (e) {
    /* ignore */
  }
})();
