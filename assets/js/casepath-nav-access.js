/**
 * Shared navigation UX: account-required shell modal, coming-soon modal,
 * and protected nav preflight (capture phase). Does not replace Supabase auth.
 */
(function (w) {
  if (!w.CasePathRuntime && typeof document !== "undefined" && typeof document.write === "function") {
    var rv = "20260607mobile1";
    try {
      rv = w.__CASEPATH_ASSET_VERSION__ || rv;
    } catch (eRv) {}
    document.write('<script src="/assets/js/core/casepath-runtime.js?v=' + rv + '"><\/script>');
  }
})(window);

(function () {
  if (window.__CASEPATH_NAV_ACCESS_INIT__) {
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname || "")) {
      console.warn("[NAV] Duplicate casepath-nav-access.js load skipped");
    }
    return;
  }
  window.__CASEPATH_NAV_ACCESS_INIT__ = true;

  function injectAuthScript(src) {
    var needle = src.split("?")[0];
    if (document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]')) return;
    if (document.readyState === "loading") {
      document.write('<script src="' + src + '"><\/script>');
      return;
    }
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
  }

  if (!window.__CASEPATH_NAV_AUTH_STATE_INIT__) {
    injectAuthScript("/assets/js/core/casepath-nav-auth-state.js?v=20260727iosscroll1");
  }
  if (!window.__CASEPATH_PAGE_AUTH_CTA_INIT__) {
    injectAuthScript("/assets/js/core/casepath-page-auth-cta.js?v=20260727iosscroll1");
  }

  var cpAuthBootstrapV =
    (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";
  if (!window.__CASEPATH_AUTH_BOOTSTRAP_INIT__) {
    injectAuthScript("/assets/js/core/casepath-auth-bootstrap.js?v=" + cpAuthBootstrapV);
  }
  if (!window.__CASEPATH_AUTH_RUNTIME_INIT__) {
    injectAuthScript("/assets/js/core/casepath-auth-runtime.js?v=" + cpAuthBootstrapV);
  }
  if (!window.__CASEPATH_AUTH_MODAL_CONTROLLER_INIT__) {
    injectAuthScript("/assets/js/core/casepath-auth-modal.js?v=" + cpAuthBootstrapV);
  }
  if (!window.__CASEPATH_AUTH_ENTRY_INIT__) {
    injectAuthScript("/assets/js/core/casepath-auth-entry.js?v=" + cpAuthBootstrapV);
  }
  if (!window.CasePathRouteAccess) {
    injectAuthScript("/assets/js/casepath-route-access.js?v=20260727iosscroll1");
  }

  var NAV_GRID_SELECTOR = "#nav-main-grid";
  var PUBLIC_NAV_SURFACES = [
    { id: "nav-mission", path: "/mission.html", page: "mission" },
    { id: "nav-glossary", path: "/glossary.html", page: "glossary" },
    { id: "nav-mental-health", path: "/mental-health.html", page: "mental-health" },
    { id: "nav-kids", path: "/kids.html", page: "kids" },
    { id: "nav-prepare-hub", path: "/prepare.html", page: "prepare" },
    { id: "nav-court-documents", path: "/court-documents.html", page: "court-documents" },
    { id: "nav-more-tools", path: "/more-tools.html", page: "more-tools" },
    { id: "nav-trusted-partners", path: "/trusted-partners.html", page: "trusted-partners" },
    { id: "nav-court-day", path: "/court-day-preparation.html", page: "court-day" },
    { id: "nav-checklists", path: "/checklists.html", page: "checklists" },
    { id: "nav-self-represented-guide", path: "/self-represented-guide.html", page: "self-represented-guide" },
    { id: "nav-avo", path: "/protection-orders.html", page: "avo" },
    { id: "nav-new-item", path: "/support-tools.html", page: "support-tools" }
  ];
  var PUBLIC_NAV_IDS = {};
  var PUBLIC_NAV_PATHS = {};
  var PUBLIC_NAV_PAGES = {};
  for (var pi = 0; pi < PUBLIC_NAV_SURFACES.length; pi++) {
    PUBLIC_NAV_IDS[PUBLIC_NAV_SURFACES[pi].id] = true;
    PUBLIC_NAV_PAGES[PUBLIC_NAV_SURFACES[pi].page] = true;
    PUBLIC_NAV_PATHS[String(PUBLIC_NAV_SURFACES[pi].path || "").toLowerCase().replace(/\/+$/, "") || "/"] = true;
  }

  function navDevEnabled() {
    try {
      if (window.__CASEPATH_NAV_DEBUG__ === true) return true;
      if (window.__CASEPATH_NAV_DEBUG__ === false) return false;
    } catch (eDbg0) {}
    try {
      return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname || "");
    } catch (eDbg1) {
      return false;
    }
  }
  function navDevWarn(code, detail) {
    if (!navDevEnabled()) return;
    try {
      console.warn("[NAV]", code, detail || "");
    } catch (eWarn) {}
  }
  function stopProtectedNavEvent(ev) {
    if (!ev) return;
    if (typeof ev.preventDefault === "function") ev.preventDefault();
    if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
    else if (typeof ev.stopPropagation === "function") ev.stopPropagation();
  }
  function runNavDevAudit() {
    if (!navDevEnabled()) return;
    var grids = document.querySelectorAll(NAV_GRID_SELECTOR);
    if (grids.length > 1) navDevWarn("duplicate_nav_container", { count: grids.length });
    var headers = document.querySelectorAll("header.header");
    if (headers.length > 1) navDevWarn("duplicate_header", { count: headers.length });
    var drawers = document.querySelectorAll("#nav-mobile-menu");
    if (drawers.length > 0) navDevWarn("legacy_mobile_drawer_present", { count: drawers.length });
    var protectedCount = document.querySelectorAll(NAV_GRID_SELECTOR + " a[data-protected-nav]").length;
    if (grids.length === 1 && protectedCount === 0) {
      navDevWarn("missing_protected_nav_markers", { grid: NAV_GRID_SELECTOR });
    }
    var header = document.querySelector("header.header");
    if (header) {
      window.__CASEPATH_NAV_HEADER_BASELINE_H__ = header.offsetHeight;
    }
  }
  function casepathSafeAssignHref(path) {
    if (
      window.CasePathAuth &&
      window.CasePathAuth.redirect &&
      typeof window.CasePathAuth.redirect.safeAssignHref === "function"
    ) {
      return window.CasePathAuth.redirect.safeAssignHref(path);
    }
    var p = String(path || "").trim();
    if (!p || p.charAt(0) !== "/") return false;
    if (/^https?:/i.test(p) || /^\/\//.test(p)) return false;
    if (/[\u0000-\u001f\\]/.test(p) || p.indexOf("@") !== -1) return false;
    var q = p.indexOf("?");
    var pathOnly = q === -1 ? p : p.slice(0, q);
    if (pathOnly.indexOf("//") !== -1) return false;
    var segs = pathOnly.split("/");
    for (var si = 0; si < segs.length; si++) {
      if (segs[si] === "..") return false;
    }
    var low = p.toLowerCase();
    if (low.indexOf("javascript:") === 0 || low.indexOf("data:") === 0 || low.indexOf("vbscript:") === 0) {
      return false;
    }
    window.location.href = p;
    return true;
  }
  /** Feature-gated nav items (capability routing via casepath-access.js). */
  var FEATURE_NAV = {
    "nav-checklists": "checklists",
    "nav-mediation": "mediation",
    "nav-doc-prepare": "documents",
    "nav-parenting-orders": "parenting-orders",
    "nav-your-case-pulse": "vault",
    "nav-calendar": "calendar",
    "nav-doc-helper": "documents",
    "nav-lawyer-portal": "lawyerPortal",
  };
  var COMING_NAV_IDS = [];
  var ACCOUNT_NAV_IDS = [];
  function routeAccess() {
    return window.CasePathRouteAccess || null;
  }
  function requiresAuthClassification(classification) {
    return !!(classification && classification.state === "AUTH_REQUIRED");
  }
  function classifyNavHref(href) {
    var access = routeAccess();
    if (!access || typeof access.classifyHref !== "function") return null;
    return access.classifyHref(href);
  }
  function classifyNavAnchor(anchor) {
    if (!anchor) return null;
    var access = routeAccess();
    var id = anchor.id || "";
    if (access && id && typeof access.classifyNavId === "function") {
      var navRule = access.classifyNavId(id);
      if (navRule) return navRule;
    }
    var href = anchor.getAttribute("data-return-url") || anchor.getAttribute("href") || "";
    if (href) return classifyNavHref(href);
    return null;
  }
  function gateContextForClassification(classification) {
    var rule = classification || { section: "protected" };
    return {
      title: rule.title || "Account required",
      section: rule.section || "protected",
      signInMessage: rule.signInMessage || "Create a free account to continue.",
      signUpMessage: rule.signUpMessage || "Create a free account to continue.",
      explanation: rule.explanation || rule.signUpMessage || rule.signInMessage || "",
    };
  }
  function applyProtectedLinkState(el, classification, signedIn) {
    if (!el) return;
    clearNavRolloutAttrs(el);
    if (!requiresAuthClassification(classification)) return;
    el.setAttribute("data-protected-nav", "true");
    if (classification.featureKey) {
      el.setAttribute("data-gate-feature", classification.featureKey);
    }
    if (classification.section) {
      el.setAttribute("data-casepath-access-section", classification.section);
    }
    if (!signedIn) {
      el.setAttribute("data-cr-nav-badge", "account");
      el.setAttribute("data-cr-locked", "true");
      el.setAttribute("title", classification.tooltip || "Account required");
    }
  }
  function navAuthed() {
    if (typeof window.casepathIsAuthenticatedSync === "function") {
      var sync = window.casepathIsAuthenticatedSync();
      if (sync === true) return true;
      if (sync === false) return false;
    }
    if (typeof window.casepathWorkspaceAuthed === "function") return window.casepathWorkspaceAuthed();
    if (typeof window.casepathNavAuthed === "function") return window.casepathNavAuthed();
    return false;
  }
  async function resolveNavAuthed() {
    if (typeof window.casepathIsAuthenticated === "function") {
      return !!(await window.casepathIsAuthenticated());
    }
    if (navAuthed()) return true;
    if (typeof window.casepathResolveNavAuthed === "function") {
      return !!(await window.casepathResolveNavAuthed());
    }
    return false;
  }
  function clearNavRolloutAttrs(el) {
    if (!el || !el.removeAttribute) return;
    el.removeAttribute("data-cr-locked");
    el.removeAttribute("data-cr-nav-badge");
    el.removeAttribute("data-gate-feature");
    el.removeAttribute("data-casepath-access-section");
    el.removeAttribute("data-cr-nav-tier");
    el.removeAttribute("title");
  }
  function accessReadyForNav() {
    try {
      return window.casepathAccessReady === true;
    } catch (eAr) {
      return false;
    }
  }
  function soonModalCopy(featureKey) {
    var labels = window.FEATURE_LABELS || {};
    var name = labels[featureKey] || "This workspace";
    var signedIn = navAuthed();
    return (
      "<p class=\"modal-sub\"><strong>" +
      name +
      "</strong> is being opened carefully so the private workspace stays steady, useful, and safe for family-law preparation.</p>" +
      "<p class=\"modal-sub\" style=\"margin-top:-0.5rem;font-size: var(--cp-type-small);line-height:1.55;\">" +
      "While this workflow is staged, you can keep using the public CasePath tools: <strong>Glossary</strong>, <strong>Our Mission</strong>, <strong>Support Tools</strong>, mental health resources, and family-law information pages.</p>" +
      (signedIn
        ? "<p class=\"modal-sub\" style=\"margin-top:-0.5rem;font-size: var(--cp-type-small);\">If this should already be active on your account, sign out and back in, then return to the workflow.</p>"
        : "<p class=\"modal-sub\" style=\"margin-top:-0.5rem;font-size: var(--cp-type-small);\">Create a free account to prepare your private workspace and return here when the workflow is available for your account.</p>") +
      '<div class="casepath-soon-cta-row" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.65rem;">' +
      '<button type="button" class="btn-full" data-auth="signin" style="flex:1;min-width:8rem;">Sign in</button>' +
      '<button type="button" class="btn-full" data-auth="signup" style="flex:1;min-width:8rem;background:#5f7f67;">Create free account</button>' +
      "</div>"
    );
  }
  function askQuestionCanonicalHref() {
    try {
      if (window.CasePathRoutes && typeof window.CasePathRoutes.askQuestionHref === "function") {
        return window.CasePathRoutes.askQuestionHref();
      }
      if (window.CasePathRoutes && typeof window.CasePathRoutes.url === "function") {
        return window.CasePathRoutes.url("qa") || window.CasePathRoutes.url("askQuestion");
      }
    } catch (eAsk0) {}
    return "/index.html?goto=qa";
  }
  function upgradeAskQuestionNavLinks() {
    var canonical = askQuestionCanonicalHref();
    var staleRe = /\/app\/assistant\/index\.html/i;
    document.querySelectorAll("a[href]").forEach(function (el) {
      var href = el.getAttribute("href") || "";
      if (!staleRe.test(href)) return;
      el.setAttribute("href", canonical);
      el.removeAttribute("data-protected-nav");
      if (el.getAttribute("data-cp-mobile-nav") === "ai-assistant") {
        el.setAttribute("data-cp-mobile-nav", "qa");
      }
    });
    var nav = document.getElementById("nav-ai-assistant");
    if (nav) {
      nav.setAttribute("href", canonical);
      nav.removeAttribute("data-protected-nav");
    }
  }
  function applyStaticNavRolloutBadges() {
    if (!accessReadyForNav()) return;
    var grid = document.getElementById("nav-main-grid");
    if (!grid) return;
    var signedIn = navAuthed();
    grid.querySelectorAll("a").forEach(function (el) {
      var classification = classifyNavAnchor(el);
      if (!requiresAuthClassification(classification)) {
        clearNavRolloutAttrs(el);
        return;
      }
      applyProtectedLinkState(el, classification, signedIn);
      if (el.id === "nav-your-case-pulse") {
        el.classList.remove("nav-mission-pulse");
      }
    });
  }
  window.casepathApplyStaticNavRolloutBadges = applyStaticNavRolloutBadges;
  function ensureModals() {
    if (document.getElementById("casepath-coming-soon-modal")) return;
    var soon = document.createElement("div");
    soon.id = "casepath-coming-soon-modal";
    soon.className = "modal-overlay";
    soon.setAttribute("aria-hidden", "true");
    soon.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="casepath-soon-title">' +
      '<button type="button" class="modal-close" aria-label="Close">&times;</button>' +
      '<h2 id="casepath-soon-title">Protected workspace preview</h2>' +
      '<div id="casepath-soon-body"></div>' +
      '<p class="modal-sub" style="margin-top:0.35rem;font-size: var(--cp-type-small);">For general family-law information, use <strong>Ask a Question</strong> or the <strong>Glossary</strong>. Both remain available without opening a private workspace.</p>' +
      '<button type="button" class="btn-full" data-casepath-soon-close="1" style="margin-top:0.5rem;">Continue browsing</button>' +
      "</div>";
    document.body.appendChild(soon);
    function wireClose(overlay) {
      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) hideOverlay(overlay);
      });
      var closeBtn = overlay.querySelector(".modal-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          hideOverlay(overlay);
        });
      }
    }
    wireClose(soon);
    soon.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute("data-casepath-soon-close")) {
        ev.preventDefault();
        hideOverlay(soon);
      }
    });
    injectAuthModalStackingCss();
  }
  function injectAuthModalStackingCss() {
    if (document.getElementById("casepath-auth-modal-stack-css")) return;
    var style = document.createElement("style");
    style.id = "casepath-auth-modal-stack-css";
    style.textContent =
      "#casepath-coming-soon-modal.modal-overlay{z-index:100050!important;}";
    (document.head || document.documentElement).appendChild(style);
  }
  function hideOverlay(el) {
    if (!el) return;
    if (window.CasePathRuntime && window.CasePathRuntime.overlay) {
      window.CasePathRuntime.overlay.close(el);
      return;
    }
    el.classList.remove("show");
    el.setAttribute("aria-hidden", "true");
    try {
      var soonEl = document.getElementById("casepath-coming-soon-modal");
      var authEl = document.getElementById("auth-modal");
      if (
        (!soonEl || !soonEl.classList.contains("show")) &&
        (!authEl || !authEl.classList.contains("show"))
      ) {
        document.documentElement.style.overflow = "";
      }
    } catch (e) {
      try {
        document.documentElement.style.overflow = "";
      } catch (e2) {}
    }
  }
  function showOverlay(el) {
    ensureModals();
    closeMobileNavMenu();
    if (!el) return;
    if (window.CasePathRuntime && window.CasePathRuntime.overlay) {
      window.CasePathRuntime.overlay.open(el, { focus: true });
      return;
    }
    el.classList.add("show");
    el.setAttribute("aria-hidden", "false");
    try {
      document.documentElement.style.overflow = "hidden";
    } catch (e) {}
  }
  function logNavAuthMode(mode, redirecting) {
    if (!navDevEnabled()) return;
    try {
      console.log("[NAV AUTH MODE]", {
        mode: mode,
        currentPath: window.location.pathname + window.location.search + window.location.hash,
        redirecting: !!redirecting,
      });
    } catch (eLog) {}
  }
  function canHostAuthUi() {
    if (document.getElementById("auth-modal")) return true;
    if (document.getElementById("casepath-coming-soon-modal")) return true;
    if (document.querySelector("header.header")) return true;
    return false;
  }
  function isLiveAuthSurface() {
    var path = (window.location.pathname || "/").toLowerCase().replace(/\/+$/, "") || "/";
    if (path === "/index.html" || path === "/") return true;
    if (path.indexOf("/app/") === 0) return true;
    if (document.getElementById("page-home")) return true;
    return path !== "";
  }
  function rememberCurrentPageReturnUrl() {
    try {
      var returnUrl = window.location.pathname + window.location.search + window.location.hash;
      if (returnUrl) {
        sessionStorage.setItem("cr_after_auth_url", returnUrl);
      }
    } catch (eReturn) {}
  }
  function logAuthButtonClick(button, mode, fnName) {
    if (!navDevEnabled()) return;
    try {
      console.log("[AUTH BUTTON CLICK]", {
        button: button ? button.outerHTML.slice(0, 120) : null,
        mode: mode,
        currentPage: window.location.pathname + window.location.search + window.location.hash,
        functionCalled: fnName || "casepathGoAuth",
        authModalExists: !!document.getElementById("auth-modal"),
        openAuthType: typeof window.openAuth,
      });
    } catch (eLogBtn) {}
  }
  function warnAuthModalMissing(reason) {
    try {
      console.warn("[AUTH MODAL MISSING]", {
        reason: reason || "unavailable",
        currentPage: window.location.pathname + window.location.search + window.location.hash,
      });
    } catch (eMiss) {}
  }
  var authHostLoadPromise = null;
  function loadStaticAuthHost() {
    if (typeof window.loadAuthRuntimeOnce === "function") {
      return window.loadAuthRuntimeOnce().then(function () {
        if (typeof window.casepathEnsureAuthModalReady === "function") {
          return window.casepathEnsureAuthModalReady();
        }
        return document.getElementById("auth-modal");
      });
    }
    if (typeof window.casepathEnsureAuthModalReady === "function") {
      return window.casepathEnsureAuthModalReady().then(function (modal) {
        if (window.__casepathAuthScriptStackPromise) {
          return window.__casepathAuthScriptStackPromise.then(function () {
            return modal;
          });
        }
        return modal;
      });
    }
    if (authHostLoadPromise) return authHostLoadPromise;
    authHostLoadPromise = new Promise(function (resolve, reject) {
      if (document.querySelector('script[src*="casepath-static-auth-host.js"]')) {
        var waitHost = function (n) {
          if (typeof window.casepathEnsureAuthModalReady === "function") {
            window.casepathEnsureAuthModalReady().then(resolve).catch(reject);
            return;
          }
          if (n <= 0) {
            reject(new Error("static auth host not registered"));
            return;
          }
          setTimeout(function () {
            waitHost(n - 1);
          }, 50);
        };
        waitHost(40);
        return;
      }
      var s = document.createElement("script");
      s.src = "/assets/js/casepath-static-auth-host.js?v=20260727iosscroll1";
      s.async = false;
      s.onload = function () {
        if (typeof window.casepathEnsureAuthModalReady === "function") {
          window.casepathEnsureAuthModalReady().then(resolve).catch(reject);
        } else {
          reject(new Error("static auth host failed to register"));
        }
      };
      s.onerror = function () {
        authHostLoadPromise = null;
        reject(new Error("failed to load static auth host"));
      };
      (document.head || document.documentElement).appendChild(s);
    });
    return authHostLoadPromise;
  }
  function setPendingAuthGateContext(gateContext) {
    try {
      window.__CASEPATH_AUTH_GATE_CONTEXT__ = gateContext || null;
    } catch (_eGateContext) {}
  }
  function showAuthModalInPlace(mode, options) {
    var opts = options || {};
    var m = mode === "signin" ? "signin" : "signup";
    var modal = document.getElementById("auth-modal");
    if (!modal) return false;
    rememberCurrentPageReturnUrl();
    hideOverlay(document.getElementById("casepath-coming-soon-modal"));
    setPendingAuthGateContext(opts.gateContext || null);
    if (typeof window.casepathAuthModalClaim === "function") {
      window.casepathAuthModalClaim(modal);
    }
    if (typeof window.casepathAuthModalOpen === "function") {
      return window.casepathAuthModalOpen(m, {
        source: opts.source || "nav-access",
        gateContext: opts.gateContext || null,
      });
    }
    return false;
  }
  function showGateModalInPlace() {
    ensureModals();
    var body = document.getElementById("casepath-soon-body");
    if (body) {
      body.innerHTML = soonModalCopy("");
    }
    showOverlay(document.getElementById("casepath-coming-soon-modal"));
    return true;
  }
  function logAuthFallback(reason, fallbackUsed) {
    if (!navDevEnabled()) return;
    try {
      console.warn("[AUTH FALLBACK]", {
        reason: reason,
        currentPath: window.location.pathname + window.location.search + window.location.hash,
        fallbackUsed: fallbackUsed,
      });
    } catch (eFb) {}
  }
  function casepathGoAuth(mode, opts) {
    var options = opts || {};
    var intentAuth = options.intent === "auth" || options.fromAuthButton === true;
    var m = mode === "signin" ? "signin" : "signup";
    rememberCurrentPageReturnUrl();

    if (m === "signup") {
      if (typeof window.casepathNavigateToSignupWizard === "function") {
        window.casepathNavigateToSignupWizard({ source: options.source || "nav-access" });
        return;
      }
      try {
        window.location.href = "/signup/";
        return;
      } catch (eSignupNav) {}
    }

    if (intentAuth) {
      void (async function () {
        try {
          if (showAuthModalInPlace(m, { gateContext: options.gateContext || null, source: options.source || "nav-access" })) {
            logNavAuthMode("auth-modal", false);
            return;
          }
          await loadStaticAuthHost();
          if (showAuthModalInPlace(m, { gateContext: options.gateContext || null, source: options.source || "nav-access" })) {
            logNavAuthMode("auth-modal-loaded", false);
            return;
          }
          warnAuthModalMissing("inject-failed");
        } catch (err) {
          warnAuthModalMissing(err && err.message ? err.message : "load-failed");
        }
      })();
      return;
    }

    if (isLiveAuthSurface() && canHostAuthUi()) {
      showGateModalInPlace(m);
      logNavAuthMode("gate-modal", false);
      return;
    }

    ensureModals();
    if (showGateModalInPlace(m)) {
      logAuthFallback("gate-modal-forced", "account-gate-modal");
      logNavAuthMode("gate-modal-forced", false);
      return;
    }

    logAuthFallback("auth-ui-unavailable", "none");
    warnAuthModalMissing("no-host");
    navDevWarn("auth_open_failed", { mode: m });
  }
  function inferAuthModeFromInline(el) {
    if (!el || !el.getAttribute) return "";
    var inline = String(el.getAttribute("onclick") || "");
    if (/openAuth\(\s*['"]signin['"]\s*\)/i.test(inline)) return "signin";
    if (/openAuth\(\s*['"]signup['"]\s*\)/i.test(inline)) return "signup";
    return "";
  }
  function resolveAuthModeFromElement(el) {
    if (!el || !el.getAttribute) return "";
    var dataAuth = el.getAttribute("data-auth");
    if (dataAuth === "signin" || dataAuth === "signup") return dataAuth;
    var mode =
      el.getAttribute("data-auth-mode") ||
      el.getAttribute("data-casepath-auth") ||
      (el.id === "nav-signin-btn" ? "signin" : "") ||
      (el.id === "nav-signup-btn" ? "signup" : "") ||
      inferAuthModeFromInline(el);
    return mode === "signup" ? "signup" : mode === "signin" ? "signin" : "";
  }
  function authCtaTargetFromEvent(ev) {
    if (!ev || !ev.target || !ev.target.closest) return null;
    return ev.target.closest(
      "[data-auth],[data-auth-mode],[data-casepath-auth],#nav-signin-btn,#nav-signup-btn,[onclick*=\"openAuth('signin')\"],[onclick*='openAuth(\"signin\")'],[onclick*=\"openAuth('signup')\"],[onclick*='openAuth(\"signup\")']"
    );
  }
  function installAuthButtonBinder() {
    if (window.__CASEPATH_AUTH_BUTTON_BINDER__) return;
    window.__CASEPATH_AUTH_BUTTON_BINDER__ = true;
    if (typeof window.casepathInitAuthEntryPoints === "function") {
      window.casepathInitAuthEntryPoints();
    }
  }
  function rememberReturnHref(href) {
    try {
      var raw = String(href || "").trim();
      if (!raw) return;
      var u = new URL(raw, window.location.origin);
      if (u.origin !== window.location.origin) return;
      sessionStorage.setItem("cr_after_auth_url", u.pathname + u.search + u.hash);
    } catch (eReturn) {}
  }
  window.casepathGoAuth = casepathGoAuth;
  window.__casepathLogNavConflict = function (code, detail) {
    navDevWarn("conflict:" + code, detail || "");
    try {
      console.warn("[NAV CONFLICT]", code, detail || "");
    } catch (eLog) {}
  };
  window.casepathDenySpaPageAccess = function (pageId) {
    if (casepathPublicPageId(pageId)) {
      navDevWarn("public_gate_bypassed", { pageId: pageId, source: "casepathDenySpaPageAccess" });
      return;
    }
    try {
      if (
        document.getElementById("page-" + pageId) &&
        !(typeof window.casepathIsComingSoonPage === "function" && window.casepathIsComingSoonPage(pageId))
      ) {
        sessionStorage.setItem("cr_pending_page", pageId);
      }
    } catch (eDeny) {}
    var featKey =
      typeof window.casepathNavFeatureFromPageId === "function"
        ? window.casepathNavFeatureFromPageId(pageId)
        : null;
    window.casepathShowAccountRequiredModal(featKey, { pageId: pageId, source: "spa-page-gate" });
  };
  window.casepathEnsureSpaPageAccess = async function (pageId) {
    if (casepathPublicPageId(pageId)) return true;
    if (typeof window.crPublicShellPage === "function" && window.crPublicShellPage(pageId)) return true;
    if (navAuthed()) return true;
    return !!(await resolveNavAuthed());
  };
  window.casepathShowAccountRequiredModal = function (featureKey, options) {
    var opts = options || {};
    var classification = opts.classification || null;
    if (!classification) {
      var access = routeAccess();
      var featureLookup = String(featureKey || "").trim();
      if (featureLookup === "lawyerPortal") featureLookup = "lawyer-portal";
      if (access) {
        if (opts.pageId && typeof access.classifyPageId === "function") {
          classification = access.classifyPageId(opts.pageId);
        } else if (opts.href && typeof access.classifyHref === "function") {
          classification = access.classifyHref(opts.href);
        } else if (featureLookup && typeof access.classifyPageId === "function") {
          classification = access.classifyPageId(featureLookup);
        }
      }
    }
    if (!requiresAuthClassification(classification)) {
      var fallbackSection = opts.section || "protected";
      if (
        featureKey === "vault" ||
        featureKey === "calendar" ||
        featureKey === "assistant" ||
        featureKey === "lawyerPortal" ||
        featureKey === "parenting-orders"
      ) {
        fallbackSection = "your-case";
      } else if (featureKey === "documents" || featureKey === "checklists" || featureKey === "mediation") {
        fallbackSection = "prepare";
      }
      var fallbackCopy =
        routeAccess() && typeof routeAccess().copyForSection === "function"
          ? routeAccess().copyForSection(fallbackSection)
          : gateContextForClassification({ section: fallbackSection });
      classification = {
        state: "AUTH_REQUIRED",
        section: fallbackSection,
        featureKey: featureKey || null,
        title: fallbackCopy.title || "Account required",
        tooltip: fallbackCopy.tooltip || "Account required",
        signInMessage: fallbackCopy.signInMessage || "Create a free account to continue.",
        signUpMessage: fallbackCopy.signUpMessage || "Create a free account to continue.",
        explanation: fallbackCopy.explanation || fallbackCopy.signUpMessage || "",
      };
    }
    if (typeof window.casepathAuthHydrated === "function" && !window.casepathAuthHydrated()) {
      if (navDevEnabled()) {
        try {
          console.warn("[AUTH ERROR] Gate attempted before auth hydration complete", {
            context: "casepathShowAccountRequiredModal",
            feature: (classification && classification.featureKey) || featureKey || null,
          });
        } catch (ePre) {}
      }
    }
    if (typeof window.casepathWorkspaceAuthed === "function" && window.casepathWorkspaceAuthed()) {
      if (typeof window.casepathAuthDebugLog === "function") {
        window.casepathAuthDebugLog((classification && classification.featureKey) || featureKey, {
          reason: "account_modal_suppressed_sync",
        });
      }
      return;
    }
    void (async function () {
      var hydrationSource = "skip";
      if (typeof window.casepathWaitForAuthHydration === "function") {
        await Promise.race([
          Promise.resolve(window.casepathWaitForAuthHydration()).then(function () {
            hydrationSource = "hydrated";
          }),
          new Promise(function (resolve) {
            setTimeout(function () {
              hydrationSource = "timeout";
              resolve();
            }, 500);
          }),
        ]);
      }
      if (navDevEnabled()) {
        try {
          console.log("[AUTH GATE TIMING]", {
            event: "account_required_hydration_settle",
            source: hydrationSource,
            feature: (classification && classification.featureKey) || featureKey || null,
          });
        } catch (_eHydrLog) {}
      }
      if (typeof window.casepathIsAuthenticated === "function" && (await window.casepathIsAuthenticated())) {
        if (typeof window.casepathAuthDebugLog === "function") {
          window.casepathAuthDebugLog((classification && classification.featureKey) || featureKey, {
            reason: "account_modal_suppressed_after_hydrate",
          });
        }
        if (typeof window.casepathLogAuthGateCheck === "function") {
          window.casepathLogAuthGateCheck("showAccountRequiredModal:suppressed", true);
        }
        return;
      }
      if (typeof window.casepathResolveNavAuthed === "function" && (await window.casepathResolveNavAuthed())) {
        if (typeof window.casepathAuthDebugLog === "function") {
          window.casepathAuthDebugLog((classification && classification.featureKey) || featureKey, {
            reason: "account_modal_suppressed_after_resolve",
          });
        }
        return;
      }
      if (typeof window.casepathAuthDebugLog === "function") {
        window.casepathAuthDebugLog((classification && classification.featureKey) || featureKey, {
          reason: "account_required_auth_open",
        });
      }
      if (typeof window.casepathLogAuthGateCheck === "function") {
        window.casepathLogAuthGateCheck("showAccountRequiredModal:open", false);
      }
      var soon = document.getElementById("casepath-coming-soon-modal");
      if (soon) hideOverlay(soon);
      try {
        if (document && document.documentElement) {
          document.documentElement.classList.remove("casepath-auth-bootstrapping");
          document.documentElement.removeAttribute("data-casepath-auth-bootstrap-pending");
        }
      } catch (_eBootstrapClear) {}
      var gateContext = gateContextForClassification(classification);
      setPendingAuthGateContext(gateContext);
      if (typeof window.openAuth === "function" && document.getElementById("auth-modal")) {
        window.openAuth("signup");
        return;
      }
      casepathGoAuth("signup", {
        intent: "auth",
        gateContext: gateContext,
        source: opts.source || "account-required",
      });
    })();
  };
  window.casepathShowComingSoonModal = function (featureKey) {
    var fk = featureKey ? String(featureKey) : "";
    try {
      if (typeof window.normalizeFeatureKey === "function") {
        fk = window.normalizeFeatureKey(fk) || fk;
      }
    } catch (eFk) {}
    if (typeof window.casepathNavigateLiveFeature === "function" && window.casepathNavigateLiveFeature(fk || featureKey)) {
      return;
    }
    if (fk === "mediation") {
      if (typeof window.openMediationExperience === "function") {
        window.openMediationExperience();
        return;
      }
      casepathSafeAssignHref("/app/mediation/index.html");
      return;
    }
    ensureModals();
    var el = document.getElementById("casepath-coming-soon-modal");
    var body = document.getElementById("casepath-soon-body");
    if (body) {
      body.innerHTML = soonModalCopy(fk || "assistant");
    }
    showOverlay(el);
  };
  window.casepathHideAccountRequiredModal = function () {
    return false;
  };
  window.casepathHideComingSoonModal = function () {
    hideOverlay(document.getElementById("casepath-coming-soon-modal"));
  };
  window.casepathStripGotoFromUrl = function () {
    try {
      var u = new URL(window.location.href);
      if (!u.searchParams.has("goto")) return;
      u.searchParams.delete("goto");
      var qs = u.searchParams.toString();
      window.history.replaceState({}, "", u.pathname + (qs ? "?" + qs : "") + u.hash);
    } catch (e) {}
  };
  function isPublicNavAnchor(a) {
    if (!a) return false;
    return !requiresAuthClassification(classifyNavAnchor(a));
  }
  function requiresProtectedNav(a) {
    if (!a || !a.closest || !a.getAttribute) return false;
    if (!a.closest(NAV_GRID_SELECTOR)) return false;
    var attr = a.getAttribute("data-protected-nav");
    if (attr === "false" || attr === "0") return false;
    if (attr === "" || attr === "true" || attr === "1") return true;
    return requiresAuthClassification(classifyNavAnchor(a));
  }
  function rememberProtectedReturnUrl(a) {
    if (!a) return;
    var href = a.getAttribute("data-return-url") || a.getAttribute("href") || "";
    rememberReturnHref(href);
  }
  function installProtectedNavHandlers() {
    if (window.__CASEPATH_NAV_PROTECTED_HANDLER_INSTALLED__) {
      navDevWarn("duplicate_protected_handler", {});
      return;
    }
    window.__CASEPATH_NAV_PROTECTED_HANDLER_INSTALLED__ = true;
    document.addEventListener(
      "click",
      function (ev) {
        var a = ev.target && ev.target.closest && ev.target.closest(NAV_GRID_SELECTOR + " a");
        if (!a) return;
        var grid = a.closest(".nav-grid");
        if (!grid || grid.id !== "nav-main-grid") return;
        if (
          a.getAttribute("data-cp-mobile-route-direct") === "true" &&
          window.matchMedia &&
          window.matchMedia("(max-width: 900px)").matches
        ) {
          return;
        }
        if (!requiresProtectedNav(a)) return;
        var id = a.id || "";
        if (typeof window.casepathIsPublicLowerNavId === "function" && window.casepathIsPublicLowerNavId(id)) {
          return;
        }
        if (!id && a.getAttribute("href") && !casepathHrefIsPublic(a.getAttribute("href")) && !navAuthed()) {
          stopProtectedNavEvent(ev);
          void (async function () {
            if (await resolveNavAuthed()) {
              casepathSafeAssignHref(a.getAttribute("href"));
              return;
            }
            rememberProtectedReturnUrl(a);
            window.casepathShowAccountRequiredModal();
          })();
          return;
        }
        var isWorkspace =
          id === "nav-your-case-pulse" ||
          (typeof window.casepathIsWorkspaceNavId === "function" && window.casepathIsWorkspaceNavId(id));
        if (isWorkspace) {
          if (navAuthed()) return;
          stopProtectedNavEvent(ev);
          if (gateWorkspaceNavClick(ev, id, a)) return;
          return;
        }
        if (FEATURE_NAV[id] && !accessReadyForNav()) {
          if (allowDefaultLiveNavWhilePending(id, a)) return;
          // Access/auth state is not ready yet. Never leave the click in a
          // preventDefault deadlock waiting on an event that may never fire:
          // resolve auth now and deterministically either navigate (authed)
          // or open the account-required gate (guest).
          stopProtectedNavEvent(ev);
          rememberProtectedReturnUrl(a);
          if (gateWorkspaceNavClick(ev, id, a)) return;
          window.casepathShowAccountRequiredModal(FEATURE_NAV[id]);
          return;
        }
        if (FEATURE_NAV[id]) {
          var feat = FEATURE_NAV[id];
          if (feat === "mediation") {
            if (navAuthed()) return;
            stopProtectedNavEvent(ev);
            rememberProtectedReturnUrl(a);
            gateWorkspaceNavClick(ev, id, a);
            return;
          }
          if (typeof window.canAccessFeature === "function" && !window.canAccessFeature(feat)) {
            stopProtectedNavEvent(ev);
            rememberProtectedReturnUrl(a);
            window.casepathShowAccountRequiredModal(feat);
            return;
          }
        }
        if (COMING_NAV_IDS.indexOf(id) !== -1) {
          stopProtectedNavEvent(ev);
          window.casepathShowComingSoonModal();
          return;
        }
        if (ACCOUNT_NAV_IDS.indexOf(id) !== -1 || a.hasAttribute("data-protected-nav")) {
          var path = (window.location.pathname || "").toLowerCase();
          if (window.__CASEPATH_NAV_TRACE__) {
            try {
              console.log("[NAV AUTH TIMING]", {
                fn: "protectedNavClick",
                id: id,
                href: a.getAttribute("href"),
                authed: navAuthed(),
                msSinceBoot: performance.now(),
              });
            } catch (eTr) {}
          }
          if (id === "nav-kids" && /kids\.html$/i.test(path)) return;
          if (id === "nav-mental-health" && /mental-health\.html$/i.test(path)) return;
          if (id === "nav-new-item" && /support-tools\.html$/i.test(path)) return;
          if (id === "nav-checklists" && /checklists\.html$/i.test(path)) return;
          if (!navAuthed()) {
            stopProtectedNavEvent(ev);
            void (async function () {
              if (await resolveNavAuthed()) {
                if (a.getAttribute("href")) casepathSafeAssignHref(a.getAttribute("href"));
                return;
              }
              rememberProtectedReturnUrl(a);
              window.casepathShowAccountRequiredModal();
            })();
          }
        }
      },
      true
    );
  }
  function gateWorkspaceNavClick(ev, navId, anchor) {
    if (typeof window.casepathIsPublicLowerNavId === "function" && window.casepathIsPublicLowerNavId(navId)) {
      return false;
    }
    var feat =
      (typeof window.casepathNavFeatureFromId === "function" && window.casepathNavFeatureFromId(navId)) ||
      FEATURE_NAV[navId] ||
      null;
    if (!feat && navId !== "nav-your-case-pulse") return false;
    void (async function () {
      var ok = await resolveNavAuthed();
      if (ok) {
        rememberReturnHref(anchor && anchor.getAttribute("href"));
        if (navId === "nav-mediation") {
          if (typeof window.openMediationExperience === "function") {
            window.openMediationExperience();
            return;
          }
          var medHref = (anchor && anchor.getAttribute("href")) || "/app/mediation/index.html";
          casepathSafeAssignHref(medHref);
          return;
        }
        if (anchor && anchor.getAttribute("href")) {
          casepathSafeAssignHref(anchor.getAttribute("href"));
        }
        return;
      }
      if (typeof window.casepathAuthDebugLog === "function") {
        window.casepathAuthDebugLog(feat || "vault", { reason: "workspace_nav_click_guest" });
      }
      rememberReturnHref(anchor && anchor.getAttribute("href"));
      window.casepathShowAccountRequiredModal(feat || "vault");
    })();
    return true;
  }
  function installProtectedRouteLinkHandlers() {
    if (window.__CASEPATH_PROTECTED_LINK_HANDLER_INSTALLED__) return;
    window.__CASEPATH_PROTECTED_LINK_HANDLER_INSTALLED__ = true;
    document.addEventListener(
      "click",
      function (ev) {
        if (!ev || ev.defaultPrevented) return;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        var anchor = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
        if (!anchor) return;
        if (anchor.closest(NAV_GRID_SELECTOR)) return;
        if (anchor.hasAttribute("download")) return;
        if ((anchor.getAttribute("target") || "").toLowerCase() === "_blank") return;
        if (anchor.closest("#auth-modal") || anchor.closest("#casepath-coming-soon-modal")) return;
        if (anchor.hasAttribute("data-auth-mode") || anchor.hasAttribute("data-casepath-auth")) return;
        var classification = classifyNavAnchor(anchor);
        if (!requiresAuthClassification(classification)) return;
        if (navAuthed()) return;
        stopProtectedNavEvent(ev);
        rememberReturnHref(anchor.getAttribute("href"));
        try {
          if (classification.gotoToken) {
            sessionStorage.setItem("cr_pending_spa_route", classification.gotoToken);
          }
        } catch (_ePending) {}
        window.casepathShowAccountRequiredModal(classification.featureKey || classification.section, {
          classification: classification,
          href: anchor.getAttribute("href"),
          source: "protected-link",
        });
      },
      true
    );
  }
  installProtectedNavHandlers();
  installProtectedRouteLinkHandlers();
  installAuthButtonBinder();
  function runAccountPageGate() {
    try {
      if (document.body && document.body.getAttribute("data-casepath-inline-gate") === "true") return;
    } catch (eInlineGate) {}
    var gate = document.body.getAttribute("data-casepath-account-gate");
    if (!gate && !casepathStaticPathRequiresAccount()) return;
    try {
      var staticClassification =
        routeAccess() && typeof routeAccess().classifyPath === "function"
          ? routeAccess().classifyPath(window.location.pathname || "/")
          : null;
      if (requiresAuthClassification(staticClassification)) {
        var robots = document.querySelector('meta[name="robots"]');
        if (!robots) {
          robots = document.createElement("meta");
          robots.setAttribute("name", "robots");
          (document.head || document.documentElement).appendChild(robots);
        }
        robots.setAttribute("content", "noindex, nofollow");
      }
    } catch (_eRobots) {}
    void (async function () {
      if (typeof window.casepathWaitForAuthHydration === "function") {
        await window.casepathWaitForAuthHydration();
      } else if (typeof window.casepathResolveNavAuthed === "function") {
        await window.casepathResolveNavAuthed();
      }
      var authed =
        typeof window.casepathIsAuthenticatedSync === "function"
          ? window.casepathIsAuthenticatedSync() === true
          : await resolveNavAuthed();
      if (typeof window.casepathLogAuthGateCheck === "function") {
        window.casepathLogAuthGateCheck("runAccountPageGate", authed);
      }
      if (authed) return;
      try {
        sessionStorage.setItem(
          "cr_after_auth_url",
          String(window.location.pathname || "/") + String(window.location.search || "")
        );
      } catch (eStore) {}
      window.casepathShowAccountRequiredModal(null, {
        classification:
          routeAccess() && typeof routeAccess().classifyPath === "function"
            ? routeAccess().classifyPath(window.location.pathname || "/")
            : null,
        source: "static-page-gate",
      });
      try {
        document.documentElement.style.overflow = "hidden";
      } catch (e2) {}
    })();
  }
  function casepathStaticPathRequiresAccount() {
    try {
      if (document.getElementById("page-home")) return false;
      var current = routeAccess();
      if (current && typeof current.requiresAuth === "function") {
        return current.requiresAuth({ path: window.location.pathname || "/" });
      }
      var path = String(window.location.pathname || "/").toLowerCase().replace(/\/+$/, "");
      if (!path || path === "/" || path === "/index.html") return false;
      if (casepathPublicPath(path)) return false;
      return true;
    } catch (eGatePath) {
      return false;
    }
  }
  function casepathHrefIsPublic(href) {
    try {
      var current = routeAccess();
      if (current && typeof current.isPublicRoute === "function") {
        return current.isPublicRoute({ href: href });
      }
      var u = new URL(String(href || ""), window.location.origin);
      if (u.origin !== window.location.origin) return true;
      var path = String(u.pathname || "/").toLowerCase().replace(/\/+$/, "");
      var goto = String(u.searchParams.get("goto") || "").toLowerCase();
      if ((path === "/index.html" || path === "/") && casepathPublicPageId(goto)) return true;
      return casepathPublicPath(path);
    } catch (eHref) {
      return false;
    }
  }
  function markStaticShellAccessReady() {
    if (document.getElementById("page-home")) return;
    if (accessReadyForNav()) return;
    if (navAuthed()) {
      try {
        if (window.CasePathAccess && typeof window.CasePathAccess.markAccessReady === "function") {
          window.CasePathAccess.markAccessReady();
          return;
        }
      } catch (eMrAuthed) {}
    }
    try {
      if (window.CasePathAccess && typeof window.CasePathAccess.markAccessReadyAnonymous === "function") {
        window.CasePathAccess.markAccessReadyAnonymous();
        return;
      }
    } catch (eMr0) {}
    try {
      window.casepathAccessReady = true;
      if (document.documentElement) {
        document.documentElement.removeAttribute("data-casepath-access-pending");
      }
      var grid = document.getElementById("nav-main-grid");
      if (grid) grid.removeAttribute("data-casepath-access-pending");
    } catch (eMr1) {}
  }
  function allowDefaultLiveNavWhilePending(navId, anchor) {
    if (accessReadyForNav()) return false;
    var classification =
      (routeAccess() && typeof routeAccess().classifyNavId === "function" && routeAccess().classifyNavId(navId)) ||
      classifyNavAnchor(anchor);
    if (!requiresAuthClassification(classification)) return true;
    return navAuthed();
  }
  function casepathPublicPageId(pageId) {
    var id = String(pageId || "").trim();
    if (id === "qa") return true;
    if (routeAccess() && typeof routeAccess().isPublicRoute === "function") {
      return routeAccess().isPublicRoute({ pageId: id });
    }
    try {
      if (
        window.CasePathProtectedRoutes &&
        typeof window.CasePathProtectedRoutes.isPublicRoute === "function" &&
        window.CasePathProtectedRoutes.isPublicRoute({ goto: id })
      ) {
        return true;
      }
    } catch (_eGate) {}
    return PUBLIC_NAV_PAGES[id] === true;
  }
  function casepathPublicPath(path) {
    var access = routeAccess();
    if (access && typeof access.isPublicRoute === "function") {
      return access.isPublicRoute({ path: path });
    }
    var p = String(path || "").toLowerCase().replace(/\/+$/, "") || "/";
    if (PUBLIC_NAV_PATHS[p] === true) return true;
    if (p === "/mission" || p === "/glossary") return true;
    if (p === "/mental-health" || p === "/kids" || p === "/avo-centre" || p === "/protection-orders") return true;
    if (p === "/self-represented-guide") return true;
    if (p === "/support-tools") return true;
    if (p === "/pricing") return true;
    return false;
  }
  window.PUBLIC_NAV_SURFACES = PUBLIC_NAV_SURFACES.slice();
  window.casepathPublicNavSurface = function (value) {
    if (PUBLIC_NAV_IDS[value]) return true;
    if (casepathPublicPageId(value)) return true;
    return casepathPublicPath(value);
  };
  function closeMobileNavMenu() {
    var wrap = document.querySelector(".nav-site-links");
    if (wrap) wrap.classList.remove("nav-mobile-open");
    document.body.classList.remove("nav-mobile-menu-open");
    var btn = document.getElementById("nav-mobile-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  function maybeLoadNavDebug() {
    try {
      if (window.__CASEPATH_NAV_DEBUG__ !== true) return;
      if (document.querySelector('script[src*="casepath-nav-debug.js"]')) return;
      var s = document.createElement("script");
      s.src = "/assets/js/core/casepath-nav-debug.js?v=20260727iosscroll1";
      s.async = false;
      (document.head || document.documentElement).appendChild(s);
    } catch (eDbgLoad) {}
  }
  async function boot() {
    ensureModals();
    upgradeAskQuestionNavLinks();
    maybeLoadNavDebug();
    runNavDevAudit();
    if (typeof window.casepathWaitForAuthHydration === "function") {
      try {
        await window.casepathWaitForAuthHydration();
      } catch (eHydrNav) {}
    }
    if (typeof window.casepathRenderNavAuthState === "function") {
      window.casepathRenderNavAuthState({ source: "nav-access-boot" });
    }
    if (!document.getElementById("page-home") && !casepathStaticPathRequiresAccount()) {
      markStaticShellAccessReady();
      applyStaticNavRolloutBadges();
      return;
    }
    if (typeof window.syncUser === "function") {
      try {
        await window.syncUser();
      } catch (eSu) {}
    }
    if (typeof window.casepathRenderNavAuthState === "function") {
      window.casepathRenderNavAuthState({ source: "nav-access-boot-post-sync" });
    }
    markStaticShellAccessReady();
    if (accessReadyForNav()) {
      applyStaticNavRolloutBadges();
    } else {
      document.addEventListener(
        "casepath:access-ready",
        function onAccessReady() {
          document.removeEventListener("casepath:access-ready", onAccessReady);
          applyStaticNavRolloutBadges();
        },
        { once: true }
      );
    }
    runAccountPageGate();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    void boot();
  }
  document.addEventListener("casepath:access-ready", function () {
    if (typeof window.casepathApplyStaticNavRolloutBadges === "function") {
      window.casepathApplyStaticNavRolloutBadges();
    }
  });
  setTimeout(function () {
    markStaticShellAccessReady();
    if (accessReadyForNav() && typeof window.casepathApplyStaticNavRolloutBadges === "function") {
      window.casepathApplyStaticNavRolloutBadges();
    }
  }, 2000);
  if (!window.__casepathRuntimeEscapeWired) {
    document.addEventListener("keydown", function (ev) {
      if (!ev || ev.key !== "Escape") return;
      var soon = document.getElementById("casepath-coming-soon-modal");
      if (soon && soon.classList.contains("show")) {
        hideOverlay(soon);
        ev.preventDefault();
      }
    });
  }

  window.openAuth = function (mode) {
    logAuthButtonClick(null, mode, "openAuth");
    var m = mode === "signin" ? "signin" : "signup";
    if (
      m === "signin" &&
      typeof window.isPasswordRecoveryActive === "function" &&
      window.isPasswordRecoveryActive()
    ) {
      if (typeof window.casepathOpenRecoveryExpiredPanel === "function" && window.__CASEPATH_RECOVERY_EXPIRED_PANEL_PENDING__) {
        return window.casepathOpenRecoveryExpiredPanel();
      }
      if (typeof window.casepathOpenRecoveryPasswordPanel === "function") {
        return window.casepathOpenRecoveryPasswordPanel();
      }
    }
    if (document.getElementById("auth-modal") && typeof window.casepathAuthModalOpen === "function") {
      rememberCurrentPageReturnUrl();
      return window.casepathAuthModalOpen(m, { source: "openAuth-inline-modal" });
    }
    casepathGoAuth(mode, { intent: "auth" });
  };
})();
