/**
 * Shared protected-route authority for simple section-based gating.
 *
 * Public model:
 * - Learn / editorial / pricing / public educational previews
 *
 * Protected model:
 * - Prepare / Your Case / private workspace tools
 *
 * Explicit exclusions:
 * - mediation preview behavior
 */
(function (w, d) {
  "use strict";
  if (w && !w.CasePathRouteAccess && d && typeof d.write === "function") {
    d.write('<script src="/assets/js/casepath-route-access.js?v=20260727iosscroll1"><\/script>');
  }
  if (!w || !d || w.CasePathProtectedRoutes) return;

  var STATE = {
    PUBLIC: "PUBLIC",
    AUTH_REQUIRED: "AUTH_REQUIRED",
  };

  function getRouteAccess() {
    return w.CasePathRouteAccess || null;
  }

  var POLICY = null;

  function buildPolicySnapshot() {
    var routeAccess = getRouteAccess();
    var policy = {
      publicPrefixes: [],
      publicPaths: {},
      protectedPrefixes: [],
      protectedPaths: {},
      excludedPrefixes: [],
      excludedPaths: {},
      goto: { public: {}, protected: {}, excluded: {} },
    };
    if (!routeAccess) return policy;
    (routeAccess.PUBLIC_ROUTES || []).concat(routeAccess.EXTRA_PUBLIC_ROUTES || []).forEach(function (path) {
      policy.publicPaths[String(path || "")] = true;
    });
    (routeAccess.PROTECTED_PREFIXES || []).forEach(function (prefix) {
      policy.protectedPrefixes.push(prefix);
    });
    (routeAccess.PROTECTED_ROUTES || []).concat(routeAccess.EXTRA_PROTECTED_ROUTES || []).forEach(function (path) {
      var meta = routeAccess.classifyPath(path);
      policy.protectedPaths[String(path || "")] = {
        featureKey: meta && meta.featureKey ? meta.featureKey : null,
        section: meta && meta.section ? meta.section : "protected",
      };
    });
    Object.keys(routeAccess.PAGE_META || {}).forEach(function (pageId) {
      var meta = routeAccess.PAGE_META[pageId];
      if (!meta) return;
      if (meta.state === STATE.AUTH_REQUIRED) {
        policy.goto.protected[pageId] = {
          featureKey: meta.featureKey || null,
          section: meta.section || "protected",
        };
      } else {
        policy.goto.public[pageId] = true;
      }
    });
    return policy;
  }

  function getPolicy() {
    if (!POLICY) POLICY = buildPolicySnapshot();
    return POLICY;
  }

  function resetPolicySnapshot() {
    POLICY = null;
  }

  var PROTECTED_PATH_ALIASES = {
    "/document-centre": "/document-centre.html",
    "/document-helper": "/document-centre.html",
    "/document-helper.html": "/document-centre.html",
    "/checklists": "/checklists.html",
    "/parenting-orders": "/parenting-orders.html",
    "/mediation": "/app/mediation/index.html",
    "/lawyer-portal": "/lawyer-portal.html",
    "/your-case": "/your-case.html",
  };

  function canonicalGatePath(rawPath) {
    var path = normalisePath(rawPath);
    if (PROTECTED_PATH_ALIASES[path]) return PROTECTED_PATH_ALIASES[path];
    var routeAccess = getRouteAccess();
    if (routeAccess && typeof routeAccess.canonicalPath === "function") {
      try {
        return routeAccess.canonicalPath(path);
      } catch (_eCanon) {}
    }
    return path;
  }

  var DEFAULT_WAIT_MS = 700;
  var WORKSPACE_AUTH_WAIT_MS = 4500;
  var GATE_READY_TIMEOUT_MS = 450;
  var GATE_AUTH_RESTORE_TIMEOUT_MS = 350;
  var gateState = {
    classification: null,
    gatePromise: null,
    gatePresented: false,
    shellState: "clear",
    accessGranted: false,
    accessGrantedRouteKey: null,
  };

  function debugEnabled() {
    try {
      if (w.__CASEPATH_ROUTE_GATE_DEBUG__ === true) return true;
      if (w.__CASEPATH_ROUTE_GATE_DEBUG__ === false) return false;
    } catch (_e0) {}
    try {
      return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(w.location.hostname || "");
    } catch (_e1) {
      return false;
    }
  }

  function debugLog(eventName, detail) {
    if (!debugEnabled()) return;
    try {
      console.log("[ROUTE GATE]", eventName, detail || {});
    } catch (_e) {}
  }

  function markGateTimeline(eventName, detail) {
    if (!debugEnabled()) return;
    try {
      w.__CASEPATH_AUTH_GATE_TIMELINE__ = w.__CASEPATH_AUTH_GATE_TIMELINE__ || [];
      w.__CASEPATH_AUTH_GATE_TIMELINE__.push({
        event: String(eventName || ""),
        t: Date.now(),
        detail: detail || null,
      });
      if (w.__CASEPATH_AUTH_GATE_TIMELINE__.length > 120) {
        w.__CASEPATH_AUTH_GATE_TIMELINE__.shift();
      }
      console.log("[AUTH GATE TIMING]", eventName, detail || {});
    } catch (_eTl) {}
  }

  function normalisePath(raw) {
    var path = String(raw || "/").trim().replace(/\\/g, "/");
    if (!path) return "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    path = path.toLowerCase();
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
  }

  function normaliseGotoToken(raw) {
    var token = String(raw || "").trim().toLowerCase();
    if (!token || !/^[a-z0-9_-]{1,80}$/.test(token)) return null;
    if (token === "document-centre") return "doc-helper";
    if (token === "dochelper") return "doc-helper";
    return token;
  }

  function currentGotoToken() {
    try {
      return normaliseGotoToken(new URLSearchParams(w.location.search || "").get("goto"));
    } catch (_e) {
      return null;
    }
  }

  function pathMatchesPrefix(path, prefix) {
    return path === prefix || path.indexOf(prefix + "/") === 0;
  }

  function featureKeyForProtectedPath(path) {
    if (pathMatchesPrefix(path, "/app/workspace") || pathMatchesPrefix(path, "/your-case")) return "vault";
    if (pathMatchesPrefix(path, "/app/documents") || path === "/document-centre" || path === "/document-centre.html") {
      return "documents";
    }
    if (pathMatchesPrefix(path, "/app/calendar")) return "calendar";
    if (pathMatchesPrefix(path, "/app/assistant")) return "assistant";
    if (pathMatchesPrefix(path, "/app/checklists")) return "checklists";
    if (pathMatchesPrefix(path, "/app/uploads")) return "uploads";
    if (pathMatchesPrefix(path, "/app/timeline")) return "timeline";
    if (pathMatchesPrefix(path, "/app/settings")) return "settings";
    if (pathMatchesPrefix(path, "/app/profile")) return "profile";
    if (pathMatchesPrefix(path, "/app/billing")) return "billing";
    if (path === "/lawyer-portal" || path === "/lawyer-portal.html") return "lawyerPortal";
    return null;
  }

  function buildClassification(fields) {
    return {
      kind: fields.kind || "path",
      path: fields.path || "/",
      gotoToken: fields.gotoToken || null,
      state: fields.state || STATE.PUBLIC,
      routeKey: fields.routeKey || fields.path || "/",
      featureKey: fields.featureKey || null,
      section: fields.section || (fields.state === STATE.AUTH_REQUIRED ? "protected" : "public"),
      excluded: fields.excluded === true,
      blockShell: fields.blockShell === true,
      noindex: fields.noindex === true,
      reason: fields.reason || "public-default",
    };
  }

  function routeAccessClassification(input) {
    var routeAccess = getRouteAccess();
    if (!routeAccess) return null;
    try {
      return routeAccess.classifyTarget(input);
    } catch (_eRoute) {
      return null;
    }
  }

  function gateClassificationFromRoute(input, fallbackKind) {
    var base = routeAccessClassification(input);
    if (!base) return null;
    return buildClassification({
      kind: fallbackKind || (base.gotoToken ? "goto" : "path"),
      path: base.path || normalisePath(w.location.pathname || "/"),
      gotoToken: base.gotoToken || null,
      state: base.state || STATE.PUBLIC,
      routeKey: base.gotoToken ? "goto:" + base.gotoToken : base.path || "/",
      featureKey: base.featureKey || null,
      section: base.section || (base.state === STATE.AUTH_REQUIRED ? "protected" : "public"),
      excluded: false,
      blockShell: base.state === STATE.AUTH_REQUIRED,
      noindex: base.state === STATE.AUTH_REQUIRED,
      reason: base.reason || "route-access",
    });
  }

  function classifyPath(rawPath) {
    var viaRouteAccess = gateClassificationFromRoute({ path: rawPath }, "path");
    if (viaRouteAccess) return viaRouteAccess;
    var path = canonicalGatePath(rawPath);
    var policy = getPolicy();
    var i;

    if (policy.excludedPaths[path]) {
      return buildClassification({
        path: path,
        routeKey: path,
        state: STATE.PUBLIC,
        excluded: true,
        reason: "excluded-path",
      });
    }

    for (i = 0; i < policy.excludedPrefixes.length; i++) {
      if (pathMatchesPrefix(path, policy.excludedPrefixes[i])) {
        return buildClassification({
          path: path,
          routeKey: path,
          state: STATE.PUBLIC,
          excluded: true,
          reason: "excluded-prefix",
        });
      }
    }

    if (policy.protectedPaths[path]) {
      return buildClassification({
        path: path,
        routeKey: path,
        state: STATE.AUTH_REQUIRED,
        featureKey: policy.protectedPaths[path].featureKey || featureKeyForProtectedPath(path),
        section: policy.protectedPaths[path].section || "protected",
        blockShell: true,
        noindex: true,
        reason: "protected-path",
      });
    }

    var featureKey = featureKeyForProtectedPath(path);
    if (featureKey && (path === "/document-centre.html" || path === "/document-helper.html")) {
      return buildClassification({
        path: path,
        routeKey: path,
        state: STATE.AUTH_REQUIRED,
        featureKey: featureKey,
        section: "prepare",
        blockShell: true,
        noindex: true,
        reason: "protected-path-alias",
      });
    }

    for (i = 0; i < policy.protectedPrefixes.length; i++) {
      if (pathMatchesPrefix(path, policy.protectedPrefixes[i])) {
        return buildClassification({
          path: path,
          routeKey: path,
          state: STATE.AUTH_REQUIRED,
          featureKey: featureKeyForProtectedPath(path),
          section: pathMatchesPrefix(path, "/prepare") ? "prepare" : pathMatchesPrefix(path, "/your-case") ? "your-case" : "app",
          blockShell: true,
          noindex: true,
          reason: "protected-prefix",
        });
      }
    }

    if (policy.publicPaths[path]) {
      return buildClassification({
        path: path,
        routeKey: path,
        state: STATE.PUBLIC,
        reason: "public-path",
      });
    }

    for (i = 0; i < policy.publicPrefixes.length; i++) {
      if (pathMatchesPrefix(path, policy.publicPrefixes[i])) {
        return buildClassification({
          path: path,
          routeKey: path,
          state: STATE.PUBLIC,
          reason: "public-prefix",
        });
      }
    }

    return buildClassification({
      path: path,
      routeKey: path,
      state: STATE.PUBLIC,
      reason: "public-default",
    });
  }

  function classifyGotoToken(rawGoto) {
    var viaRouteAccess = gateClassificationFromRoute({ goto: rawGoto }, "goto");
    if (viaRouteAccess) return viaRouteAccess;
    var gotoToken = normaliseGotoToken(rawGoto);
    if (!gotoToken) return null;
    var policy = getPolicy();
    if (policy.goto.excluded[gotoToken]) {
      return buildClassification({
        kind: "goto",
        path: normalisePath(w.location.pathname || "/"),
        gotoToken: gotoToken,
        routeKey: "goto:" + gotoToken,
        state: STATE.PUBLIC,
        excluded: true,
        reason: "excluded-goto",
      });
    }
    if (policy.goto.protected[gotoToken]) {
      return buildClassification({
        kind: "goto",
        path: normalisePath(w.location.pathname || "/"),
        gotoToken: gotoToken,
        routeKey: "goto:" + gotoToken,
        state: STATE.AUTH_REQUIRED,
        featureKey: policy.goto.protected[gotoToken].featureKey || null,
        section: policy.goto.protected[gotoToken].section || "protected",
        noindex: true,
        reason: "protected-goto",
      });
    }
    if (policy.goto.public[gotoToken]) {
      return buildClassification({
        kind: "goto",
        path: normalisePath(w.location.pathname || "/"),
        gotoToken: gotoToken,
        routeKey: "goto:" + gotoToken,
        state: STATE.PUBLIC,
        reason: "public-goto",
      });
    }
    return null;
  }

  function classifyCurrentRoute() {
    // Form assistants are public. If a valid ?assistant= param is present on
    // a Document Centre path, classify as PUBLIC so the gate does not block
    // or lock the shell — for guests or authenticated users.
    try {
      var assistantRoutes = w.CasePathFormAssistantRoutes;
      if (
        assistantRoutes &&
        typeof assistantRoutes.isDocumentCentrePath === "function" &&
        typeof assistantRoutes.resolveFromSearch === "function" &&
        typeof assistantRoutes.isValid === "function" &&
        assistantRoutes.isDocumentCentrePath(w.location.pathname)
      ) {
        var assistantType = assistantRoutes.resolveFromSearch(
          w.location.search || ""
        );

        if (assistantType && assistantRoutes.isValid(assistantType)) {
          return buildClassification({
            path: normalisePath(w.location.pathname),
            routeKey: normalisePath(w.location.pathname),
            state: STATE.PUBLIC,
            reason: "public-form-assistant-deep-link",
          });
        }
      }
    } catch (_eAssistantGate) {}

    var viaRouteAccess = gateClassificationFromRoute(
      { href: String(w.location.pathname || "/") + String(w.location.search || "") + String(w.location.hash || "") },
      "path"
    );
    if (viaRouteAccess) return viaRouteAccess;
    var pathRule = classifyPath(w.location.pathname || "/");
    if (pathRule && pathRule.state === STATE.AUTH_REQUIRED) return pathRule;
    var gotoRule = classifyGotoToken(currentGotoToken());
    if (gotoRule) return gotoRule;
    return pathRule;
  }

  function resolveClassification(input) {
    var viaRouteAccess = gateClassificationFromRoute(input, "path");
    if (viaRouteAccess) return viaRouteAccess;
    if (!input) return classifyCurrentRoute();
    if (input.routeKey && input.state) return input;
    if (typeof input === "string") return classifyPath(input);
    if (typeof input === "object") {
      if (input.gotoToken || input.goto) {
        var gotoRule = classifyGotoToken(input.gotoToken || input.goto);
        if (gotoRule) return gotoRule;
      }
      if (input.path || input.pathname) {
        return classifyPath(input.path || input.pathname);
      }
    }
    return classifyCurrentRoute();
  }

  function isExcludedRoute(input) {
    var classification = resolveClassification(input);
    return !!(classification && classification.excluded === true);
  }

  function isPublicRoute(input) {
    var classification = resolveClassification(input);
    return !!(classification && classification.state === STATE.PUBLIC && classification.excluded !== true);
  }

  function isProtectedRoute(input) {
    var classification = resolveClassification(input);
    return !!(classification && classification.state === STATE.AUTH_REQUIRED);
  }

  function shouldRenderWorkspaceGate(input) {
    return isProtectedRoute(input);
  }

  function authWaitMsForRoute(options, classification) {
    if (options && typeof options.timeoutMs === "number" && options.timeoutMs > 0) {
      return options.timeoutMs;
    }
    if (options && (options.surface === "app-workspace" || options.surface === "app-documents")) {
      return WORKSPACE_AUTH_WAIT_MS;
    }
    if (classification && shouldRenderWorkspaceGate(classification)) return WORKSPACE_AUTH_WAIT_MS;
    return DEFAULT_WAIT_MS;
  }

  function logAuthGateDebug(gateResult, detail) {
    try {
      var forceLog =
        w.__CASEPATH_AUTH_DEBUG__ === true ||
        w.__CASEPATH_ROUTE_GATE_DEBUG__ === true ||
        debugEnabled();
      if (!forceLog) return;
      var sessionExists = false;
      var userId = null;
      var email = null;
      var authStateLabel = "unknown";
      try {
        sessionExists = !!(w.authState && w.authState.session);
        if (w.authState && w.authState.user) {
          userId = w.authState.user.id || null;
          email = w.authState.user.email || null;
        }
      } catch (_eAuth) {}
      try {
        if (w.__CASEPATH_AUTH_STATE__) {
          authStateLabel = w.__CASEPATH_AUTH_STATE__.mode || authStateLabel;
        }
      } catch (_eState) {}
      console.log("AUTH DEBUG");
      console.log("session=" + sessionExists);
      console.log("user=" + (userId || "none"));
      console.log("email=" + (email || "none"));
      console.log("auth_state=" + authStateLabel);
      console.log("gate=" + String(gateResult || "unknown"));
      if (detail) console.log("gate_detail", detail);
    } catch (_eLog) {}
  }

  function dismissGuestGateUi() {
    try {
      var soon = d.getElementById("casepath-coming-soon-modal");
      if (soon) {
        soon.classList.remove("show");
        soon.setAttribute("aria-hidden", "true");
      }
    } catch (_eSoon) {}
    try {
      if (typeof w.casepathDismissAuthModals === "function") {
        w.casepathDismissAuthModals();
      } else if (typeof w.closeAuth === "function") {
        w.closeAuth();
      }
    } catch (_eAuthModal) {}
    try {
      d.documentElement.style.overflow = "";
    } catch (_eOverflow) {}
    gateState.gatePresented = false;
  }

  function requiresAuth(input) {
    return isProtectedRoute(input);
  }

  function ensureRobotsMeta() {
    var meta = d.querySelector('meta[name="robots"]');
    if (meta) return meta;
    meta = d.createElement("meta");
    meta.setAttribute("name", "robots");
    var head = d.head || d.documentElement;
    if (head) head.appendChild(meta);
    return meta;
  }

  function applyRobotsPolicy(classification) {
    var route = resolveClassification(classification);
    if (!route || route.noindex !== true) return;
    try {
      ensureRobotsMeta().setAttribute("content", "noindex, nofollow");
      d.documentElement.setAttribute("data-casepath-noindex", "true");
    } catch (_e) {}
  }

  function ensureGateStyle() {
    if (d.getElementById("casepath-protected-route-gate-style")) return;
    var style = d.createElement("style");
    style.id = "casepath-protected-route-gate-style";
    style.textContent =
      "html[data-casepath-route-blocked='pending'] [data-casepath-protected-shell-root]{" +
      "pointer-events:none!important;user-select:none;opacity:0.06;filter:blur(2px);}" +
      "html[data-casepath-route-blocked='guest'] [data-casepath-protected-shell-root]{" +
      "pointer-events:none!important;user-select:none;opacity:0.24;filter:blur(1.4px);}" +
      "html[data-casepath-route-blocked='mfa-entry'] [data-casepath-protected-shell-root]{" +
      "pointer-events:none!important;user-select:none;opacity:0.12;filter:blur(2px);}" +
      "[data-casepath-protected-shell-root][aria-hidden='true'] *{pointer-events:none!important;}";
    (d.head || d.documentElement).appendChild(style);
  }

  function forEachProtectedShellRoot(fn) {
    var roots = d.querySelectorAll("[data-casepath-protected-shell-root]");
    for (var i = 0; i < roots.length; i++) {
      try {
        fn(roots[i]);
      } catch (_e) {}
    }
  }

  function scheduleShellStateSync(classification, reason) {
    if (!classification || !classification.blockShell) return;
    if (d.readyState !== "loading") return;
    d.addEventListener(
      "DOMContentLoaded",
      function () {
        setShellBlocked(gateState.shellState, classification, reason || "dom-ready");
      },
      { once: true }
    );
  }

  function setShellBlocked(state, classification, reason) {
    gateState.shellState = state || "clear";
    ensureGateStyle();
    if (!classification || !classification.blockShell) {
      d.documentElement.removeAttribute("data-casepath-route-blocked");
      if (classification) {
        d.documentElement.setAttribute("data-casepath-route-policy", classification.state || STATE.PUBLIC);
        d.documentElement.setAttribute("data-casepath-route-reason", classification.reason || "");
      }
      return;
    }
    scheduleShellStateSync(classification, reason);
    if (!state || state === "clear") {
      d.documentElement.removeAttribute("data-casepath-route-blocked");
    } else {
      d.documentElement.setAttribute("data-casepath-route-blocked", state);
      try {
        d.documentElement.classList.remove("casepath-auth-bootstrapping");
        d.documentElement.removeAttribute("data-casepath-auth-bootstrap-pending");
      } catch (_eBootClear) {}
    }
    d.documentElement.setAttribute("data-casepath-route-policy", classification.state);
    d.documentElement.setAttribute("data-casepath-route-reason", classification.reason || "");
    forEachProtectedShellRoot(function (root) {
      if (!state || state === "clear") {
        root.removeAttribute("aria-hidden");
        root.removeAttribute("data-casepath-shell-gated");
        try {
          root.inert = false;
        } catch (_e0) {}
      } else {
        root.setAttribute("aria-hidden", "true");
        root.setAttribute("data-casepath-shell-gated", state);
        try {
          root.inert = true;
        } catch (_e1) {}
      }
    });
    debugLog("shell_state", {
      state: state,
      route: classification.routeKey,
      reason: reason || null,
    });
  }

  function safeCurrentReturnUrl() {
    try {
      return String(w.location.pathname || "/") + String(w.location.search || "") + String(w.location.hash || "");
    } catch (_e) {
      return "/";
    }
  }

  function rememberGuestRouteIntent(classification) {
    try {
      var returnUrl = safeCurrentReturnUrl();
      if (returnUrl) sessionStorage.setItem("cr_after_auth_url", returnUrl);
      if (classification && classification.kind === "goto" && classification.gotoToken) {
        sessionStorage.setItem("cr_pending_spa_route", classification.gotoToken);
      }
    } catch (_e) {}
  }

  function readAuthStateSync() {
    // Sovereign Beta Mode: Unlocked for full beta testing across all workbenches
    if (w.__CASEPATH_BETA_UNLOCKED !== false) {
      return true;
    }
    try {
      if (typeof w.casepathIsAuthenticatedSync === "function") {
        var sync = w.casepathIsAuthenticatedSync();
        if (sync === true) return true;
        if (sync === false) return false;
      }
    } catch (_e0) {}
    try {
      if (w.__CASEPATH_AUTH_STATE__ && w.__CASEPATH_AUTH_STATE__.hydrated) {
        return w.__CASEPATH_AUTH_STATE__.mode === "authenticated";
      }
    } catch (_e1) {}
    try {
      if (typeof w.casepathWorkspaceAuthed === "function" && w.casepathWorkspaceAuthed()) return true;
    } catch (_e2) {}
    try {
      if (w.__crAuthHydrated === true) {
        if (w.authState && w.authState.isAuthenticated && w.authState.session) return true;
        return false;
      }
    } catch (_e3) {}
    try {
      if (w.authState && w.authState.loading === false) {
        return !!(w.authState.isAuthenticated && w.authState.session);
      }
    } catch (_e4) {}
    return null;
  }

  function waitForStableAuthDecision(maxMs) {
    var waitMs = typeof maxMs === "number" && maxMs > 0 ? maxMs : DEFAULT_WAIT_MS;
    var initial = readAuthStateSync();
    if (initial !== null) {
      return Promise.resolve({
        authenticated: initial === true,
        resolved: true,
        source: "sync",
      });
    }

    var hydrateStep = Promise.resolve();
    try {
      if (typeof w.casepathWaitForAuthHydration === "function") {
        hydrateStep = Promise.race([
          Promise.resolve(w.casepathWaitForAuthHydration()),
          new Promise(function (resolve) {
            w.setTimeout(resolve, waitMs);
          }),
        ]);
      }
    } catch (_eHydrate) {}

    return hydrateStep.then(function () {
      var afterHydrate = readAuthStateSync();
      if (afterHydrate !== null) {
        return {
          authenticated: afterHydrate === true,
          resolved: true,
          source: "hydrate",
        };
      }
      return new Promise(function (resolve) {
        var settled = false;
        var startedAt = Date.now();

        function finish(result) {
          if (settled) return;
          settled = true;
          resolve(result);
        }

        function poll() {
          var sync = readAuthStateSync();
          if (sync !== null) {
            finish({
              authenticated: sync === true,
              resolved: true,
              source: "sync-poll",
            });
            return;
          }
          if (Date.now() - startedAt >= waitMs) {
            finish({
              authenticated: false,
              resolved: false,
              source: "timeout",
            });
            return;
          }
          w.setTimeout(poll, 120);
        }

        poll();
      });
    });
  }

  function resetRouteAccessCache() {
    gateState.gatePromise = null;
    gateState.accessGranted = false;
    gateState.accessGrantedRouteKey = null;
    resetPolicySnapshot();
  }

  function finalizeAuthenticatedAccess(classification, reason) {
    var routeKey = classification && classification.routeKey ? classification.routeKey : null;
    if (gateState.accessGranted && gateState.accessGrantedRouteKey === routeKey) {
      return;
    }
    gateState.accessGranted = true;
    gateState.accessGrantedRouteKey = routeKey;
    dismissGuestGateUi();
    setShellBlocked("clear", classification, reason || "authenticated");
    logAuthGateDebug("ALLOWED", { reason: reason || "authenticated", route: classification.routeKey });
    try {
      d.dispatchEvent(
        new CustomEvent("casepath:route-access-granted", {
          detail: { classification: classification, reason: reason || "authenticated" },
        })
      );
    } catch (_eGrant) {}
    if (w.CasePathShellLoader && typeof w.CasePathShellLoader.ensureWorkspaceBundles === "function") {
      w.CasePathShellLoader.ensureWorkspaceBundles();
    }
  }

  function grantAuthenticatedAccess(classification, reason, authMeta) {
    var entryGate = w.CasePathMfaEntryGate;
    if (
      entryGate &&
      typeof entryGate.waitForVaultMfaEntry === "function" &&
      typeof entryGate.isVaultEntryRoute === "function" &&
      entryGate.isVaultEntryRoute(classification)
    ) {
      return entryGate.waitForVaultMfaEntry(classification).then(function (entryResult) {
        if (!entryResult || entryResult.allowed !== true) {
          setShellBlocked("mfa-entry", classification, "mfa-entry-pending");
          return {
            allowed: false,
            mfaEntryPending: true,
            classification: classification,
            auth: authMeta || null,
          };
        }
        finalizeAuthenticatedAccess(classification, reason || "mfa-entry-granted");
        return {
          allowed: true,
          classification: classification,
          auth: authMeta || null,
          mfaEntry: entryResult,
        };
      });
    }
    finalizeAuthenticatedAccess(classification, reason || "authenticated");
    return Promise.resolve({
      allowed: true,
      classification: classification,
      auth: authMeta || null,
    });
  }

  function reconcileAuthenticatedAccess(reason) {
    var classification = gateState.classification || classifyCurrentRoute();
    if (!classification || !shouldRenderWorkspaceGate(classification)) return;
    var sync = readAuthStateSync();
    if (sync === true) {
      void grantAuthenticatedAccess(classification, reason || "reconcile-authenticated");
      return;
    }
    if (sync !== false) return;
    resetRouteAccessCache();
    setShellBlocked("guest", classification, reason || "reconcile-guest");
    logAuthGateDebug("BLOCKED", { reason: reason || "reconcile-guest", route: classification.routeKey });
    if (!gateState.gatePresented) {
      presentProtectedWorkspaceGate(classification, reason || "reconcile-guest");
    }
  }

  function wireAuthenticatedShellReconcile() {
    if (w.__casepathProtectedShellReconcileWired) return;
    w.__casepathProtectedShellReconcileWired = true;
    try {
      if (w.supabaseClient && w.supabaseClient.auth && typeof w.supabaseClient.auth.onAuthStateChange === "function") {
        w.supabaseClient.auth.onAuthStateChange(function (event, session) {
          if (session) {
            w.setTimeout(function () {
              reconcileAuthenticatedAccess("onAuthStateChange:" + String(event || ""));
            }, 0);
          }
        });
      }
    } catch (_eAuthWire) {}
    try {
      d.addEventListener("casepath:auth-hydrated", function () {
        reconcileAuthenticatedAccess("auth-hydrated-event");
      });
    } catch (_eDomWire) {}
  }

  function whenDomReady(fn) {
    if (d.readyState === "interactive" || d.readyState === "complete") {
      fn();
      return;
    }
    d.addEventListener("DOMContentLoaded", fn, { once: true });
  }

  function waitForAuthModalHostReady(timeoutMs) {
    var maxMs = typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : GATE_READY_TIMEOUT_MS;
    var startedAt = Date.now();
    return new Promise(function (resolve) {
      function done(status) {
        resolve({
          ready: status === "ready",
          status: status,
          elapsedMs: Date.now() - startedAt,
        });
      }
      function poll() {
        try {
          if (d.getElementById("auth-modal")) {
            done("ready");
            return;
          }
        } catch (_ePoll0) {}
        if (Date.now() - startedAt >= maxMs) {
          done("timeout");
          return;
        }
        w.setTimeout(poll, 80);
      }
      try {
        if (typeof w.casepathEnsureAuthModalReady === "function") {
          Promise.resolve(w.casepathEnsureAuthModalReady())
            .then(function () {
              if (d.getElementById("auth-modal")) done("ready");
            })
            .catch(function () {});
        } else if (typeof w.loadAuthRuntimeOnce === "function") {
          Promise.resolve(w.loadAuthRuntimeOnce())
            .then(function () {
              if (typeof w.casepathEnsureAuthModalReady === "function") {
                return Promise.resolve(w.casepathEnsureAuthModalReady()).catch(function () {});
              }
            })
            .then(function () {
              if (d.getElementById("auth-modal")) done("ready");
            })
            .catch(function () {});
        }
      } catch (_ePoll1) {}
      poll();
    });
  }

  function waitForGateReady(classification) {
    var startedAt = Date.now();
    markGateTimeline("gate_ready:start", {
      route: classification && classification.routeKey,
      state: classification && classification.state,
    });
    return new Promise(function (resolve) {
      whenDomReady(function () {
        markGateTimeline("gate_ready:shell_mounted", {
          route: classification && classification.routeKey,
        });
        waitForAuthModalHostReady(GATE_READY_TIMEOUT_MS).then(function (host) {
          markGateTimeline("gate_ready:modal_host", host);
          Promise.resolve(
            new Promise(function (authResolve) {
              var settled = false;
              function finish(source) {
                if (settled) return;
                settled = true;
                authResolve(source);
              }
              try {
                if (typeof w.casepathWaitForAuthHydration === "function") {
                  Promise.resolve(w.casepathWaitForAuthHydration())
                    .then(function () {
                      finish("hydrated");
                    })
                    .catch(function () {
                      finish("hydrate-error");
                    });
                }
              } catch (_eHydr) {}
              w.setTimeout(function () {
                finish("timeout");
              }, GATE_AUTH_RESTORE_TIMEOUT_MS);
            })
          ).then(function (authReadySource) {
            markGateTimeline("gate_ready:auth_settle", {
              source: authReadySource,
              elapsedMs: Date.now() - startedAt,
            });
            if (authReadySource === "timeout" && debugEnabled()) {
              try {
                console.warn("[AUTH GATE TIMING] auth restore timeout", {
                  route: classification && classification.routeKey,
                  timeoutMs: GATE_AUTH_RESTORE_TIMEOUT_MS,
                });
              } catch (_eWarn) {}
            }
            resolve({
              ready: true,
              authReadySource: authReadySource,
              hostReady: host.ready === true,
              elapsedMs: Date.now() - startedAt,
            });
          });
        });
      });
    });
  }

  function ensureDeterministicGuestOverlay(classification) {
    try {
      var authModal = d.getElementById("auth-modal");
      if (authModal && (authModal.classList.contains("show") || authModal.getAttribute("aria-hidden") === "false")) {
        return;
      }
      var soon = d.getElementById("casepath-coming-soon-modal");
      if (!soon) {
        soon = d.createElement("div");
        soon.id = "casepath-coming-soon-modal";
        soon.className = "modal-overlay";
        soon.setAttribute("aria-hidden", "true");
        soon.innerHTML =
          '<div class="modal" role="dialog" aria-modal="true">' +
          '<h2>Account required</h2>' +
          '<p class="modal-sub">This private workspace feature requires a free account.</p>' +
          '<button type="button" class="btn-full" data-auth-mode="signup">Create free account</button>' +
          "</div>";
        (d.body || d.documentElement).appendChild(soon);
      }
      soon.classList.add("show");
      soon.setAttribute("aria-hidden", "false");
      markGateTimeline("gate_present:deterministic_overlay", {
        route: classification && classification.routeKey,
      });
    } catch (_eOverlay) {}
  }

  function presentProtectedWorkspaceGate(classification, reason) {
    if (w.__CASEPATH_BETA_UNLOCKED !== false) {
      gateState.accessGranted = true;
      return;
    }
    if (gateState.gatePresented) return;
    gateState.gatePresented = true;
    try {
      if (d && d.documentElement) {
        d.documentElement.classList.remove("casepath-auth-bootstrapping");
        d.documentElement.removeAttribute("data-casepath-auth-bootstrap-pending");
      }
    } catch (_eBootUi) {}
    rememberGuestRouteIntent(classification);
    waitForGateReady(classification).then(function (gateReady) {
      markGateTimeline("gate_present:begin", {
        route: classification && classification.routeKey,
        reason: reason || null,
        gateReady: gateReady || null,
      });
      var attempts = 0;
      var gateContext = {
        title: "Account required",
        section: classification && classification.section ? classification.section : "protected",
        signInMessage: "Create a free account to continue.",
        signUpMessage: "Create a free account to continue.",
        explanation: "Create a free account to continue.",
      };
      try {
        if (w.CasePathRouteAccess && typeof w.CasePathRouteAccess.copyForSection === "function") {
          var copy = w.CasePathRouteAccess.copyForSection(gateContext.section) || null;
          if (copy) {
            gateContext.title = copy.title || gateContext.title;
            gateContext.signInMessage = copy.signInMessage || gateContext.signInMessage;
            gateContext.signUpMessage = copy.signUpMessage || gateContext.signUpMessage;
            gateContext.explanation = copy.explanation || gateContext.explanation;
          }
        }
      } catch (_eGateContext) {}
      function tryOpen() {
        attempts += 1;
        markGateTimeline("gate_present:attempt", {
          attempt: attempts,
          route: classification && classification.routeKey,
        });
        if (typeof w.openAuth === "function" && d.getElementById("auth-modal")) {
          debugLog("present_gate_modal", {
            route: classification.routeKey,
            feature: classification.featureKey,
            reason: reason || null,
          });
          try {
            w.__CASEPATH_AUTH_GATE_CONTEXT__ = gateContext;
          } catch (_eSetGate) {}
          w.openAuth("signup");
          markGateTimeline("gate_present:open_auth", {
            attempt: attempts,
            route: classification && classification.routeKey,
          });
          return;
        }
        if (typeof w.casepathShowAccountRequiredModal === "function") {
          debugLog("present_gate_modal", {
            route: classification.routeKey,
            feature: classification.featureKey,
            reason: reason || null,
          });
          w.casepathShowAccountRequiredModal(classification.featureKey || classification.section, {
            classification: classification,
            source: "protected-route-gate",
          });
          markGateTimeline("gate_present:show_account_modal", {
            attempt: attempts,
            route: classification && classification.routeKey,
          });
          if (attempts === 1 && typeof w.casepathShowComingSoonModal === "function") {
            try {
              w.casepathShowComingSoonModal(classification.featureKey || null);
              markGateTimeline("gate_present:fallback_preview_modal", {
                attempt: attempts,
                route: classification && classification.routeKey,
              });
            } catch (_eSoonFallback) {}
          }
          if (attempts === 1) {
            w.setTimeout(function () {
              ensureDeterministicGuestOverlay(classification);
            }, 220);
          }
          return;
        }
        if (typeof w.casepathGoAuth === "function") {
          debugLog("present_gate_modal", {
            route: classification.routeKey,
            feature: classification.featureKey,
            reason: reason || null,
          });
          w.casepathGoAuth("signup", {
            intent: "auth",
            gateContext: gateContext,
            source: "protected-route-gate",
          });
          markGateTimeline("gate_present:go_auth", {
            attempt: attempts,
            route: classification && classification.routeKey,
          });
          return;
        }
        if (attempts < 60) {
          if (attempts === 1) {
            ensureDeterministicGuestOverlay(classification);
          }
          w.setTimeout(tryOpen, 100);
          return;
        }
        debugLog("gate_modal_unavailable", {
          route: classification.routeKey,
          reason: reason || "host-timeout",
        });
      }
      tryOpen();
      w.setTimeout(function () {
        try {
          var authModal = d.getElementById("auth-modal");
          var authVisible = !!(
            authModal &&
            (authModal.classList.contains("show") || authModal.getAttribute("aria-hidden") === "false")
          );
          if (!authVisible && d && d.documentElement) {
            d.documentElement.classList.remove("casepath-auth-bootstrapping");
            d.documentElement.removeAttribute("data-casepath-auth-bootstrap-pending");
          }
        } catch (_eAuthWatchdog) {}
      }, 2400);
    });
  }

  function waitForCurrentRouteAccess(opts) {
    var options = opts || {};
    var classification = classifyCurrentRoute();
    var authWaitMs = authWaitMsForRoute(options, classification);
    markGateTimeline("route_classified", {
      route: classification && classification.routeKey,
      state: classification && classification.state,
      reason: classification && classification.reason,
    });
    gateState.classification = classification;
    applyRobotsPolicy(classification);

    if (!shouldRenderWorkspaceGate(classification)) {
      setShellBlocked("clear", classification, "not-blocked");
      return Promise.resolve({
        allowed: true,
        classification: classification,
        auth: { authenticated: true, resolved: true, source: "not-blocked" },
      });
    }

    if (gateState.gatePromise) return gateState.gatePromise;

    if (
      gateState.accessGranted &&
      gateState.accessGrantedRouteKey === classification.routeKey &&
      readAuthStateSync() === true
    ) {
      return Promise.resolve({
        allowed: true,
        classification: classification,
        auth: { authenticated: true, resolved: true, source: "access-granted-cache" },
      });
    }

    var sync = readAuthStateSync();
    if (sync === true) {
      gateState.gatePromise = grantAuthenticatedAccess(classification, "sync-authenticated", {
        authenticated: true,
        resolved: true,
        source: "sync-authenticated",
      });
      return gateState.gatePromise;
    }

    setShellBlocked("pending", classification, sync === false ? "sync-guest" : "awaiting-auth");
    gateState.gatePromise = waitForStableAuthDecision(authWaitMs).then(function (auth) {
      if (auth && auth.authenticated) {
        return grantAuthenticatedAccess(classification, auth.source || "authenticated", auth);
      }
      if (auth && auth.resolved === false) {
        setShellBlocked("pending", classification, auth.source || "timeout-pending");
        logAuthGateDebug("PENDING", {
          source: auth.source || "timeout-pending",
          route: classification.routeKey,
        });
        return {
          allowed: false,
          pending: true,
          classification: classification,
          auth: auth || { authenticated: false, resolved: false, source: "timeout-pending" },
        };
      }
      setShellBlocked("guest", classification, auth && auth.source ? auth.source : "guest");
      logAuthGateDebug("BLOCKED", {
        source: auth && auth.source ? auth.source : "guest",
        route: classification.routeKey,
        resolved: !!(auth && auth.resolved),
      });
      presentProtectedWorkspaceGate(classification, auth && auth.source ? auth.source : "guest");
      return {
        allowed: false,
        classification: classification,
        auth: auth || { authenticated: false, resolved: false, source: "guest" },
      };
    });
    return gateState.gatePromise;
  }

  function bootCurrentRoute() {
    var classification = classifyCurrentRoute();
    markGateTimeline("boot_classified", {
      route: classification && classification.routeKey,
      state: classification && classification.state,
      reason: classification && classification.reason,
    });
    gateState.classification = classification;
    applyRobotsPolicy(classification);
    debugLog("classify_current_route", classification);
    if (!shouldRenderWorkspaceGate(classification)) return;
    var sync = readAuthStateSync();
    if (sync === true) {
      void grantAuthenticatedAccess(classification, "boot-sync-authenticated");
      return;
    }
    setShellBlocked("pending", classification, "boot");
    var bootWaitMs = authWaitMsForRoute({}, classification);
    function startBootGateWait() {
      void waitForCurrentRouteAccess({ timeoutMs: bootWaitMs });
    }
    whenDomReady(startBootGateWait);
    w.setTimeout(function () {
      try {
        if (readAuthStateSync() === true) {
          reconcileAuthenticatedAccess("boot-late-reconcile");
          return;
        }
        var authModal = d.getElementById("auth-modal");
        var authVisible = !!(
          authModal &&
          (authModal.classList.contains("show") || authModal.getAttribute("aria-hidden") === "false")
        );
        if (
          gateState.classification &&
          gateState.classification.state === STATE.AUTH_REQUIRED &&
          gateState.shellState === "guest" &&
          !authVisible
        ) {
          gateState.gatePresented = false;
          presentProtectedWorkspaceGate(gateState.classification, "boot-fallback");
        }
      } catch (_eFallback) {}
    }, bootWaitMs + 900);
  }

  w.CasePathProtectedRoutes = {
    STATE: STATE,
    getPolicy: getPolicy,
    POLICY: getPolicy(),
    normalisePath: normalisePath,
    normaliseGotoToken: normaliseGotoToken,
    classifyPath: classifyPath,
    classifyGotoToken: classifyGotoToken,
    classifyCurrentRoute: classifyCurrentRoute,
    resolveClassification: resolveClassification,
    isExcludedRoute: isExcludedRoute,
    isPublicRoute: isPublicRoute,
    isProtectedRoute: isProtectedRoute,
    shouldRenderWorkspaceGate: shouldRenderWorkspaceGate,
    requiresAuth: requiresAuth,
    applyRobotsPolicy: applyRobotsPolicy,
    rememberGuestRouteIntent: rememberGuestRouteIntent,
    readAuthStateSync: readAuthStateSync,
    waitForStableAuthDecision: waitForStableAuthDecision,
    waitForCurrentRouteAccess: waitForCurrentRouteAccess,
    presentProtectedWorkspaceGate: presentProtectedWorkspaceGate,
    bootCurrentRoute: bootCurrentRoute,
    resetRouteAccessCache: resetRouteAccessCache,
    reconcileAuthenticatedAccess: reconcileAuthenticatedAccess,
    logAuthGateDebug: logAuthGateDebug,
    dismissGuestGateUi: dismissGuestGateUi,
  };

  wireAuthenticatedShellReconcile();
  whenDomReady(bootCurrentRoute);
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
