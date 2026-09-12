/**
 * Central platform role + capability gating (fail closed, no throws).
 * Authoritative: window.currentUser.role / beta_access from Supabase members (syncUser).
 *
 * Boot order (enforced via casepathAccessReady):
 *   auth session → members row → hydrate role/beta_access → casepathAccessReady → nav/gates/routes
 */
(function (w) {
  "use strict";
  if (!w || typeof w !== "object") return;
  if (!w.CasePathRouteAccess && typeof document !== "undefined" && typeof document.write === "function") {
    document.write('<script src="/assets/js/casepath-route-access.js?v=20260727iosscroll1"><\/script>');
  }

  var VALID_ROLES = ["public", "beta", "admin", "lawyer_beta", "tester"];

  /** Default registry — may be overridden by runtime/env providers before ready. */
  var DEFAULT_FEATURE_REGISTRY = {
    assistant: true,
    documents: true,
    vault: true,
    mediation: true,
    lawyerPortal: false,
    debugTools: false,
  };

  /**
   * Future: push server/env overrides via CasePathAccess.registerFeatureConfigSource(fn).
   * @type {Array<function(): Record<string, boolean>|null|undefined>>}
   */
  var featureConfigSources = [];

  var SPA_PAGE_FEATURE = {
    "ai-assistant": "assistant",
    "doc-helper": "documents",
    vault: "vault",
    case: "vault",
    calendar: "vault",
    mediation: "mediation",
    "lawyer-portal": "lawyerPortal",
  };

  var STATIC_COMING_SOON_PAGES = ["referrals"];

  /**
   * Account gate: Learn + Prepare information surfaces remain public. Live app
   * workflows require a Supabase account, and beta/testing lanes are closed.
   */
  var SOFT_LAUNCH_PUBLIC_FEATURES = {
    assistant: false,
    documents: false,
    vault: false,
    mediation: false,
  };

  var SOFT_LAUNCH_PUBLIC_PAGE_IDS = {
    mission: true,
    glossary: true,
    qa: true,
    "mental-health": true,
    kids: true,
    avo: true,
    "self-represented-guide": true,
    "court-day-preparation": true,
    "support-tools": true,
    pricing: true,
    "your-team": true,
    referrals: true,
    contact: true,
  };

  function isSoftLaunchOpenAccess() {
    try {
      if (w.__CASEPATH_SOFT_LAUNCH_OPEN__ === false) return false;
    } catch (eSl0) {}
    return true;
  }

  function isSoftLaunchPublicFeature(featureKey) {
    if (!isSoftLaunchOpenAccess()) return false;
    var k = normalizeFeatureKey(featureKey);
    return !!(k && SOFT_LAUNCH_PUBLIC_FEATURES[k]);
  }

  function isSoftLaunchPublicPage(pageId) {
    if (!isSoftLaunchOpenAccess()) return false;
    var id = String(pageId || "").trim();
    return SOFT_LAUNCH_PUBLIC_PAGE_IDS[id] === true;
  }

  function isPublicNavSurface(value) {
    try {
      if (w.CasePathRouteAccess && typeof w.CasePathRouteAccess.isPublicRoute === "function") {
        return w.CasePathRouteAccess.isPublicRoute({ pageId: value, path: value });
      }
    } catch (ePubRoute) {}
    try {
      if (typeof w.casepathPublicNavSurface === "function" && w.casepathPublicNavSurface(value)) return true;
    } catch (ePub0) {}
    return isSoftLaunchPublicPage(value);
  }

  var FEATURE_LABELS = {
    assistant: "Ask a Question",
    documents: "Document Centre",
    vault: "Your Case",
    mediation: "Mediation tools",
    lawyerPortal: "Lawyer Portal",
    debugTools: "Debug tools",
  };

  try {
    w.casepathAccessReady = false;
  } catch (eBoot0) {}

  function publishFeatureRegistrySnapshot() {
    var merged = Object.assign({}, DEFAULT_FEATURE_REGISTRY);
    for (var i = 0; i < featureConfigSources.length; i++) {
      try {
        var src = featureConfigSources[i];
        if (typeof src !== "function") continue;
        var partial = src();
        if (!partial || typeof partial !== "object") continue;
        var k;
        for (k in partial) {
          if (Object.prototype.hasOwnProperty.call(partial, k) && typeof partial[k] === "boolean") {
            merged[k] = partial[k];
          }
        }
      } catch (eSrc) {}
    }
    try {
      w.CASEPATH_FEATURES = Object.freeze(merged);
    } catch (eFreeze) {
      w.CASEPATH_FEATURES = merged;
    }
    return merged;
  }

  publishFeatureRegistrySnapshot();

  function registerFeatureConfigSource(fn) {
    if (typeof fn !== "function") return;
    featureConfigSources.push(fn);
    publishFeatureRegistrySnapshot();
  }

  /** Optional env flag: window.__CASEPATH_FEATURE_OVERRIDES__ = { mediation: false } */
  registerFeatureConfigSource(function () {
    try {
      var o = w.__CASEPATH_FEATURE_OVERRIDES__;
      return o && typeof o === "object" ? o : null;
    } catch (eOv) {
      return null;
    }
  });

  function normalizeUserRole(role) {
    try {
      var r = String(role == null ? "public" : role)
        .trim()
        .toLowerCase();
      if (VALID_ROLES.indexOf(r) !== -1) return r;
    } catch (e0) {}
    return "public";
  }

  function readSupabaseUser() {
    try {
      var u = w.currentUser;
      if (u && u.source === "supabase" && u.loggedIn === true && u.id) return u;
    } catch (e1) {}
    return null;
  }

  function accessSnapshot() {
    var u = readSupabaseUser();
    var role = "public";
    var betaAccess = false;
    if (u) {
      role = normalizeUserRole(u.role);
      try {
        betaAccess = u.beta_access === true || u.betaAccess === true;
      } catch (eBa) {}
    }
    return {
      role: role,
      betaAccess: betaAccess,
      authenticated: !!u,
    };
  }

  function isAccessReady() {
    try {
      return w.casepathAccessReady === true;
    } catch (eR) {
      return false;
    }
  }

  function setNavAccessPending(pending) {
    try {
      var grid = document.getElementById("nav-main-grid");
      if (grid) {
        if (pending) grid.setAttribute("data-casepath-access-pending", "true");
        else grid.removeAttribute("data-casepath-access-pending");
      }
    } catch (eNav) {}
    try {
      if (document.documentElement) {
        if (pending) document.documentElement.setAttribute("data-casepath-access-pending", "true");
        else document.documentElement.removeAttribute("data-casepath-access-pending");
      }
    } catch (eHtml) {}
  }

  function flushAccessReadyQueue() {
    var q = w.__casepathAccessReadyQueue;
    w.__casepathAccessReadyQueue = [];
    if (!q || !q.length) return;
    for (var i = 0; i < q.length; i++) {
      try {
        if (typeof q[i] === "function") q[i]();
      } catch (eQ) {}
    }
  }

  function markAccessHydrating() {
    try {
      w.casepathAccessReady = false;
    } catch (eH0) {}
    setNavAccessPending(true);
    publishFeatureRegistrySnapshot();
  }

  function markAccessReady() {
    publishFeatureRegistrySnapshot();
    try {
      w.casepathAccessReady = true;
    } catch (eH1) {}
    setNavAccessPending(false);
    try {
      if (w.CasePathEvents && typeof w.CasePathEvents.dispatch === "function") {
        var snap = accessSnapshot();
        w.CasePathEvents.dispatch("access-ready", {
          role: snap.role,
          beta_access: snap.betaAccess,
        });
      }
    } catch (eEv) {}
    try {
      document.dispatchEvent(
        new CustomEvent("casepath:access-ready", {
          detail: accessSnapshot(),
        })
      );
    } catch (eEv2) {}
    flushAccessReadyQueue();
    try {
      if (typeof w.updateGates === "function") w.updateGates();
    } catch (eG) {}
    try {
      if (typeof w.casepathApplyStaticNavRolloutBadges === "function") {
        w.casepathApplyStaticNavRolloutBadges();
      }
    } catch (eSn) {}
  }

  function markAccessReadyAnonymous() {
    try {
      w.currentUser = null;
    } catch (eAn0) {}
    markAccessReady();
  }

  function casepathWhenAccessReady(fn) {
    if (typeof fn !== "function") return;
    if (isAccessReady()) {
      try {
        fn();
      } catch (eWr) {}
      return;
    }
    w.__casepathAccessReadyQueue = w.__casepathAccessReadyQueue || [];
    w.__casepathAccessReadyQueue.push(fn);
  }

  function accessTelemetry(kind, detail) {
    try {
      var snap = accessSnapshot();
      var payload = Object.assign(
        {
          kind: kind,
          t: Date.now(),
          role: snap.role,
          beta_access: snap.betaAccess,
          access_ready: isAccessReady(),
        },
        detail || {}
      );
      if (typeof w.__CASEPATH_RUNTIME_TELEMETRY__ === "function") {
        try {
          w.__CASEPATH_RUNTIME_TELEMETRY__(payload);
        } catch (eT0) {}
      }
      if (w.CasePathRuntimePolicy && typeof w.CasePathRuntimePolicy.telemetry === "function") {
        try {
          w.CasePathRuntimePolicy.telemetry(kind, payload);
        } catch (eT1) {}
      }
      if (w.CasePathEvents && typeof w.CasePathEvents.dispatch === "function") {
        try {
          w.CasePathEvents.dispatch("access-telemetry", payload);
        } catch (eT2) {}
      }
    } catch (eTel) {}
  }

  function isAdmin() {
    if (!isAccessReady()) return false;
    try {
      return accessSnapshot().role === "admin";
    } catch (e3) {
      return false;
    }
  }

  function hasRole(role) {
    if (!isAccessReady()) return false;
    try {
      return accessSnapshot().role === normalizeUserRole(role);
    } catch (e4) {
      return false;
    }
  }

  function hasBetaAccess() {
    return false;
  }

  function isBetaUser() {
    return hasBetaAccess();
  }

  function normalizeFeatureKey(feature) {
    var key = String(feature || "").trim();
    if (!key) return "";
    if (key === "ai_assistant" || key === "ai-assistant" || key === "assistant") return "assistant";
    if (key === "document_builder" || key === "doc-helper" || key === "documents") return "documents";
    if (key === "lawyer_portal" || key === "lawyer-portal" || key === "lawyerPortal") return "lawyerPortal";
    if (key === "debug" || key === "debugTools") return "debugTools";
    return key;
  }

  function registryEnabled(featureKey) {
    try {
      var reg = w.CASEPATH_FEATURES || DEFAULT_FEATURE_REGISTRY;
      return reg[featureKey] === true;
    } catch (e6) {
      return false;
    }
  }

  function canAccessFeature(feature) {
    try {
      var featureKey = normalizeFeatureKey(feature);
      if (!featureKey) return false;
      if (isSoftLaunchPublicFeature(featureKey)) return true;
      if (!isAccessReady()) return false;
      if (isAdmin()) return true;
      if (!registryEnabled(featureKey)) return false;

      if (featureKey === "debugTools") {
        if (!w.DEV_MODE) return false;
        return hasRole("tester") || hasRole("admin");
      }

      if (featureKey === "lawyerPortal") {
        return hasRole("lawyer_beta");
      }

      return accessSnapshot().authenticated === true;
    } catch (e7) {
      if (isSoftLaunchOpenAccess() && isSoftLaunchPublicFeature(normalizeFeatureKey(feature))) return true;
      return false;
    }
  }

  function resolveLiveFeatureUrl(featureOrPage) {
    var raw = String(featureOrPage || "").trim();
    if (!raw) return null;
    var key = normalizeFeatureKey(raw);
    try {
      if (w.CasePathRoutes && typeof w.CasePathRoutes.url === "function") {
        if (key === "assistant" || raw === "ai-assistant" || raw === "qa") {
          if (typeof w.CasePathRoutes.askQuestionHref === "function") {
            return w.CasePathRoutes.askQuestionHref();
          }
          return w.CasePathRoutes.url("askQuestion") || w.CasePathRoutes.url("qa");
        }
        if (key === "documents" || raw === "doc-helper") {
          return w.CasePathRoutes.url("documentCentre") || w.CasePathRoutes.url("doc-helper");
        }
        if (key === "vault" || raw === "case") {
          return w.CasePathRoutes.url("appWorkspace") || w.CasePathRoutes.url("vault");
        }
        if (key === "calendar" || raw === "calendar") {
          return w.CasePathRoutes.url("appCalendar") || w.CasePathRoutes.url("calendar");
        }
        if (raw === "parenting-orders") {
          return w.CasePathRoutes.url("parenting-orders");
        }
      }
    } catch (eUrl0) {}
    if (key === "assistant" || raw === "ai-assistant" || raw === "qa") return "/index.html?goto=qa";
    if (key === "documents" || raw === "doc-helper") return "/document-centre.html";
    if (key === "vault" || raw === "case") return "/app/workspace/index.html";
    if (key === "calendar" || raw === "calendar") return "/app/calendar/index.html";
    if (key === "mediation" || raw === "mediation") return mediationCanonicalUrl();
    if (raw === "parenting-orders") return "/parenting-orders.html";
    return null;
  }

  function casepathNavigateLiveFeature(featureOrPage) {
    if (!isSoftLaunchOpenAccess()) return false;
    var url = resolveLiveFeatureUrl(featureOrPage);
    if (!url) return false;
    return safeAssignHref(url);
  }

  function trackFeatureDenied(feature, context) {
    var featureKey = normalizeFeatureKey(feature);
    accessTelemetry("feature_access_denied", {
      feature: featureKey,
      context: String(context || ""),
    });
  }

  function trackFeatureAttempt(feature, context) {
    var featureKey = normalizeFeatureKey(feature);
    accessTelemetry("feature_access_attempt", {
      feature: featureKey,
      allowed: canAccessFeature(featureKey),
      context: String(context || ""),
    });
  }

  function safeAssignHref(path) {
    var p = String(path || "").trim();
    if (!p) return false;
    try {
      if (
        w.CasePathAuth &&
        w.CasePathAuth.redirect &&
        typeof w.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        return w.CasePathAuth.redirect.safeAssignHref(p);
      }
    } catch (e8) {}
    try {
      w.location.href = p;
      return true;
    } catch (e9) {}
    return false;
  }

  function mediationCanonicalUrl(queryString) {
    var base = "/app/mediation/index.html";
    try {
      if (w.CasePathRoutes && typeof w.CasePathRoutes.url === "function") {
        var fromRoutes = w.CasePathRoutes.url("appMediation");
        if (fromRoutes) base = fromRoutes;
      } else if (w.CasePathRoutes && w.CasePathRoutes.R && w.CasePathRoutes.R.appMediation) {
        base = w.CasePathRoutes.R.appMediation;
      }
    } catch (e10) {}
    var qs = String(queryString || "").replace(/^\?/, "").trim();
    if (!qs) return base;
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + qs;
  }

  /** @deprecated use mediationCanonicalUrl */
  function mediationComingSoonUrl() {
    return mediationCanonicalUrl();
  }

  function mediationBetaUrl() {
    return mediationCanonicalUrl();
  }

  function mediationStagingUrl() {
    return mediationCanonicalUrl();
  }

  function resolveMediationExperienceUrl() {
    if (!isAccessReady()) return null;
    trackFeatureAttempt("mediation", "resolve_mediation_url");
    if (!canAccessFeature("mediation")) return mediationCanonicalUrl();
    return mediationCanonicalUrl();
  }

  function runOpenMediation() {
    try {
      trackFeatureAttempt("mediation", "nav_open");
      var url = resolveMediationExperienceUrl();
      if (!url) return false;
      return safeAssignHref(url);
    } catch (e14) {
      return false;
    }
  }

  function openMediationExperience() {
    if (!isAccessReady()) {
      casepathWhenAccessReady(runOpenMediation);
      return false;
    }
    return runOpenMediation();
  }

  function casepathRenderComingSoon(feature) {
    var key = normalizeFeatureKey(feature);
    var raw = String(feature || "").trim();
    var spaPageId = raw === "document-centre" ? "doc-helper" : raw;
    var routeClassification = null;
    try {
      if (w.CasePathRouteAccess) {
        routeClassification =
          w.CasePathRouteAccess.classifyPageId(spaPageId) ||
          w.CasePathRouteAccess.classifyPageId(raw) ||
          w.CasePathRouteAccess.routeForFeature(key || raw);
      }
    } catch (eRouteClass) {}
    if (spaPageId && document.getElementById("page-" + spaPageId) && typeof w.showPage === "function") {
      try {
        if (typeof w.casepathRouteLog === "function") {
          w.casepathRouteLog("coming_soon_in_spa", { pageId: spaPageId });
        }
      } catch (eSpa) {}
      w.showPage(spaPageId, false);
      return;
    }
    if (
      routeClassification &&
      routeClassification.state === "AUTH_REQUIRED" &&
      typeof w.casepathShowAccountRequiredModal === "function"
    ) {
      w.casepathShowAccountRequiredModal(routeClassification.featureKey || key || raw, {
        classification: routeClassification,
        pageId: spaPageId || raw,
        source: "casepath-access",
      });
      return;
    }
    if (isPublicNavSurface(raw) || isSoftLaunchPublicFeature(key)) {
      if (casepathNavigateLiveFeature(raw || key)) return;
    }
    if (!isAccessReady()) {
      if (isSoftLaunchOpenAccess() && (isSoftLaunchPublicPage(raw) || isSoftLaunchPublicFeature(key))) {
        casepathNavigateLiveFeature(raw || key);
        return;
      }
      casepathWhenAccessReady(function () {
        casepathRenderComingSoon(key || raw);
      });
      return;
    }
    if (key && canAccessFeature(key)) return;
    if (key) {
      void (async function () {
        if (typeof w.casepathWaitForAuthHydration === "function") {
          await w.casepathWaitForAuthHydration();
        }
        if (canAccessFeature(key)) return;
        if (typeof w.casepathIsAuthenticated === "function" && (await w.casepathIsAuthenticated())) return;
        if (typeof w.casepathLogAuthGateCheck === "function") {
          w.casepathLogAuthGateCheck("renderComingSoon:" + key, false);
        }
        try {
          var returnUrl = w.location
            ? String(w.location.pathname || "/") + String(w.location.search || "") + String(w.location.hash || "")
            : "";
          if (returnUrl) {
            sessionStorage.setItem("cr_after_auth_url", returnUrl);
          }
          if (key) {
            sessionStorage.setItem("cr_pending_spa_route", key);
          }
        } catch (eAuthStore) {}
        if (typeof w.casepathShowAccountRequiredModal === "function") {
          w.casepathShowAccountRequiredModal((routeClassification && routeClassification.featureKey) || key, {
            classification: routeClassification,
            pageId: spaPageId || raw,
            source: "casepath-access",
          });
          return;
        }
        if (typeof w.casepathGoAuth === "function") {
          w.casepathGoAuth("signup", { intent: "auth", source: "casepath-access" });
          return;
        }
        if (typeof w.openAuth === "function") {
          w.openAuth("signup");
        }
      })();
      return;
    }
    if (key === "mediation" || raw === "mediation") {
      safeAssignHref(mediationCanonicalUrl());
      return;
    }
    if (raw === "parenting-orders") {
      safeAssignHref("/parenting-orders.html");
      return;
    }
    if (casepathNavigateLiveFeature(raw || key)) return;
    if (key) trackFeatureDenied(key, "render_coming_soon");
    try {
      if (typeof w.casepathShowComingSoonModal === "function") {
        w.casepathShowComingSoonModal(key || null);
        return;
      }
    } catch (e15) {}
  }

  function casepathGateFeatureOrComingSoon(feature) {
    var key = normalizeFeatureKey(feature);
    if (isSoftLaunchPublicFeature(key)) return true;
    if (!isAccessReady()) {
      if (isSoftLaunchOpenAccess() && isSoftLaunchPublicFeature(key)) return true;
      return false;
    }
    if (canAccessFeature(feature)) return true;
    if (key === "mediation") {
      safeAssignHref(mediationCanonicalUrl());
      return false;
    }
    casepathRenderComingSoon(feature);
    return false;
  }

  function casepathIsFeatureGatedPage(pageId) {
    try {
      var id = String(pageId || "").trim();
      if (!id) return false;
      if (id === "doc-helper" || id === "document-centre" || id === "documents") {
        if (typeof w.casepathIsAuthenticatedSync === "function" && w.casepathIsAuthenticatedSync() === true) {
          return false;
        }
        if (typeof w.casepathWorkspaceAuthed === "function" && w.casepathWorkspaceAuthed()) {
          return false;
        }
      }
      if (w.CasePathRouteAccess && typeof w.CasePathRouteAccess.requiresAuth === "function") {
        return w.CasePathRouteAccess.requiresAuth({ pageId: id });
      }
      if (isPublicNavSurface(id)) return false;
      if (!isAccessReady()) return false;
      if (STATIC_COMING_SOON_PAGES.indexOf(id) !== -1) return true;
      var feature = SPA_PAGE_FEATURE[id];
      if (!feature) return false;
      return !canAccessFeature(feature);
    } catch (e16) {
      if (isSoftLaunchOpenAccess() && isSoftLaunchPublicPage(pageId)) return false;
      return false;
    }
  }

  function casepathIsComingSoonPage(pageId) {
    return casepathIsFeatureGatedPage(pageId);
  }

  function cpGrantBetaAccess(email) {
    try {
      console.warn(
        "[CasePath] cpGrantBetaAccess is a scaffold only — set members.beta_access via Supabase admin/service role.",
        { email: String(email || "") }
      );
    } catch (e17) {}
    return Promise.resolve({ ok: false, scaffold: true, action: "grant_beta_access" });
  }

  function cpSetRole(email, role) {
    try {
      console.warn(
        "[CasePath] cpSetRole is a scaffold only — update members.role via Supabase admin/service role.",
        { email: String(email || ""), role: normalizeUserRole(role) }
      );
    } catch (e18) {}
    return Promise.resolve({ ok: false, scaffold: true, action: "set_role", role: normalizeUserRole(role) });
  }

  w.normalizeUserRole = normalizeUserRole;
  w.normalizeFeatureKey = normalizeFeatureKey;
  w.isAdmin = isAdmin;
  w.isBetaUser = isBetaUser;
  w.hasBetaAccess = hasBetaAccess;
  w.hasRole = hasRole;
  w.canAccessFeature = canAccessFeature;
  w.isSoftLaunchOpenAccess = isSoftLaunchOpenAccess;
  w.isSoftLaunchPublicFeature = isSoftLaunchPublicFeature;
  w.isSoftLaunchPublicPage = isSoftLaunchPublicPage;
  w.casepathIsPublicNavSurface = isPublicNavSurface;
  w.casepathNavigateLiveFeature = casepathNavigateLiveFeature;
  w.resolveLiveFeatureUrl = resolveLiveFeatureUrl;
  w.isAccessReady = isAccessReady;
  w.casepathWhenAccessReady = casepathWhenAccessReady;
  w.openMediationExperience = openMediationExperience;
  w.resolveMediationExperienceUrl = resolveMediationExperienceUrl;
  w.casepathRenderComingSoon = casepathRenderComingSoon;
  w.casepathGateFeatureOrComingSoon = casepathGateFeatureOrComingSoon;
  w.casepathIsFeatureGatedPage = casepathIsFeatureGatedPage;
  w.casepathIsComingSoonPage = casepathIsComingSoonPage;
  w.cpGrantBetaAccess = cpGrantBetaAccess;
  w.cpSetRole = cpSetRole;
  w.casepathAccessTelemetry = accessTelemetry;
  w.FEATURE_LABELS = FEATURE_LABELS;

  w.CasePathAccess = {
    VALID_ROLES: VALID_ROLES.slice(),
    DEFAULT_FEATURE_REGISTRY: DEFAULT_FEATURE_REGISTRY,
    FEATURE_LABELS: FEATURE_LABELS,
    normalizeUserRole: normalizeUserRole,
    normalizeFeatureKey: normalizeFeatureKey,
    isAdmin: isAdmin,
    isBetaUser: isBetaUser,
    hasBetaAccess: hasBetaAccess,
    hasRole: hasRole,
    canAccessFeature: canAccessFeature,
    isSoftLaunchOpenAccess: isSoftLaunchOpenAccess,
    isSoftLaunchPublicFeature: isSoftLaunchPublicFeature,
    isSoftLaunchPublicPage: isSoftLaunchPublicPage,
    casepathIsPublicNavSurface: isPublicNavSurface,
    casepathNavigateLiveFeature: casepathNavigateLiveFeature,
    resolveLiveFeatureUrl: resolveLiveFeatureUrl,
    isAccessReady: isAccessReady,
    markAccessHydrating: markAccessHydrating,
    markAccessReady: markAccessReady,
    markAccessReadyAnonymous: markAccessReadyAnonymous,
    casepathWhenAccessReady: casepathWhenAccessReady,
    registerFeatureConfigSource: registerFeatureConfigSource,
    publishFeatureRegistry: publishFeatureRegistrySnapshot,
    openMediationExperience: openMediationExperience,
    resolveMediationExperienceUrl: resolveMediationExperienceUrl,
    casepathRenderComingSoon: casepathRenderComingSoon,
    casepathGateFeatureOrComingSoon: casepathGateFeatureOrComingSoon,
    casepathIsFeatureGatedPage: casepathIsFeatureGatedPage,
    casepathIsComingSoonPage: casepathIsComingSoonPage,
    trackFeatureDenied: trackFeatureDenied,
    trackFeatureAttempt: trackFeatureAttempt,
    accessTelemetry: accessTelemetry,
  };

  setNavAccessPending(true);
})(typeof window !== "undefined" ? window : this);
