/**
 * Canonical public URLs for SPA history + direct pathname resolution.
 * Public informational pages use explicit `.html`; app surfaces use `/app/.../`.
 */
(function (w) {
  "use strict";
  if (!w) return;

  var STATIC_HTML_BY_PAGE = {
    mission: "/mission.html",
    pricing: "/pricing.html",
    glossary: "/glossary.html",
    legislation: "/glossary.html",
    kids: "/kids.html",
    "mental-health": "/mental-health.html",
    "parenting-orders": "/parenting-orders.html",
    "support-tools": "/support-tools.html",
    checklists: "/checklists.html",
    "your-team": "/your-team.html",
    referrals: "/referrals.html",
    "lawyer-portal": "/lawyer-portal.html",
    share: "/share.html",
    "self-exclusion": "/self-exclusion.html",
    avo: "/protection-orders.html",
    "document-centre": "/document-centre.html",
    "your-case": "/your-case.html",
    contact: "/contact.html",
    privacy: "/privacy.html",
    terms: "/terms.html",
  };

  var SLUG_ALIASES = {
    "avo-centre": "avo",
    "protection-orders": "avo",
    "document-centre": "document-centre",
    "your-case": "your-case",
  };

  var APP_SURFACE_BY_PAGE = {
    vault: "/app/workspace/index.html",
    case: "/app/workspace/index.html",
    qa: "/index.html?goto=qa",
    assistant: "/index.html?goto=qa",
    "ai-assistant": "/index.html?goto=qa",
    mediation: "/app/mediation/index.html",
    "doc-helper": "/document-centre.html",
    documents: "/document-centre.html",
    calendar: "/app/calendar/index.html",
  };

  function defaultRouteBase() {
    try {
      var path = w.location && w.location.pathname ? w.location.pathname : "/";
      if (path.indexOf("/casepath") !== -1) return "/casepath";
    } catch (_e) {}
    return "";
  }

  function withBase(base, href) {
    var b = String(base || "");
    var h = String(href || "/");
    if (!b) return h;
    if (h.charAt(0) !== "/") return b + "/" + h;
    return b + h;
  }

  function pathForPage(pageId, routeBase) {
    var id = String(pageId || "").trim();
    var base = typeof routeBase === "string" ? routeBase : defaultRouteBase();
    if (!id || id === "home") return base ? base + "/" : "/";
    if (STATIC_HTML_BY_PAGE[id]) return withBase(base, STATIC_HTML_BY_PAGE[id]);
    if (APP_SURFACE_BY_PAGE[id]) return withBase(base, APP_SURFACE_BY_PAGE[id]);
    return withBase(base, "/index.html?goto=" + encodeURIComponent(id));
  }

  function pathnameSlug(pathname, routeBase) {
    var raw = String(pathname || "/");
    var base = String(routeBase || "");
    if (base && raw.indexOf(base) === 0) raw = raw.slice(base.length);
    raw = raw.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!raw) return "";
    var segment = raw.split("/")[0];
    if (segment.endsWith(".html")) segment = segment.slice(0, -5);
    if (segment.endsWith(".shtml")) segment = segment.slice(0, -6);
    return segment;
  }

  function resolvePageFromPathname(pathname, routeBase) {
    var slug = pathnameSlug(pathname, routeBase);
    if (!slug) return "home";
    if (SLUG_ALIASES[slug]) return SLUG_ALIASES[slug];
    if (STATIC_HTML_BY_PAGE[slug] || APP_SURFACE_BY_PAGE[slug]) return slug;
    try {
      if (w.document && w.document.getElementById("page-" + slug)) return slug;
    } catch (_e) {}
    return "home";
  }

  function redirectUrlForPage(pageId) {
    var id = String(pageId || "").trim();
    if (!id || id === "home") return null;
    if (STATIC_HTML_BY_PAGE[id]) return STATIC_HTML_BY_PAGE[id];
    if (APP_SURFACE_BY_PAGE[id]) return APP_SURFACE_BY_PAGE[id];
    return null;
  }

  function assignRedirect(pageId) {
    var url = redirectUrlForPage(pageId);
    if (!url) return false;
    try {
      if (
        w.CasePathAuth &&
        w.CasePathAuth.redirect &&
        typeof w.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        return w.CasePathAuth.redirect.safeAssignHref(url);
      }
    } catch (_e) {}
    try {
      w.location.href = url;
      return true;
    } catch (_e2) {}
    return false;
  }

  w.CasePathSpaUrl = {
    STATIC_HTML_BY_PAGE: STATIC_HTML_BY_PAGE,
    APP_SURFACE_BY_PAGE: APP_SURFACE_BY_PAGE,
    defaultRouteBase: defaultRouteBase,
    pathForPage: pathForPage,
    resolvePageFromPathname: resolvePageFromPathname,
    redirectUrlForPage: redirectUrlForPage,
    assignRedirect: assignRedirect,
  };

  (function bootDocHelperGuestRedirect() {
    try {
      var path = String((w.location && w.location.pathname) || "/")
        .toLowerCase()
        .replace(/\/+$/, "") || "/";
      if (path !== "/" && path !== "/index.html") return;
      var params = new URLSearchParams(w.location.search || "");
      var raw = params.get("goto");
      if (!raw) return;
      var goto = String(raw).trim().toLowerCase();
      if (goto === "document" || goto === "documents" || goto === "document-centre" || goto === "document-helper") {
        goto = "doc-helper";
      }
      if (goto !== "doc-helper") return;
      var legacyAssistantType = "";
      try {
        if (
          w.CasePathFormAssistantRoutes &&
          typeof w.CasePathFormAssistantRoutes.resolveFromSearch === "function"
        ) {
          legacyAssistantType = w.CasePathFormAssistantRoutes.resolveFromSearch(w.location.search);
        }
      } catch (_eLegacyAssistant) {}
      if (
        legacyAssistantType &&
        w.CasePathFormAssistantRoutes &&
        typeof w.CasePathFormAssistantRoutes.isValid === "function" &&
        w.CasePathFormAssistantRoutes.isValid(legacyAssistantType) &&
        typeof w.CasePathFormAssistantRoutes.href === "function"
      ) {
        assignHref(w.CasePathFormAssistantRoutes.href(legacyAssistantType));
        return;
      }
      var authed = false;
      try {
        if (typeof w.casepathIsAuthenticatedSync === "function") authed = w.casepathIsAuthenticatedSync() === true;
        if (!authed && w.__CASEPATH_AUTH_STATE__ && w.__CASEPATH_AUTH_STATE__.hydrated) {
          authed = w.__CASEPATH_AUTH_STATE__.mode === "authenticated";
        }
      } catch (_eAuth) {}
      if (authed) return;
      assignRedirect("doc-helper");
    } catch (_eBoot) {}
  })();
})(typeof window !== "undefined" ? window : this);
