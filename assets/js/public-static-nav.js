/**
 * Mobile nav toggle for static HTML pages + shell asset loaders.
 */
(function () {
  if (window.__CASEPATH_MOBILE_NAV_WIRED__) return;
  window.__CASEPATH_MOBILE_NAV_WIRED__ = true;

  /* Keep in sync with casepath-nav-system.css / casepath-shell.css mobile drawer (≤1024px). */
  var mq = window.matchMedia("(max-width: 1025px)");
  var btn = document.getElementById("nav-mobile-toggle");
  var wrap = document.querySelector(".nav-site-links");
  var menu = document.getElementById("nav-mobile-menu") || document.getElementById("nav-main-grid");
  if (!btn || !wrap || !menu) return;

  var scrim = document.getElementById("nav-mobile-scrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "nav-mobile-scrim";
    scrim.className = "nav-mobile-scrim";
    scrim.setAttribute("aria-hidden", "true");
    document.body.appendChild(scrim);
  }

  function syncDropdownTop() {
    var hdr = document.querySelector("header.header");
    var y = hdr ? hdr.getBoundingClientRect().bottom : 100;
    document.documentElement.style.setProperty("--mobile-nav-dropdown-top", y + "px");
  }

  function closeMenu() {
    wrap.classList.remove("nav-mobile-open");
    document.body.classList.remove("nav-mobile-menu-open");
    btn.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  }

  function openMenu() {
    syncDropdownTop();
    wrap.classList.add("nav-mobile-open");
    document.body.classList.add("nav-mobile-menu-open");
    btn.setAttribute("aria-expanded", "true");
    menu.hidden = false;
  }

  scrim.addEventListener("click", function () {
    if (mq.matches) closeMenu();
  });

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!mq.matches) return;
    if (wrap.classList.contains("nav-mobile-open")) closeMenu();
    else openMenu();
  });

  document.addEventListener("click", function (e) {
    if (!mq.matches || !wrap.classList.contains("nav-mobile-open")) return;
    if (!wrap.contains(e.target) && e.target !== btn) closeMenu();
  });

  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (mq.matches) closeMenu();
    });
  });

  var mobileAsk = document.getElementById("nav-mobile-header-ask");
  if (mobileAsk) {
    mobileAsk.addEventListener("click", function () {
      if (mq.matches) closeMenu();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "resize",
    function () {
      if (!mq.matches) closeMenu();
      else if (wrap.classList.contains("nav-mobile-open")) syncDropdownTop();
    },
    { passive: true }
  );

  mq.addEventListener("change", function () {
    if (!mq.matches) closeMenu();
  });

  function syncMobileAuthLinks() {
    var signIn = menu.querySelector(".nav-mobile-auth-signin");
    var account = menu.querySelector(".nav-mobile-auth-account");
    var state = window.__CASEPATH_AUTH_STATE__;
    var isAuthed = !!(state && state.mode === "authenticated");
    if (signIn) signIn.style.display = isAuthed ? "none" : "";
    if (account) account.style.display = isAuthed ? "none" : "";
    function openAuthFromMobile(mode, e) {
      if (e && typeof e.preventDefault === "function") e.preventDefault();
      if (typeof window.casepathGoAuth === "function") {
        window.casepathGoAuth(mode, { intent: "auth", source: "mobile-nav" });
      } else if (typeof window.openAuth === "function") {
        window.openAuth(mode);
      } else {
        var fallback = mode === "signin" ? "/index.html?auth=signin" : "/signup/";
        if (window.CasePathAuth && window.CasePathAuth.redirect && typeof window.CasePathAuth.redirect.safeAssignHref === "function") {
          window.CasePathAuth.redirect.safeAssignHref(fallback);
        } else {
          window.location.href = fallback;
        }
      }
      closeMenu();
    }
    if (signIn && !signIn.dataset.cpAuthBound) {
      signIn.dataset.cpAuthBound = "1";
      signIn.addEventListener("click", function (e) {
        openAuthFromMobile("signin", e);
      });
    }
    if (account && !account.dataset.cpAuthBound) {
      account.dataset.cpAuthBound = "1";
      account.addEventListener("click", function (e) {
        var current = window.__CASEPATH_AUTH_STATE__;
        var authedNow = !!(current && current.mode === "authenticated");
        if (authedNow) return;
        openAuthFromMobile("signup", e);
      });
    }
    if (isAuthed && account) {
      account.textContent = "Account";
      account.href = "/your-case.html";
      account.style.display = "";
      account.classList.remove("nav-mobile-auth-account");
    }
  }

  window.syncMobileAuthLinks = syncMobileAuthLinks;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncMobileAuthLinks);
  } else {
    syncMobileAuthLinks();
  }
})();

(function casepathHeaderDebug() {
  function firstTopContent() {
    var selectors = [
      "main > .page > .cp-page-hero",
      "main > .page > .hero",
      "main > .page > .hero-section",
      "main > .cp-page-hero",
      "main > .hero",
      "main > .hero-section",
      "main > .page",
      ".cp-page-hero",
      ".hero",
      ".hero-section"
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function updateHeaderDebug() {
    var body = document.body;
    if (!body || typeof window.getComputedStyle !== "function") return;

    var bodyStyles = window.getComputedStyle(body);
    var hero = firstTopContent();
    var nav = document.querySelector("header.header .nav-top-row.header-inner");
    var announcement = document.querySelector(".nav-green-bar");

    window.__CASEPATH_HEADER_DEBUG__ = {
      bodyMarginTop: bodyStyles.marginTop,
      bodyPaddingTop: bodyStyles.paddingTop,
      heroOffset: hero ? Math.round(hero.getBoundingClientRect().top) : null,
      navHeight: nav ? Math.round(nav.getBoundingClientRect().height) : null,
      announcementHeight: announcement ? Math.round(announcement.getBoundingClientRect().height) : null
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateHeaderDebug, { once: true });
  } else {
    updateHeaderDebug();
  }

  window.addEventListener("load", updateHeaderDebug, { once: true });
  window.addEventListener("resize", updateHeaderDebug, { passive: true });
})();

(function loadCasepathAccountGateForStaticPages() {
  try {
    var path = String(window.location.pathname || "/").toLowerCase().replace(/\/+$/, "");
    if (!path || path === "/" || path === "/index.html") return;
    try {
      if (window.CasePathRouteAccess && typeof window.CasePathRouteAccess.isPublicRoute === "function") {
        if (window.CasePathRouteAccess.isPublicRoute({ path: path })) {
          return;
        }
      }
    } catch (_eRouteAccess) {}
    try {
      if (
        window.CasePathProtectedRoutes &&
        typeof window.CasePathProtectedRoutes.isPublicRoute === "function"
      ) {
        if (
          window.CasePathProtectedRoutes.isPublicRoute({ path: path }) ||
          (typeof window.CasePathProtectedRoutes.isExcludedRoute === "function" &&
            window.CasePathProtectedRoutes.isExcludedRoute({ path: path }))
        ) {
          return;
        }
      }
    } catch (_eClassify) {}
    var publicPaths = {
      "/mission": true,
      "/mission.html": true,
      "/glossary": true,
      "/glossary.html": true,
      "/mental-health": true,
      "/mental-health.html": true,
      "/kids": true,
      "/kids.html": true,
      "/your-team": true,
      "/your-team.html": true,
      "/avo-centre": true,
      "/avo-centre.html": true,
      "/protection-orders": true,
      "/protection-orders.html": true,
      "/self-represented-guide": true,
      "/self-represented-guide.html": true,
      "/court-day-preparation": true,
      "/court-day-preparation.html": true,
      "/prepare": true,
      "/prepare.html": true,
      "/support-tools": true,
      "/support-tools.html": true,
      "/checklists": true,
      "/checklists.html": true,
      "/pricing": true,
      "/pricing.html": true,
      "/contact": true,
      "/contact.html": true,
      "/referrals": true,
      "/referrals.html": true,
      "/privacy": true,
      "/privacy.html": true,
      "/your-data": true,
      "/your-data.html": true,
      "/terms": true,
      "/terms.html": true,
      "/ai-use-disclosure": true,
      "/ai-use-disclosure.html": true,
      "/share": true,
      "/share.html": true,
      "/self-exclusion": true,
      "/self-exclusion.html": true,
    };
    if (publicPaths[path]) return;
    if (document.querySelector('script[src*="casepath-nav-access.js"]')) return;

    function appendScript(src, onload, attrs) {
      var needle = src.split("?")[0];
      if (document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]')) {
        if (typeof onload === "function") onload();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          s.setAttribute(k, attrs[k]);
        });
      }
      s.onload = function () {
        if (typeof onload === "function") onload();
      };
      (document.body || document.documentElement).appendChild(s);
    }

    appendScript(
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.4/dist/umd/supabase.js",
      function () {
        appendScript("/assets/js/supabase.js", function () {
          appendScript("/auth/redirect.js?v=20260727iosscroll1", function () {
            appendScript("/assets/js/core/casepath-routes.js?v=20260727iosscroll1", function () {
              appendScript("/assets/js/casepath-route-access.js?v=20260727iosscroll1", function () {
                appendScript("/assets/js/core/casepath-access.js?v=20260727iosscroll1", function () {
                  appendScript("/assets/js/core/casepath-nav-auth.js?v=20260727iosscroll1", function () {
                    appendScript("/assets/js/casepath-static-auth-host.js?v=20260727iosscroll1", function () {
                      appendScript("/assets/js/casepath-nav-access.js?v=20260727iosscroll1");
                    });
                  });
                });
              });
            });
          });
        });
      },
      {
        integrity: "sha384-7SfFUrg31wOnGWBLLniKFCNmCSguYA5wI1WPDOt7kP/mom4R9/0pwghVEnv0uwYP",
        crossorigin: "anonymous",
      }
    );
  } catch (eGateLoad) {}
})();

(function loadCasepathFooterLegal() {
  if (document.querySelector('script[src*="casepath-footer-legal.js"]')) return;
  var s = document.createElement("script");
  s.src = "/assets/js/public/casepath-footer-legal.js?v=20260727iosscroll1";
  s.defer = true;
  (document.body || document.documentElement).appendChild(s);
})();

(function loadHeaderAccountChrome() {
  function loadChrome() {
    if (document.querySelector('script[src*="header-account-chrome.js"]')) return;
    var s = document.createElement("script");
    s.src = "/assets/js/header-account-chrome.js?v=20260727iosscroll1";
    s.defer = true;
    (document.body || document.documentElement).appendChild(s);
  }
  if (document.querySelector('script[src*="casepath-nav-auth-state.js"]')) {
    if (!document.querySelector('script[src*="casepath-page-auth-cta.js"]')) {
      var pc = document.createElement("script");
      pc.src = "/assets/js/core/casepath-page-auth-cta.js?v=20260727iosscroll1";
      pc.async = false;
      (document.head || document.documentElement).appendChild(pc);
    }
    loadChrome();
    return;
  }
  if (document.querySelector('script[src*="casepath-nav-auth.js"]')) {
    var ns = document.createElement("script");
    ns.src = "/assets/js/core/casepath-nav-auth-state.js?v=20260727iosscroll1";
    ns.async = false;
    ns.onload = loadChrome;
    ns.onerror = loadChrome;
    (document.head || document.documentElement).appendChild(ns);
    return;
  }
  loadChrome();
})();

(function loadCasepathMobileNav() {
  if (document.querySelector('script[src*="casepath-mobile-nav.js"]')) return;
  var s = document.createElement("script");
  s.src = "/assets/js/core/casepath-mobile-nav.js?v=20260727iosscroll1";
  s.defer = true;
  (document.body || document.documentElement).appendChild(s);
})();

(function loadCasepathMobileDebug() {
  try {
    var q = new URLSearchParams(window.location.search || "");
    var on = q.get("mobiledebug") === "1";
    if (!on) {
      try {
        on = localStorage.getItem("casepath_mobile_debug") === "1";
      } catch (_e) {}
    }
    var h = window.location.hostname || "";
    var local = h === "localhost" || h === "127.0.0.1" || /^192\.168\./.test(h) || /^10\./.test(h);
    if (!on || !local) return;
    if (document.querySelector('script[src*="casepath-mobile-debug.js"]')) return;
    var s = document.createElement("script");
    s.src = "/assets/js/core/casepath-mobile-debug.js?v=20260727iosscroll1";
    s.defer = true;
    (document.body || document.documentElement).appendChild(s);
  } catch (_e2) {}
})();

(function loadCasepathQuickExitChain() {
  if (document.querySelector('script[src*="casepath-quick-exit.js"]')) return;

  var V =
    (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";

  function appendScript(src, onload) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = function () {
      if (typeof onload === "function") onload();
    };
    (document.body || document.documentElement).appendChild(s);
  }

  if (!document.querySelector('script[src*="casepath-asset-version.js"]')) {
    appendScript("/assets/js/core/casepath-asset-version.js?v=" + V, function () {
      if (!document.querySelector('script[src*="casepath-cache-guard.js"]')) {
        appendScript("/assets/js/core/casepath-cache-guard.js?v=" + V, function () {
          appendScript("/assets/js/core/casepath-quick-exit.js?v=" + V);
        });
        return;
      }
      appendScript("/assets/js/core/casepath-quick-exit.js?v=" + V);
    });
    return;
  }

  if (!document.querySelector('script[src*="casepath-cache-guard.js"]')) {
    appendScript("/assets/js/core/casepath-cache-guard.js?v=" + V, function () {
      appendScript("/assets/js/core/casepath-quick-exit.js?v=" + V);
    });
    return;
  }

  appendScript("/assets/js/core/casepath-quick-exit.js?v=" + V);
})();

(function loadCasepathFloatingAsk() {
  if (document.getElementById("cr-bot-trigger")) return;
  var V =
    (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";

  function appendScript(src, onload) {
    var needle = src.split("?")[0];
    if (document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]')) {
      if (typeof onload === "function") onload();
      return;
    }
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = function () {
      if (typeof onload === "function") onload();
    };
    (document.body || document.documentElement).appendChild(s);
  }

  function isFloatingAskCssApplied() {
    if (
      document.querySelector('link[href*="casepath-floating-ask.css"]') ||
      document.querySelector('link[href*="ask-question-bot.css"]')
    ) {
      return true;
    }
    var probe = document.createElement("a");
    probe.className = "cp-floating-ask";
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "visibility:hidden;pointer-events:none;";
    (document.body || document.documentElement).appendChild(probe);
    var position = getComputedStyle(probe).position;
    probe.remove();
    return position === "fixed";
  }

  function ensureFloatingAskCss(onload) {
    if (isFloatingAskCssApplied()) {
      if (typeof onload === "function") onload();
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/casepath-floating-ask.css?v=" + V;
    link.onload = function () {
      if (typeof onload === "function") onload();
    };
    link.onerror = function () {
      if (typeof onload === "function") onload();
    };
    (document.head || document.documentElement).appendChild(link);
  }

  ensureFloatingAskCss(function () {
    appendScript("/assets/js/core/casepath-compass-icon.js?v=" + V, function () {
      appendScript("/assets/js/core/casepath-floating-ask.js?v=" + V);
    });
  });
})();

(function loadCasepathFeedback() {
  var V =
    (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";

  function appendScript(src, onload) {
    var needle = src.split("?")[0];
    if (document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]')) {
      if (typeof onload === "function") onload();
      return;
    }
    var s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = function () {
      if (typeof onload === "function") onload();
    };
    (document.body || document.documentElement).appendChild(s);
  }

  function ensureFeedbackCss(onload) {
    if (document.querySelector('link[href*="casepath-feedback.css"]')) {
      if (typeof onload === "function") onload();
      return;
    }
    var probe = document.createElement("button");
    probe.className = "cp-floating-feedback";
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "visibility:hidden;pointer-events:none;";
    (document.body || document.documentElement).appendChild(probe);
    var position = getComputedStyle(probe).position;
    probe.remove();
    if (position === "fixed") {
      if (typeof onload === "function") onload();
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/casepath-feedback.css?v=" + V;
    link.onload = function () {
      if (typeof onload === "function") onload();
    };
    link.onerror = function () {
      if (typeof onload === "function") onload();
    };
    (document.head || document.documentElement).appendChild(link);
  }

  ensureFeedbackCss(function () {
    appendScript("/assets/js/core/casepath-feedback.js?v=" + V);
  });
})();

/* Mockup nav learn dropdown + nav-primary.css disabled — stable two-row baseline (see /assets/css/v2/). */

(function loadCasepathNavDropdowns() {
  if (!document.getElementById("nav-learn-toggle")) return;
  if (document.querySelector('script[src*="casepath-nav-dropdowns.js"]')) return;
  var s = document.createElement("script");
  s.src = "/assets/js/core/casepath-nav-dropdowns.js?v=20260727iosscroll1";
  s.defer = true;
  (document.body || document.documentElement).appendChild(s);
})();

(function loadEducationalPublications() {
  function isEducationalResource() {
    var body = document.body;
    if (!body) return false;
    var flag = body.getAttribute("data-educational-resource");
    if (flag === "false") return false;
    if (flag === "true") return true;
    var family = body.getAttribute("data-template-family") || "";
    if (family === "protected-app-preview" && !body.classList.contains("mediation-prep-page")) return false;
    if (body.classList.contains("ec-tool-page")) return true;
    if (body.classList.contains("mediation-prep-page")) return true;
    if (body.classList.contains("ft-tool-page")) return false;
    var path = (location.pathname || "").toLowerCase();
    if (/document-centre|document-preparation|format-affidavit|format-parenting-orders|format-court-application/.test(path)) return false;
    if (/^\/(pricing|referrals|lawyer-portal|revenue-model|terms|privacy|contact|share|refund-policy)(\/|\.html|$)/.test(path)) return false;
    if (body.classList.contains("ec-tool-page")) return true;
    if (body.classList.contains("mediation-prep-page")) return true;
    if (family === "utility-search" || family === "public-editorial") return true;
    return false;
  }

  if (!isEducationalResource()) return;
  if (document.querySelector('script[src*="publication-generator.js"]')) return;

  var V = "20260715edupub1";
  var scripts = [
    "/assets/js/educational-publications/publication-core.js",
    "/assets/js/educational-publications/publication-template.js",
    "/assets/js/educational-publications/content-extractors.js",
    "/assets/js/educational-publications/publication-generator.js",
  ];

  function loadScript(index) {
    if (index >= scripts.length) return;
    if (document.querySelector('script[src*="' + scripts[index].split("/").pop() + '"]')) {
      loadScript(index + 1);
      return;
    }
    var js = document.createElement("script");
    js.src = scripts[index] + "?v=" + V;
    js.defer = true;
    js.onload = function () {
      loadScript(index + 1);
    };
    (document.body || document.documentElement).appendChild(js);
  }

  loadScript(0);
})();
