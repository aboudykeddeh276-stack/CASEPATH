/**
 * Central lazy-load orchestration for homepage performance program.
 * Provides ensure* loaders for third-party and route-scoped modules.
 */
(function (w) {
  "use strict";
  if (!w || w.__CASEPATH_PERF_LOADERS_INIT__) return;
  w.__CASEPATH_PERF_LOADERS_INIT__ = true;

  var V =
    (typeof w.__CASEPATH_ASSET_VERSION__ === "string" && w.__CASEPATH_ASSET_VERSION__.trim()) ||
    (typeof w.__casepathDynShellV === "string" && String(w.__casepathDynShellV).trim()) ||
    "20260607mobile1";

  var locks = {};

  function scriptPresent(src) {
    try {
      var needle = String(src || "").split("?")[0];
      return !!document.querySelector("script[src*='" + needle.replace(/'/g, "") + "']");
    } catch (e0) {
      return false;
    }
  }

  function injectScript(src, attrs) {
    attrs = attrs || {};
    if (scriptPresent(src)) return Promise.resolve();
    var key = String(src).split("?")[0];
    if (locks[key]) return locks[key];
    locks[key] = new Promise(function (resolve, reject) {
      try {
        var s = document.createElement("script");
        s.src = src;
        s.async = false;
        if (attrs.integrity) {
          s.integrity = attrs.integrity;
          s.crossOrigin = attrs.crossOrigin || "anonymous";
        }
        if (attrs.id) s.id = attrs.id;
        s.onload = function () {
          resolve();
        };
        s.onerror = function () {
          delete locks[key];
          reject(new Error("Failed to load " + src));
        };
        (document.head || document.documentElement).appendChild(s);
      } catch (e1) {
        delete locks[key];
        reject(e1);
      }
    });
    return locks[key];
  }

  function injectStylesheet(href, media) {
    if (document.querySelector('link[href*="' + href.split("?")[0].replace(/"/g, "") + '"]')) {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      if (media) l.media = media;
      l.onload = function () {
        resolve();
      };
      l.onerror = function () {
        reject(new Error("Failed to load " + href));
      };
      document.head.appendChild(l);
    });
  }

  function runScriptChain(urls) {
    var i = 0;
    return new Promise(function resolveChain(resolve, reject) {
      function next() {
        if (i >= urls.length) {
          resolve();
          return;
        }
        injectScript(urls[i++]).then(next, reject);
      }
      next();
    });
  }

  var docCentrePromise = null;

  function loadDocumentCentreModules() {
    if (docCentrePromise) return docCentrePromise;
    docCentrePromise = runScriptChain([
      "/assets/js/documents/form-assistant-routes.js?v=" + V,
      "/assets/js/modules/preparation-worksheets.js?v=" + V,
      "/assets/js/documents/formatting-tools-core.js?v=" + V,
      "/assets/js/documents/form-assistant-bridge.js?v=" + V,
    ]).catch(function (err) {
      docCentrePromise = null;
      throw err;
    });
    return docCentrePromise;
  }

  var stripePromise = null;

  function ensureStripeLoaded() {
    if (w.Stripe && typeof w.Stripe === "function") return Promise.resolve();
    if (stripePromise) return stripePromise;
    stripePromise = injectScript("https://js.stripe.com/v3/").catch(function (err) {
      stripePromise = null;
      throw err;
    });
    return stripePromise;
  }

  var jszipPromise = null;

  function ensureJSZipLoaded() {
    if (w.JSZip) return Promise.resolve();
    if (jszipPromise) return jszipPromise;
    jszipPromise = injectScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      {
        integrity: "sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG",
        crossOrigin: "anonymous",
      }
    ).catch(function (err) {
      jszipPromise = null;
      throw err;
    });
    return jszipPromise;
  }

  var argon2Promise = null;

  function ensureArgon2Loaded() {
    if (w.argon2 && typeof w.argon2.hash === "function") {
      return Promise.resolve();
    }
    if (w.__casepathArgon2Ready) return w.__casepathArgon2Ready;
    if (argon2Promise) return argon2Promise;
    argon2Promise = injectScript(
      "https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/dist/argon2-bundled.min.js?v=" +
        encodeURIComponent(V),
      {
        integrity: "sha384-XOR3aNvHciLPIf6r+2glkrmbBbLmIJ1EChMXjw8eBKBf8gE0rDq1TyUNuRdorOqi",
        crossOrigin: "anonymous",
      }
    )
      .then(function () {
        w.__casepathArgon2Ready = Promise.resolve();
      })
      .catch(function (err) {
        argon2Promise = null;
        throw err;
      });
    return argon2Promise;
  }

  var supabasePromise = null;

  function ensureSupabaseLoaded() {
    if (w.supabaseClient || w.casepathSupabase) return Promise.resolve();
    if (supabasePromise) return supabasePromise;
    supabasePromise = runScriptChain([
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.4/dist/umd/supabase.js",
      "/assets/js/supabase.js?v=" + V,
    ]).catch(function (err) {
      supabasePromise = null;
      throw err;
    });
    return supabasePromise;
  }

  var botAssetsPromise = null;

  function loadBotAssets() {
    if (botAssetsPromise) return botAssetsPromise;
    botAssetsPromise = Promise.resolve()
      .then(function () {
        return injectStylesheet("/assets/css/ask-question-bot.css?v=" + V);
      })
      .then(function () {
        // floating-bot.js depends on bot helpers (botEnsureScrollAffordance,
        // botWireMessageClicks, botGetMessagesBox) defined in home-auth-chrome.js.
        return ensureHomeAuthChrome();
      })
      .then(function () {
        return runScriptChain([
          "/assets/js/core/casepath-external-ai-privacy.js?v=" + V,
          "/assets/js/assistant/ask-question-response.js?v=" + V,
          "/assets/js/assistant/ask-question-guided.js?v=" + V,
          "/assets/js/floating-bot.js?v=" + V,
        ]);
      })
      .catch(function (err) {
        botAssetsPromise = null;
        throw err;
      });
    return botAssetsPromise;
  }

  function openAssistant() {
    return loadBotAssets().then(function () {
      if (typeof w.openBot === "function") {
        w.openBot();
        return;
      }
      if (typeof w.toggleBot === "function") {
        w.toggleBot(true);
        return;
      }
      if (typeof w.showPage === "function") {
        w.showPage("qa");
      }
    });
  }

  var appModulePromises = {};

  function ensureBillingLoaded() {
    if (appModulePromises.billing) return appModulePromises.billing;
    appModulePromises.billing = runScriptChain([
      "/assets/js/account/entitlements-state.js?v=" + V,
      "/assets/js/core/casepath-access.js?v=" + V,
      "/assets/js/account/billing-smoke-log.js?v=" + V,
      "/assets/js/account/billing-checkout-lane.js?v=" + V,
      "/assets/js/pricing-faq.js?v=" + V,
    ]).catch(function (err) {
      delete appModulePromises.billing;
      throw err;
    });
    return appModulePromises.billing;
  }

  function ensureAppModule(name) {
    var key = String(name || "").trim();
    if (!key) return Promise.resolve();
    if (appModulePromises[key]) return appModulePromises[key];
    var fileMap = {
      workspace: "/assets/js/app-workspace.js?v=" + V,
      documents: "/assets/js/app-documents.js?v=" + V,
      assistant: "/assets/js/app-assistant.js?v=" + V,
      checklists: "/assets/js/app-checklists.js?v=" + V,
    };
    var src = fileMap[key];
    if (!src) return Promise.resolve();
    appModulePromises[key] = injectScript(src).catch(function (err) {
      delete appModulePromises[key];
      throw err;
    });
    return appModulePromises[key];
  }

  function scheduleIdleSessionCheck() {
    function runCheck() {
      try {
        if (w.casepathIsAuthenticatedSync && w.casepathIsAuthenticatedSync() === true) {
          void ensureSupabaseLoaded();
          return;
        }
        var signedFlag = false;
        try {
          signedFlag = localStorage.getItem("cr_signed_in") === "1";
        } catch (eLs) {}
        if (signedFlag) void ensureSupabaseLoaded();
      } catch (e0) {}
    }
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(runCheck, { timeout: 4000 });
    } else {
      setTimeout(runCheck, 2000);
    }
  }

  var homeAuthChromePromise = null;

  function ensureHomeAuthChrome() {
    if (scriptPresent("/assets/js/home-auth-chrome.js")) return Promise.resolve();
    if (homeAuthChromePromise) return homeAuthChromePromise;
    homeAuthChromePromise = runScriptChain([
      "/assets/js/core/casepath-external-ai-privacy.js?v=" + V,
      "/assets/js/home-auth-chrome.js?v=" + V,
    ]).catch(function (err) {
      homeAuthChromePromise = null;
      throw err;
    });
    return homeAuthChromePromise;
  }

  var docHelperPanelPromise = null;

  function ensureDocHelperPanel() {
    if (scriptPresent("/assets/js/doc-helper-panel.js")) return Promise.resolve();
    if (docHelperPanelPromise) return docHelperPanelPromise;
    docHelperPanelPromise = injectScript("/assets/js/doc-helper-panel.js?v=" + V).catch(function (err) {
      docHelperPanelPromise = null;
      throw err;
    });
    return docHelperPanelPromise;
  }

  var docExportOoxmlPromise = null;

  function ensureDocExportOoxml() {
    if (scriptPresent("/assets/js/doc-export-ooxml.js")) return Promise.resolve();
    if (docExportOoxmlPromise) return docExportOoxmlPromise;
    docExportOoxmlPromise = Promise.resolve()
      .then(function () {
        return ensureJSZipLoaded();
      })
      .then(function () {
        return injectScript("/assets/js/doc-export-ooxml.js?v=" + V);
      })
      .catch(function (err) {
        docExportOoxmlPromise = null;
        throw err;
      });
    return docExportOoxmlPromise;
  }

  var CASE_PROFILE_UI_SRC = "/assets/js/case-profile-ui.js?v=" + V;
  var CASE_PROFILE_SERVICE_CHAIN = [
    "/assets/js/jurisdiction/casepath-jurisdiction.js?v=" + V,
    "/assets/js/jurisdiction/au-pack.js?v=" + V,
    "/assets/js/case-profile-storage-adapter.js?v=" + V,
    "/assets/js/case-profile-v2.js?v=" + V,
    "/assets/js/case-profile-service.js?v=" + V,
    "/assets/js/case-profile-hydration.js?v=" + V,
    "/assets/js/case-profile-matter-loader.js?v=" + V,
  ];

  var caseProfilePromise = null;

  function caseProfileUIAlreadyPresent() {
    return w.CaseProfileUI || scriptPresent("/assets/js/case-profile-ui.js");
  }

  function caseProfileServiceStackPresent() {
    return w.CaseProfileService || scriptPresent("/assets/js/case-profile-service.js");
  }

  function refreshCaseProfileUI() {
    if (w.CaseProfileUI && typeof w.CaseProfileUI.refresh === "function") {
      w.CaseProfileUI.refresh();
    }
  }

  function loadCaseProfileUI() {
    if (caseProfileUIAlreadyPresent()) {
      refreshCaseProfileUI();
      return Promise.resolve();
    }
    return injectScript(CASE_PROFILE_UI_SRC).then(function () {
      refreshCaseProfileUI();
    });
  }

  function ensureCaseProfileRuntime() {
    if (caseProfileUIAlreadyPresent()) {
      refreshCaseProfileUI();
      return Promise.resolve();
    }
    if (caseProfileServiceStackPresent()) {
      return loadCaseProfileUI();
    }
    if (caseProfilePromise) return caseProfilePromise;
    caseProfilePromise = runScriptChain(CASE_PROFILE_SERVICE_CHAIN)
      .then(loadCaseProfileUI)
      .catch(function (err) {
        caseProfilePromise = null;
        throw err;
      });
    return caseProfilePromise;
  }

  function isAuthenticatedForCaseProfile() {
    try {
      if (w.casepathIsAuthenticatedSync && w.casepathIsAuthenticatedSync() === true) return true;
    } catch (e0) {}
    try {
      if (localStorage.getItem("cr_signed_in") === "1") return true;
    } catch (e1) {}
    try {
      if (w.__CASEPATH_AUTH_STATE__ && w.__CASEPATH_AUTH_STATE__.authenticated === true) return true;
    } catch (e2) {}
    return false;
  }

  function isCaseProfileSurface(pageId) {
    var id = String(pageId || "").trim();
    if (id === "vault" || id === "your-case" || id === "start-case" || id === "profile") return true;
    try {
      var navKey = String(document.body.getAttribute("data-casepath-active-nav") || "").trim();
      if (navKey === "case" || navKey === "vault") return true;
    } catch (eNav) {}
    try {
      var path = String(w.location.pathname || "").toLowerCase();
      if (
        path.indexOf("/your-case") !== -1 ||
        path.indexOf("/app/workspace") !== -1 ||
        path.indexOf("/app/calendar") !== -1
      ) {
        return true;
      }
    } catch (ePath) {}
    try {
      var surface = String(w.__CASEPATH_SHELL_SURFACE__ || w.__CASEPATH_ENTRY_SURFACE__ || "").trim();
      if (surface === "app-workspace" || surface === "app-calendar") return true;
    } catch (eSurf) {}
    return false;
  }

  function shouldLoadCaseProfileRuntime(pageId) {
    if (!isAuthenticatedForCaseProfile()) return false;
    return isCaseProfileSurface(pageId);
  }

  w.CasePathPerformanceLoaders = {
    loadDocumentCentreModules: loadDocumentCentreModules,
    ensureStripeLoaded: ensureStripeLoaded,
    ensureJSZipLoaded: ensureJSZipLoaded,
    ensureArgon2Loaded: ensureArgon2Loaded,
    ensureSupabaseLoaded: ensureSupabaseLoaded,
    loadBotAssets: loadBotAssets,
    openAssistant: openAssistant,
    ensureAppModule: ensureAppModule,
    ensureBillingLoaded: ensureBillingLoaded,
    scheduleIdleSessionCheck: scheduleIdleSessionCheck,
    ensureHomeAuthChrome: ensureHomeAuthChrome,
    ensureDocHelperPanel: ensureDocHelperPanel,
    ensureDocExportOoxml: ensureDocExportOoxml,
    ensureCaseProfileRuntime: ensureCaseProfileRuntime,
    shouldLoadCaseProfileRuntime: shouldLoadCaseProfileRuntime,
    isCaseProfileSurface: isCaseProfileSurface,
  };

  w.ensureBillingLoaded = ensureBillingLoaded;

  w.loadDocumentCentreModules = loadDocumentCentreModules;
  w.ensureStripeLoaded = ensureStripeLoaded;
  w.ensureJSZipLoaded = ensureJSZipLoaded;
  w.ensureArgon2Loaded = ensureArgon2Loaded;
  w.ensureSupabaseLoaded = ensureSupabaseLoaded;
  w.loadBotAssets = loadBotAssets;
  w.openAssistant = openAssistant;
  w.ensureHomeAuthChrome = ensureHomeAuthChrome;
  w.ensureDocHelperPanel = ensureDocHelperPanel;
  w.ensureDocExportOoxml = ensureDocExportOoxml;
  w.ensureCaseProfileRuntime = ensureCaseProfileRuntime;
  w.shouldLoadCaseProfileRuntime = shouldLoadCaseProfileRuntime;

  scheduleIdleSessionCheck();
})(typeof window !== "undefined" ? window : undefined);
