/**
 * Phase 13 — production origin invariants (immutable, early boot).
 * Locks dev/staging/debug tooling off on casepath.com.au / www.casepath.com.au.
 * Does not block intentional internal routes (mediation-prep-staging.html, etc.).
 */
(function (w) {
  "use strict";
  if (!w || typeof w !== "object") return;

  var PRODUCTION_HOSTS = Object.freeze(["casepath.com.au", "www.casepath.com.au"]);

  var STORAGE_UNLOCK_KEYS = Object.freeze([
    "casepath_telemetry_overlay",
    "casepath_dev_mode",
    "casepath_staging_unlock",
    "casepath_debug_unlock",
  ]);

  var QUERY_UNLOCK_KEYS = Object.freeze([
    "casepath_telemetry",
    "casepath_adversarial",
    "mp_interactive",
    "casepath_dev",
    "casepath_staging",
  ]);

  function hostname() {
    try {
      return String(w.location.hostname || "")
        .toLowerCase()
        .trim();
    } catch (_e0) {
      return "";
    }
  }

  function isLoopbackDev() {
    var h = hostname();
    if (!h) return true;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
  }

  function isProductionOrigin() {
    return PRODUCTION_HOSTS.indexOf(hostname()) !== -1;
  }

  function devEnvFlagsActive() {
    try {
      return w.CASEPATH_ENV === "development" || w.CASEPATH_ENABLE_DEV_ENTITLEMENTS === true;
    } catch (_e1) {
      return false;
    }
  }

  function isDevToolingAllowed() {
    return isLoopbackDev() && devEnvFlagsActive();
  }

  function queryHasUnlock(key) {
    try {
      var q = new URLSearchParams(w.location.search || "");
      if (key === "casepath_telemetry") return q.get("casepath_telemetry") === "1";
      if (key === "casepath_adversarial") return q.get("casepath_adversarial") === "1";
      if (key === "mp_interactive") return q.get("mp_interactive") === "1";
      if (key === "casepath_dev") return q.get("casepath_dev") === "1" || q.get("dev") === "1";
      if (key === "casepath_staging") return q.get("casepath_staging") === "1";
    } catch (_e2) {}
    return false;
  }

  function isQueryUnlockAllowed(key) {
    if (isProductionOrigin()) return false;
    if (!isLoopbackDev()) return false;
    return queryHasUnlock(key);
  }

  function isLocalStorageUnlockAllowed(key) {
    if (isProductionOrigin()) return false;
    if (!isLoopbackDev()) return false;
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem(key) === "1";
    } catch (_e3) {
      return false;
    }
  }

  function logDevStagingTelemetry(kind, detail) {
    if (!isLoopbackDev()) return;
    try {
      if (w.console && typeof w.console.debug === "function") {
        w.console.debug("[CasePath invariant]", kind, detail || "");
      }
    } catch (_e4) {}
  }

  function recordViolation(kind, detail) {
    if (!isProductionOrigin()) return;
    try {
      if (!Array.isArray(w.__CASEPATH_INVARIANT_VIOLATIONS__)) {
        w.__CASEPATH_INVARIANT_VIOLATIONS__ = [];
      }
      var row = { t: Date.now(), kind: kind, detail: detail || {} };
      w.__CASEPATH_INVARIANT_VIOLATIONS__.push(row);
      if (w.__CASEPATH_INVARIANT_VIOLATIONS__.length > 32) {
        w.__CASEPATH_INVARIANT_VIOLATIONS__.splice(0, w.__CASEPATH_INVARIANT_VIOLATIONS__.length - 32);
      }
    } catch (_e5) {}
    try {
      if (w.CasePathEvents && typeof w.CasePathEvents.dispatch === "function") {
        w.CasePathEvents.dispatch("production-invariant", row);
      }
    } catch (_e6) {}
  }

  function sealValue(name, value) {
    try {
      Object.defineProperty(w, name, {
        value: value,
        writable: false,
        configurable: false,
        enumerable: true,
      });
      return true;
    } catch (_e7) {
      try {
        w[name] = value;
      } catch (_e8) {}
      return false;
    }
  }

  function purgeStorageUnlocks() {
    var i;
    for (i = 0; i < STORAGE_UNLOCK_KEYS.length; i++) {
      try {
        if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_UNLOCK_KEYS[i]);
      } catch (_e9) {}
    }
  }

  function stripDangerousQueryParams() {
    try {
      var url = new URL(w.location.href);
      var changed = false;
      var i;
      for (i = 0; i < QUERY_UNLOCK_KEYS.length; i++) {
        var k = QUERY_UNLOCK_KEYS[i];
        if (k === "casepath_telemetry" && url.searchParams.get("casepath_telemetry")) {
          url.searchParams.delete("casepath_telemetry");
          changed = true;
        }
        if (k === "casepath_adversarial" && url.searchParams.get("casepath_adversarial")) {
          url.searchParams.delete("casepath_adversarial");
          changed = true;
        }
        if (k === "mp_interactive" && url.searchParams.get("mp_interactive")) {
          url.searchParams.delete("mp_interactive");
          changed = true;
        }
        if ((k === "casepath_dev" || k === "casepath_staging") && url.searchParams.has(k)) {
          url.searchParams.delete(k);
          changed = true;
        }
      }
      if (url.searchParams.get("dev") === "1") {
        url.searchParams.delete("dev");
        changed = true;
      }
      if (changed && w.history && typeof w.history.replaceState === "function") {
        w.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch (_e10) {}
  }

  function applyProductionLock() {
    if (!isProductionOrigin()) {
      logDevStagingTelemetry("boot_non_production", { host: hostname() });
      return;
    }

    purgeStorageUnlocks();
    stripDangerousQueryParams();

    sealValue("DEV_MODE", false);
    sealValue("CASEPATH_ENABLE_DEV_ENTITLEMENTS", false);
    sealValue("CASEPATH_ENV", "production");
    sealValue("CASEPATH_MEDIATION_PREP_ENABLED", false);
    sealValue("CASEPATH_MEDIATION_PREP_STAGING_LOCAL_OVERRIDE", false);
    sealValue("CASEPATH_MEDIATION_PREP_BETA_LOCAL_OVERRIDE", false);
    sealValue("__CASEPATH_ADVERSARIAL_AUDIT__", false);
    sealValue("__CASEPATH_RUNTIME_TELEMETRY_BUFFER__", false);
    sealValue("__CASEPATH_TELEMETRY_ENDPOINT_ENABLED__", false);
    sealValue("CASEPATH_PRODUCT", "AU");
    sealValue("__CASEPATH_PRODUCT__", "AU");

    try {
      w.DEV_ACCESS_BYPASS = false;
    } catch (_e11) {}

    recordViolation("production_lock_applied", { host: hostname() });
  }

  var snapshot = Object.freeze({
    version: 1,
    host: hostname(),
    product: "AU",
    legalSystem: "AU",
    productionOrigin: isProductionOrigin(),
    loopbackDev: isLoopbackDev(),
    devToolingAllowed: isDevToolingAllowed(),
    productionLocked: isProductionOrigin(),
    productionHosts: PRODUCTION_HOSTS,
  });

  var CasePathProductionInvariant = Object.freeze({
    PRODUCTION_HOSTS: PRODUCTION_HOSTS,
    PRODUCT: "AU",
    LEGAL_SYSTEM: "AU",
    isProductionOrigin: isProductionOrigin,
    isLoopbackDev: isLoopbackDev,
    isDevToolingAllowed: isDevToolingAllowed,
    isQueryUnlockAllowed: isQueryUnlockAllowed,
    isLocalStorageUnlockAllowed: isLocalStorageUnlockAllowed,
    getSnapshot: function () {
      return snapshot;
    },
    assertDevStagingContext: function (label, detail) {
      logDevStagingTelemetry(String(label || "dev_context"), detail);
    },
    recordViolation: recordViolation,
    applyProductionLock: applyProductionLock,
    /** DEV_ACCESS_BYPASS helper for inline mega-shell scripts */
    devAccessBypassAllowed: function () {
      if (isProductionOrigin()) return false;
      return isLoopbackDev() && devEnvFlagsActive();
    },
  });

  try {
    w.CasePathProductionInvariant = CasePathProductionInvariant;
  } catch (_ePub) {}

  applyProductionLock();
})(typeof window !== "undefined" ? window : this);
