/**
 * Cache / persistence guard — unregister stale workers, purge accidental quick-exit
 * storage keys, and one-shot reload when HTML references a newer asset version than
 * immutable-cached scripts on disk.
 */
(function (w) {
  "use strict";
  if (!w) return;

  var VERSION =
    (typeof w.__CASEPATH_ASSET_VERSION__ === "string" && w.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";

  var LEGACY_QUICK_EXIT_KEYS = [
    "casepath_enable_quick_exit",
    "casepath_quick_exit_enabled",
    "CASEPATH_ENABLE_QUICK_EXIT",
    "casepath_quick_exit_dismissed",
    "__casepath_quick_exit_active",
    "casepath_quick_exit",
  ];

  function purgeLegacyQuickExitPersistence() {
    var i;
    for (i = 0; i < LEGACY_QUICK_EXIT_KEYS.length; i++) {
      var k = LEGACY_QUICK_EXIT_KEYS[i];
      try {
        if (typeof localStorage !== "undefined") localStorage.removeItem(k);
      } catch (_e0) {}
      try {
        if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(k);
      } catch (_e1) {}
    }
  }

  function unregisterServiceWorkers() {
    try {
      if (!w.navigator || !w.navigator.serviceWorker || !w.navigator.serviceWorker.getRegistrations) return;
      w.navigator.serviceWorker.getRegistrations().then(function (regs) {
        for (var i = 0; i < regs.length; i++) {
          try {
            regs[i].unregister();
          } catch (_e2) {}
        }
      });
    } catch (_e3) {}
  }

  function scriptVersionFromSrc(src) {
    if (!src) return "";
    var m = String(src).match(/[?&]v=([^&]+)/);
    return m ? m[1] : "";
  }

  function collectStaleCriticalScripts() {
    var stale = [];
    var nodes = document.querySelectorAll("script[src]");
    var i;
    for (i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      if (!src || src.indexOf("/assets/js/") === -1) continue;
      if (
        src.indexOf("casepath-") === -1 &&
        src.indexOf("/assets/js/supabase.js") === -1 &&
        src.indexOf("/assets/js/auth.js") === -1 &&
        src.indexOf("auth-turnstile") === -1 &&
        src.indexOf("auth-register-captcha") === -1 &&
        src.indexOf("/app.js") === -1 &&
        src.indexOf("shell-loader") === -1 &&
        src.indexOf("/auth/") === -1
      ) {
        continue;
      }
      var v = scriptVersionFromSrc(src);
      if (v && v !== VERSION) stale.push(src);
    }
    return stale;
  }

  function maybeResyncStaleScripts() {
    var stale = collectStaleCriticalScripts();
    if (!stale.length) return;
    var guardKey = "casepath_asset_resync_" + VERSION;
    try {
      if (sessionStorage.getItem(guardKey) === "1") return;
      sessionStorage.setItem(guardKey, "1");
    } catch (_e4) {
      return;
    }
    try {
      w.location.reload();
    } catch (_e5) {}
  }

  purgeLegacyQuickExitPersistence();
  unregisterServiceWorkers();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeResyncStaleScripts);
  } else {
    setTimeout(maybeResyncStaleScripts, 0);
  }
})(typeof window !== "undefined" ? window : this);
