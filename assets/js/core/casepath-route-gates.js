/**
 * Phase 17 — route-gated homepage scripts.
 * Defers home-auth-chrome, doc-helper-panel, doc-export-ooxml, and case-profile
 * until auth interaction, document routes, export, or authenticated profile surfaces.
 */
(function (w, d) {
  "use strict";
  if (!w || w.__CASEPATH_ROUTE_GATES_INIT__) return;
  w.__CASEPATH_ROUTE_GATES_INIT__ = true;

  function perf() {
    return w.CasePathPerformanceLoaders || {};
  }

  function ensureHomeAuthChrome() {
    var fn = perf().ensureHomeAuthChrome || w.ensureHomeAuthChrome;
    return typeof fn === "function" ? fn() : Promise.resolve();
  }

  function ensureDocHelperPanel() {
    var fn = perf().ensureDocHelperPanel || w.ensureDocHelperPanel;
    return typeof fn === "function" ? fn() : Promise.resolve();
  }

  function ensureDocExportOoxml() {
    var fn = perf().ensureDocExportOoxml || w.ensureDocExportOoxml;
    return typeof fn === "function" ? fn() : Promise.resolve();
  }

  function ensureCaseProfileRuntime() {
    var fn = perf().ensureCaseProfileRuntime || w.ensureCaseProfileRuntime;
    return typeof fn === "function" ? fn() : Promise.resolve();
  }

  function shouldLoadCaseProfile(pageId) {
    var fn = perf().shouldLoadCaseProfileRuntime || w.shouldLoadCaseProfileRuntime;
    return typeof fn === "function" ? fn(pageId) : false;
  }

  function activeSpaPageId() {
    try {
      var active = d.querySelector(".page.active");
      return active && active.id ? String(active.id).replace(/^page-/, "") : "";
    } catch (e0) {
      return "";
    }
  }

  function evaluateCaseProfile(trigger, pageId) {
    var id = pageId != null ? String(pageId).trim() : activeSpaPageId();
    if (!shouldLoadCaseProfile(id)) return Promise.resolve();
    return ensureCaseProfileRuntime();
  }

  function evaluateDocumentRoute(trigger, pageId) {
    var id = String(pageId || "").trim();
    if (id !== "doc-helper" && id !== "document-centre") return Promise.resolve();
    return ensureDocHelperPanel();
  }

  var AUTH_INTERACTION_SELECTOR =
    "[data-auth],[data-auth-mode],#nav-signin-btn,#nav-signup-btn,#navSignOutBtn,#nav-user-area,.header-account-zone,[onclick*=\"openAuth('signin')\"],[onclick*=\"openAuth('signup')\"],[onclick*='openAuth(\"signin\")'],[onclick*='openAuth(\"signup\")'],[onclick*=\"closeBot_openAuth\"]";

  function onAuthInteraction() {
    void ensureHomeAuthChrome();
  }

  function wireAuthInteractionGate() {
    d.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || typeof t.closest !== "function") return;
        if (t.closest(AUTH_INTERACTION_SELECTOR)) onAuthInteraction();
      },
      true
    );
    d.addEventListener(
      "keydown",
      function (ev) {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        var t = ev.target;
        if (!t || typeof t.closest !== "function") return;
        if (t.closest(AUTH_INTERACTION_SELECTOR)) onAuthInteraction();
      },
      true
    );
  }

  function scheduleSignedInAccountChrome() {
    function run() {
      try {
        var signed = false;
        if (w.casepathIsAuthenticatedSync && w.casepathIsAuthenticatedSync() === true) signed = true;
        if (!signed) {
          try {
            signed = localStorage.getItem("cr_signed_in") === "1";
          } catch (eLs) {}
        }
        if (!signed) {
          try {
            signed = w.__CASEPATH_AUTH_STATE__ && w.__CASEPATH_AUTH_STATE__.authenticated === true;
          } catch (eSt) {}
        }
        if (signed) void ensureHomeAuthChrome();
      } catch (e0) {}
    }
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 5000 });
    } else {
      setTimeout(run, 3000);
    }
  }

  function installOpenAuthGate() {
    var gatedOpenAuth = function (panel) {
      return ensureHomeAuthChrome().then(function () {
        var fn = w.openAuth;
        if (typeof fn === "function" && fn !== gatedOpenAuth) {
          return fn(panel);
        }
        if (w.CasePathAuth && typeof w.CasePathAuth.openLogin === "function" && panel === "signin") {
          return w.CasePathAuth.openLogin({ source: "route-gate-openAuth" });
        }
        if (w.CasePathAuth && typeof w.CasePathAuth.openSignup === "function" && panel === "signup") {
          return w.CasePathAuth.openSignup({ source: "route-gate-openAuth" });
        }
      });
    };
    if (typeof w.openAuth !== "function") w.openAuth = gatedOpenAuth;
  }

  function installDocHelperStubs() {
    var helperNames = ["openDocHelper", "openHelper"];
    helperNames.forEach(function (name) {
      var stub = function () {
        var args = arguments;
        return ensureDocHelperPanel().then(function () {
          var fn = w[name];
          if (typeof fn === "function" && fn !== stub) {
            return fn.apply(w, args);
          }
        });
      };
      if (typeof w[name] !== "function") w[name] = stub;
    });

    d.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || typeof t.closest !== "function") return;
        if (t.closest("[onclick*='openDocHelper'],[onclick*=\"openHelper(\"]")) {
          void ensureDocHelperPanel();
        }
      },
      true
    );
  }

  function installExportStubs() {
    var exportNames = ["buildAffidavit", "buildDoc", "printAffidavit"];
    exportNames.forEach(function (name) {
      var stub = function () {
        var args = arguments;
        return ensureDocExportOoxml().then(function () {
          var fn = w[name];
          if (typeof fn === "function" && fn !== stub) {
            return fn.apply(w, args);
          }
        });
      };
      if (typeof w[name] !== "function") w[name] = stub;
    });

    d.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || typeof t.closest !== "function") return;
        if (
          t.closest(
            "#dh-docx-btn,[onclick*='buildAffidavit'],[onclick*='buildDoc'],[onclick*='printAffidavit']"
          )
        ) {
          void ensureDocExportOoxml();
        }
      },
      true
    );

    var downloadStub = function () {
      var args = arguments;
      return ensureDocExportOoxml()
        .then(function () {
          return ensureDocHelperPanel();
        })
        .then(function () {
          var fn = w.downloadDocx;
          if (typeof fn === "function" && fn !== downloadStub) {
            return fn.apply(w, args);
          }
        });
    };
    if (typeof w.downloadDocx !== "function") w.downloadDocx = downloadStub;
  }

  function bindPageListeners() {
    d.addEventListener("casepath:page", function (ev) {
      try {
        var detail = ev && ev.detail ? ev.detail : {};
        var id = detail.id != null ? String(detail.id) : "";
        void evaluateDocumentRoute("casepath:page", id);
        void evaluateCaseProfile("casepath:page", id);
      } catch (e0) {}
    });
  }

  function hydrateEntrySurfaces() {
    try {
      var entry = w.__CASEPATH_ENTRY_SURFACE__;
      if (entry === "app-documents") void ensureDocHelperPanel();
    } catch (e1) {}
    try {
      var raw = new URLSearchParams(w.location.search || "").get("goto");
      var g = raw == null ? "" : String(raw).trim().toLowerCase();
      if (g === "document-centre" || g === "doc-helper") void ensureDocHelperPanel();
      if (g === "qa" || g === "assistant" || g === "ai-assistant") {
        void ensureHomeAuthChrome().then(function () {
          if (typeof w.casepathApplyGotoToken === "function") {
            w.casepathApplyGotoToken(g, { skipExternal: true });
          } else if (typeof w.showPage === "function") {
            w.showPage("qa", false);
          }
        });
      }
    } catch (e2) {}
  }

  function boot() {
    wireAuthInteractionGate();
    installOpenAuthGate();
    installDocHelperStubs();
    installExportStubs();
    bindPageListeners();
    scheduleSignedInAccountChrome();
    void evaluateCaseProfile("dom-ready");
    void evaluateDocumentRoute("dom-ready", activeSpaPageId());
    hydrateEntrySurfaces();
  }

  w.CasePathRouteGates = {
    evaluateCaseProfile: evaluateCaseProfile,
    evaluateDocumentRoute: evaluateDocumentRoute,
    ensureHomeAuthChrome: ensureHomeAuthChrome,
    ensureDocHelperPanel: ensureDocHelperPanel,
    ensureDocExportOoxml: ensureDocExportOoxml,
  };

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(typeof window !== "undefined" ? window : undefined, typeof document !== "undefined" ? document : null);
