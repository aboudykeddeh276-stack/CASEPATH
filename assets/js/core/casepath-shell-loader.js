/**
 * Canonical shell tail loader — single script graph for mega-shell parity.
 * Surfaces: public-home, app-workspace, app-assistant, app-documents, app-mediation
 * (see data-casepath-surface on the loader tag; index may set __CASEPATH_ENTRY_SURFACE__
 * before this script for goto-scoped chains).
 */
(function () {
  "use strict";

  try {
    if (!window.__CASEPATH_AUTH_CALLBACK_HREF_CAPTURED__) {
      window.__CASEPATH_AUTH_CALLBACK_HREF_CAPTURED__ = String(window.location.href || "");
    }
  } catch (_capShellHref) {}

  var cur =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var surfaceAttr = (cur && cur.getAttribute("data-casepath-surface")) || "public-home";
  var surface = surfaceAttr;
  try {
    if (surfaceAttr === "public-home" && typeof window.__CASEPATH_ENTRY_SURFACE__ === "string") {
      var entrySurf = String(window.__CASEPATH_ENTRY_SURFACE__ || "").trim();
      if (
        entrySurf === "app-assistant" ||
        entrySurf === "app-documents" ||
        entrySurf === "app-mediation"
      ) {
        surface = entrySurf;
      }
    }
  } catch (eSurfPick) {}

  try {
    window.__CASEPATH_SHELL_SURFACE__ = surface;
  } catch (e1) {}

  if (surface === "app-workspace") {
    try {
      window.__CASEPATH_WORKSPACE_SURFACE__ = true;
    } catch (e2) {}
  }

  var V =
    (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";
  var shellLoadT0 =
    typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  try {
    window.__CASEPATH_SHELL_LOAD_T0__ = shellLoadT0;
  } catch (eShellT0) {}
  try {
    window.__casepathDynShellV = V;
  } catch (eVdyn) {}

  var anchor = cur;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      try {
        if (document.querySelector('script[src="' + src + '"]')) {
          resolve();
          return;
        }
        var needle = String(src || "").split("?")[0];
        if (needle && document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]')) {
          resolve();
          return;
        }
      } catch (eDupCheck) {}
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("Failed to load " + src));
      };
      var parent = anchor && anchor.parentNode;
      if (!parent) {
        parent = document.body;
        parent.appendChild(s);
        anchor = s;
        resolve();
        return;
      }
      parent.insertBefore(s, anchor.nextSibling);
      anchor = s;
    });
  }

  function runChain(urls, i) {
    if (i >= urls.length) return Promise.resolve();
    return loadScript(urls[i]).then(function () {
      return runChain(urls, i + 1);
    });
  }

  var mobileTailPublic = [
    "/assets/js/core/casepath-mobile-nav.js?v=" + V,
    "/assets/js/core/casepath-compass-icon.js?v=" + V,
    "/assets/js/core/casepath-floating-ask.js?v=" + V,
    "/assets/js/core/casepath-feedback.js?v=" + V,
    "/assets/js/core/casepath-qa-mobile.js?v=" + V
  ];
  var mobileTailFull = mobileTailPublic.concat([
    "/assets/js/assistant/ask-question-response.js?v=" + V,
    "/assets/js/assistant/ask-question-guided.js?v=" + V
  ]);
  var mobileTail = surface === "public-home" ? mobileTailPublic : mobileTailFull;

  var tail = mobileTail.concat([
    "/assets/js/core/casepath-shell-foot-bootstrap.js?v=" + V,
    "/assets/js/main.js?v=" + V,
    "/assets/js/core/casepath-shell-ui-tail.js?v=" + V,
    "/assets/js/flow.js?v=" + V
  ]);

  var workspaceExtras = [
    "/assets/js/case-workspace.js?v=" + V,
    "/assets/js/workflows/workspace-app.js?v=" + V
  ];
  var workspaceBundlesPromise = null;
  var shellChainStarted = false;

  function authGateWaitMsForSurface() {
    if (surface === "app-workspace" || surface === "app-documents") return 4500;
    return undefined;
  }

  function startShellChainIfAllowed(gate) {
    if (shellChainStarted) return Promise.resolve(true);
    if (gate && gate.allowed === false && gate.pending === true) return Promise.resolve(false);
    if (gate && gate.allowed === false) return Promise.resolve(false);
    shellChainStarted = true;
    return runChain(chain, 0).then(function () {
      return true;
    });
  }

  function ensureShellChainAfterGate(opts) {
    opts = opts || {};
    if (
      window.CasePathProtectedRoutes &&
      typeof window.CasePathProtectedRoutes.waitForCurrentRouteAccess === "function"
    ) {
      return window.CasePathProtectedRoutes.waitForCurrentRouteAccess({
        surface: surface,
        timeoutMs: typeof opts.timeoutMs === "number" ? opts.timeoutMs : authGateWaitMsForSurface(),
      });
    }
    return Promise.resolve({ allowed: true });
  }

  function ensureWorkspaceBundles() {
    if (surface !== "app-workspace") return Promise.resolve(false);
    if (window.__CASEPATH_WORKSPACE_BUNDLES_LOADED__) return Promise.resolve(true);
    if (workspaceBundlesPromise) return workspaceBundlesPromise;
    workspaceBundlesPromise = runChain(workspaceExtras, 0)
      .then(function () {
        window.__CASEPATH_WORKSPACE_BUNDLES_LOADED__ = true;
        return true;
      })
      .catch(function (err) {
        workspaceBundlesPromise = null;
        throw err;
      });
    return workspaceBundlesPromise;
  }

  window.CasePathShellLoader = {
    ensureWorkspaceBundles: ensureWorkspaceBundles,
    startShellChainIfAllowed: startShellChainIfAllowed,
  };

  /**
   * App-workspace: eager vault crypto, assistant thin wire, billing, then app.js + workspace bundles.
   * Public-home: lazy vault; billing lane for SPA pricing checkout; no assistant wire, no workspace bundles.
   * Other surfaces: see appAssistantChain / appDocumentsChain / appMediationChain below.
   */
  var appWorkspaceChain = [
    "/assets/js/core/casepath-spa-url.js?v=" + V,
    "/assets/js/core/casepath-production-invariant.js?v=" + V,
    "/assets/js/core/event-bus.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry.js?v=" + V,
    "/assets/js/core/casepath-telemetry.js?v=" + V,
    "/assets/js/core/casepath-csp-instrumentation.js?v=" + V,
    "/assets/js/core/casepath-adversarial-audit.js?v=" + V,
    "/assets/js/translations.js",
    "/assets/js/nav-link-fallback.js?v=" + V,
    "/assets/js/core/casepath-runtime-flags.js?v=" + V,
    "/assets/js/core/casepath-quick-exit.js?v=" + V,
    "/assets/js/core/casepath-runtime-policy.js?v=" + V,
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/core/casepath-external-ai-privacy.js?v=" + V,
    "/assets/js/core/casepath-runtime-health.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry-overlay.js?v=" + V,
    "/assets/js/account/entitlements-state.js?v=" + V,
    "/assets/js/core/casepath-access.js?v=" + V,
    "/assets/js/core/casepath-nav-auth.js?v=" + V,
    "/assets/js/casepath-static-auth-host.js?v=" + V,
    "/assets/js/casepath-nav-access.js?v=" + V,
    "/assets/js/core/casepath-route-log.js?v=" + V,
    "/assets/js/core/casepath-goto-router.js?v=" + V,
    "/assets/js/core/argon2-loader.js?v=" + V,
    "/assets/js/core/zero-knowledge-vault.js?v=" + V,
    "/assets/js/workflows/zero-knowledge-vault-service.js?v=" + V,
    "/assets/js/workflows/vault-client-crypto.js?v=" + V,
    "/assets/js/assistant/assistant-ui-wire.js?v=" + V,
    "/assets/js/account/billing-smoke-log.js?v=" + V,
    "/assets/js/account/billing-checkout-lane.js?v=" + V,
    "/assets/js/pricing-faq.js?v=" + V,
    "/assets/js/auth-password-policy.js?v=20260727iosscroll1",
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/case-profile-service.js?v=" + V,
    "/assets/js/case-profile-hydration.js?v=" + V,
    "/assets/js/app.js?v=" + V,
    "/assets/js/core/casepath-showpage-bridge.js?v=" + V,
    "/assets/js/glossary/glossary-spa-bootstrap.js?v=" + V,
    "/assets/js/core/casepath-surface-dynamic-loaders.js?v=" + V
  ];

  var publicHomeChain = [
    "/assets/js/core/casepath-spa-url.js?v=" + V,
    "/assets/js/core/casepath-production-invariant.js?v=" + V,
    "/assets/js/core/event-bus.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry.js?v=" + V,
    "/assets/js/core/casepath-telemetry.js?v=" + V,
    "/assets/js/core/casepath-csp-instrumentation.js?v=" + V,
    "/assets/js/core/casepath-adversarial-audit.js?v=" + V,
    "/assets/js/translations.js",
    "/assets/js/nav-link-fallback.js?v=" + V,
    "/assets/js/core/casepath-runtime-flags.js?v=" + V,
    "/assets/js/core/casepath-quick-exit.js?v=" + V,
    "/assets/js/core/casepath-runtime-policy.js?v=" + V,
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/core/casepath-external-ai-privacy.js?v=" + V,
    "/assets/js/core/casepath-runtime-health.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry-overlay.js?v=" + V,
    "/assets/js/core/casepath-route-log.js?v=" + V,
    "/assets/js/core/casepath-goto-router.js?v=" + V,
    "/assets/js/app-public.js?v=" + V,
    "/assets/js/core/casepath-showpage-bridge.js?v=" + V,
    "/assets/js/glossary/glossary-spa-bootstrap.js?v=" + V,
    "/assets/js/core/casepath-surface-dynamic-loaders.js?v=" + V
  ];

  /**
   * Route-scoped index shells: no workspace bundles, no eager vault crypto.
   * Assistant / documents surfaces eager-load Stripe lane only; registry + assistant wire escalate on route (Phase 7).
   * Mediation: minimal chain until mediation ships inside the mega-shell.
   */
  var appAssistantChain = [
    "/assets/js/core/casepath-production-invariant.js?v=" + V,
    "/assets/js/core/event-bus.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry.js?v=" + V,
    "/assets/js/core/casepath-telemetry.js?v=" + V,
    "/assets/js/core/casepath-csp-instrumentation.js?v=" + V,
    "/assets/js/core/casepath-adversarial-audit.js?v=" + V,
    "/assets/js/translations.js",
    "/assets/js/nav-link-fallback.js?v=" + V,
    "/assets/js/core/casepath-runtime-flags.js?v=" + V,
    "/assets/js/core/casepath-quick-exit.js?v=" + V,
    "/assets/js/core/casepath-runtime-policy.js?v=" + V,
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/core/casepath-external-ai-privacy.js?v=" + V,
    "/assets/js/core/casepath-runtime-health.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry-overlay.js?v=" + V,
    "/assets/js/account/entitlements-state.js?v=" + V,
    "/assets/js/core/casepath-access.js?v=" + V,
    "/assets/js/core/casepath-nav-auth.js?v=" + V,
    "/assets/js/casepath-static-auth-host.js?v=" + V,
    "/assets/js/casepath-nav-access.js?v=" + V,
    "/assets/js/core/casepath-route-log.js?v=" + V,
    "/assets/js/core/casepath-goto-router.js?v=" + V,
    "/assets/js/account/billing-smoke-log.js?v=" + V,
    "/assets/js/account/billing-checkout-lane.js?v=" + V,
    "/assets/js/pricing-faq.js?v=" + V,
    "/assets/js/auth-password-policy.js?v=20260727iosscroll1",
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/case-profile-service.js?v=" + V,
    "/assets/js/case-profile-hydration.js?v=" + V,
    "/assets/js/app.js?v=" + V,
    "/assets/js/core/casepath-vault-crypto-lazy.js?v=" + V,
    "/assets/js/core/casepath-showpage-bridge.js?v=" + V,
    "/assets/js/glossary/glossary-spa-bootstrap.js?v=" + V,
    "/assets/js/core/casepath-surface-dynamic-loaders.js?v=" + V
  ];

  var appDocumentsChain = [
    "/assets/js/core/casepath-production-invariant.js?v=" + V,
    "/assets/js/core/event-bus.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry.js?v=" + V,
    "/assets/js/core/casepath-telemetry.js?v=" + V,
    "/assets/js/core/casepath-csp-instrumentation.js?v=" + V,
    "/assets/js/core/casepath-adversarial-audit.js?v=" + V,
    "/assets/js/translations.js",
    "/assets/js/nav-link-fallback.js?v=" + V,
    "/assets/js/core/casepath-runtime-flags.js?v=" + V,
    "/assets/js/core/casepath-quick-exit.js?v=" + V,
    "/assets/js/core/casepath-runtime-policy.js?v=" + V,
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/core/casepath-external-ai-privacy.js?v=" + V,
    "/assets/js/core/casepath-runtime-health.js?v=" + V,
    "/assets/js/core/casepath-runtime-telemetry-overlay.js?v=" + V,
    "/assets/js/account/entitlements-state.js?v=" + V,
    "/assets/js/core/casepath-access.js?v=" + V,
    "/assets/js/core/casepath-nav-auth.js?v=" + V,
    "/assets/js/casepath-static-auth-host.js?v=" + V,
    "/assets/js/casepath-nav-access.js?v=" + V,
    "/assets/js/core/casepath-route-log.js?v=" + V,
    "/assets/js/core/casepath-goto-router.js?v=" + V,
    "/assets/js/account/billing-smoke-log.js?v=" + V,
    "/assets/js/account/billing-checkout-lane.js?v=" + V,
    "/assets/js/pricing-faq.js?v=" + V,
    "/assets/js/auth-password-policy.js?v=20260727iosscroll1",
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/case-profile-service.js?v=" + V,
    "/assets/js/case-profile-hydration.js?v=" + V,
    "/assets/js/app.js?v=" + V,
    "/assets/js/core/casepath-vault-crypto-lazy.js?v=" + V,
    "/assets/js/core/casepath-showpage-bridge.js?v=" + V,
    "/assets/js/glossary/glossary-spa-bootstrap.js?v=" + V,
    "/assets/js/core/casepath-surface-dynamic-loaders.js?v=" + V,
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/jurisdiction-engine.js?v=" + V,
    "/assets/js/documents/documents-registry.js?v=" + V,
    "/assets/js/documents/document-centre-registry.js?v=" + V,
    "/assets/js/documents/document-centre-page.js?v=" + V,
    "/assets/js/documents/document-centre-assistant.js?v=" + V,
    "/assets/js/documents/document-centre-entry.js?v=" + V
  ];

  var appMediationChain = publicHomeChain.slice();

  var coreChain = publicHomeChain;
  if (surface === "app-workspace") coreChain = appWorkspaceChain;
  else if (surface === "app-assistant") coreChain = appAssistantChain;
  else if (surface === "app-documents") coreChain = appDocumentsChain;
  else if (surface === "app-mediation") coreChain = appMediationChain;

  var chain = coreChain.concat(surface === "app-workspace" ? workspaceExtras : []).concat(tail);

  function maybeLoadMobileDebug() {
    try {
      var q = new URLSearchParams(window.location.search || "");
      var on = q.get("mobiledebug") === "1";
      if (!on) {
        try {
          on = localStorage.getItem("casepath_mobile_debug") === "1";
        } catch (_ls) {}
      }
      var h = window.location.hostname || "";
      var local =
        h === "localhost" ||
        h === "127.0.0.1" ||
        /^192\.168\./.test(h) ||
        /^10\./.test(h);
      if (!on || !local) return Promise.resolve();
      return loadScript("/assets/js/core/casepath-mobile-debug.js?v=" + V);
    } catch (_eDbg) {
      return Promise.resolve();
    }
  }

  maybeLoadMobileDebug()
    .then(function () {
      return ensureShellChainAfterGate();
    })
    .then(function (gate) {
      return startShellChainIfAllowed(gate);
    })
    .then(function () {
      try {
        var rt = window.CasePathRuntimeTelemetry;
        var t0 = window.__CASEPATH_SHELL_LOAD_T0__;
        var now =
          typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
        var ms = typeof t0 === "number" ? now - t0 : 0;
        if (rt && typeof rt.recordShellLoadComplete === "function") {
          rt.recordShellLoadComplete(ms, surface);
        }
      } catch (eShellDone) {}
    })
    .catch(function (err) {
      try {
        console.warn("[CasePath shell]", err);
      } catch (e3) {}
    });

  try {
    document.addEventListener("casepath:route-access-granted", function () {
      if (shellChainStarted) return;
      startShellChainIfAllowed({ allowed: true }).catch(function (lateErr) {
        try {
          console.warn("[CasePath shell] late route grant", lateErr);
        } catch (_eLate) {}
      });
    });
  } catch (_eGrantWire) {}
})();
