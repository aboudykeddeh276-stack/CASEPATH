(function () {
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest("#navSignOutBtn");
    if (!t) return;
    if (typeof window.casepathNavSignOutClick === "function") {
      window.casepathNavSignOutClick(ev);
      return;
    }
    if (ev.preventDefault) ev.preventDefault();
    void (async function () {
      try {
        if (typeof window.signOutFromSupabaseAndSync === "function") {
          await window.signOutFromSupabaseAndSync();
          return;
        }
      } catch (err) {
        console.warn("CasePath: sign out (full sync) failed", err);
      }
      try {
        safeRemove("cr_user");
        safeRemove("courtready_user");
        safeSet("cr_signed_in", "0");
      } catch (e) {}
      if (
        window.casepathAuthFlow &&
        typeof window.casepathAuthFlow.signoutFlow === "function"
      ) {
        try {
          await window.casepathAuthFlow.signoutFlow();
        } catch (e2) {}
      } else if (typeof window.logout === "function") {
        try {
          await window.logout();
        } catch (e2) {}
      }
      try {
        if (typeof window.updateNav === "function") window.updateNav();
        if (typeof window.updateGates === "function") window.updateGates();
      } catch (e3) {}
      try {
        if (typeof window.updateAuthUI === "function") {
          await window.updateAuthUI();
        } else {
          var guest = document.getElementById("nav-guest-actions");
          var so = document.getElementById("navSignOutBtn");
          if (guest && so) {
            guest.style.display = "flex";
            so.style.display = "none";
          }
        }
      } catch (e3b) {}
      if (typeof window.casepathNavigateAfterSignOut === "function") {
        window.casepathNavigateAfterSignOut();
        return;
      }
      var isMainSpa =
        typeof window.showPage === "function" &&
        typeof document !== "undefined" &&
        document.getElementById &&
        document.getElementById("page-home");
      if (isMainSpa) {
        try {
          window.showPage("home");
        } catch (e4) {}
        window.location.reload();
        return;
      }
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        window.CasePathAuth.redirect.safeAssignHref("/index.html");
      } else {
        window.location.href = "/index.html";
      }
    })();
  });

  function safeSet(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  function navAuthed() {
    if (typeof window.casepathWorkspaceAuthed === "function") return window.casepathWorkspaceAuthed();
    if (typeof window.casepathNavAuthed === "function") return window.casepathNavAuthed();
    return false;
  }

  function goToPage(page) {
    if (page === "kids") {
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        if (window.CasePathAuth.redirect.safeAssignHref("/kids.html")) return;
      }
      window.location.href = "/kids.html";
      return;
    }
    if (page === "mission") {
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        if (window.CasePathAuth.redirect.safeAssignHref("/mission.html")) return;
      }
      window.location.href = "/mission.html";
      return;
    }
    if (page === "pricing") {
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        if (window.CasePathAuth.redirect.safeAssignHref("/pricing.html")) return;
      }
      window.location.href = "/pricing.html";
      return;
    }
    if (page === "glossary") {
      var gHref =
        window.CasePathRoutes && typeof window.CasePathRoutes.url === "function"
          ? window.CasePathRoutes.url("glossary")
          : "/glossary.html";
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        if (window.CasePathAuth.redirect.safeAssignHref(gHref)) return;
      }
      window.location.href = gHref;
      return;
    }
    if (page === "mental-health") {
      var mhHref =
        window.CasePathRoutes && typeof window.CasePathRoutes.url === "function"
          ? window.CasePathRoutes.url("mentalHealth")
          : "/mental-health.html";
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        if (window.CasePathAuth.redirect.safeAssignHref(mhHref)) return;
      }
      window.location.href = mhHref;
      return;
    }
    if (typeof window.showPage === "function") {
      window.showPage(page);
      return;
    }
    safeSet("cr_target_page", page);
    if (
      window.CasePathAuth &&
      window.CasePathAuth.redirect &&
      typeof window.CasePathAuth.redirect.safeAssignHref === "function"
    ) {
      window.CasePathAuth.redirect.safeAssignHref("/index.html");
    } else {
      window.location.href = "/index.html";
    }
  }

  var WORKSPACE_PAGES = {
    vault: true,
    "doc-helper": true,
    "ai-assistant": true,
  };

  function bindNavLink(id, page) {
    if (window.__CASEPATH_NAV_ACCESS_INIT__) return;
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function (ev) {
      if (typeof window.casepathIsPublicLowerNavId === "function" && window.casepathIsPublicLowerNavId(id)) {
        return;
      }
      if (!WORKSPACE_PAGES[page]) return;
      if (navAuthed()) return;
      ev.preventDefault();
      void (async function () {
        var ok =
          typeof window.casepathResolveNavAuthed === "function"
            ? await window.casepathResolveNavAuthed()
            : false;
        if (ok) {
          goToPage(page);
          return;
        }
        var feat =
          typeof window.casepathNavFeatureFromId === "function"
            ? window.casepathNavFeatureFromId(id)
            : null;
        try {
          var href = el.getAttribute("href");
          if (href) sessionStorage.setItem("cr_after_auth_url", href);
        } catch (eStoreReturn) {}
        if (typeof window.casepathShowAccountRequiredModal === "function") {
          window.casepathShowAccountRequiredModal(feat);
        }
      })();
    });
  }

  function bindAuthLink(id, mode) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function (ev) {
      if (typeof window.casepathGoAuth === "function") {
        ev.preventDefault();
        window.casepathGoAuth(mode, { intent: "auth", source: "nav-link-fallback" });
        return;
      }
      if (typeof window.openAuth === "function") {
        ev.preventDefault();
        window.openAuth(mode);
        return;
      }
      ev.preventDefault();
      safeSet("cr_auth_action", mode);
      if (
        window.CasePathAuth &&
        window.CasePathAuth.redirect &&
        typeof window.CasePathAuth.redirect.safeAssignHref === "function"
      ) {
        window.CasePathAuth.redirect.safeAssignHref("/index.html");
      } else {
        window.location.href = "/index.html";
      }
    });
  }

  function applyPendingActions() {
    var target = safeGet("cr_target_page");
    if (target) {
      if (typeof window.showPage === "function") {
        window.showPage(target);
        safeRemove("cr_target_page");
      } else {
        setTimeout(applyPendingActions, 250);
      }
    }

    var auth = safeGet("cr_auth_action");
    if (auth) {
      if (typeof window.openAuth === "function") {
        window.openAuth(auth);
        safeRemove("cr_auth_action");
      } else {
        setTimeout(applyPendingActions, 250);
      }
    }
  }

  function applyHeaderAuthVisibility() {
    if (typeof window.casepathRenderNavAuthState === "function") {
      void window.casepathRenderNavAuthState({ source: "nav-link-fallback" });
      return;
    }
    if (typeof window.updateAuthUI === "function") {
      void window.updateAuthUI();
      return;
    }
    if (typeof window.casepathUpdateHeaderAccountStatus === "function") {
      window.casepathUpdateHeaderAccountStatus();
      return;
    }
    var guest = document.getElementById("nav-guest-actions");
    var so = document.getElementById("navSignOutBtn");
    if (!guest || !so) return;
    var signedIn = navAuthed();
    if (signedIn) {
      guest.style.display = "none";
      so.style.display = "inline-flex";
    } else {
      guest.style.display = "flex";
      so.style.display = "none";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindNavLink("nav-your-case-pulse", "vault");
    bindNavLink("nav-doc-helper", "doc-helper");
    bindNavLink("nav-ai-assistant", "qa");

    bindAuthLink("nav-signin-btn", "signin");
    bindAuthLink("nav-signup-btn", "signup");

    void (async function () {
      try {
        if (typeof window.casepathResolveNavAuthed === "function") {
          await window.casepathResolveNavAuthed();
        } else if (typeof window.syncUser === "function") {
          await window.syncUser();
        }
      } catch (e) {}
      var pathPage =
        typeof window.resolvePageFromPathname === "function"
          ? window.resolvePageFromPathname(window.location.pathname)
          : "home";
      if (pathPage && pathPage !== "home") {
        if (typeof window.initCasepathRoutesFromUrl === "function") window.initCasepathRoutesFromUrl();
      } else {
        applyPendingActions();
      }
      applyHeaderAuthVisibility();
    })();

    document.addEventListener("casepath:access-ready", applyHeaderAuthVisibility);

    window.addEventListener("storage", function (ev) {
      if (!ev) return;
      if (ev.key === "cr_signed_in" || ev.key === "cr_has_account") {
        applyHeaderAuthVisibility();
      }
    });
    setTimeout(applyHeaderAuthVisibility, 400);
  });
})();

