/**
 * Minimal auth surface for public homepage — session hints, route gates, lazy stacks.
 */
(function (w) {
  "use strict";
  if (!w || w.__CASEPATH_AUTH_CORE_INIT__) return;
  w.__CASEPATH_AUTH_CORE_INIT__ = true;

  var V =
    (typeof w.__CASEPATH_ASSET_VERSION__ === "string" && w.__CASEPATH_ASSET_VERSION__.trim()) ||
    "20260607mobile1";

  var uiPromise = null;
  var signupPromise = null;
  var mfaPromise = null;

  function perf() {
    return w.CasePathPerformanceLoaders || {};
  }

  function ensureSupabase() {
    var p = perf().ensureSupabaseLoaded;
    return typeof p === "function" ? p() : Promise.resolve();
  }

  function loadAuthUi() {
    if (uiPromise) return uiPromise;
    uiPromise = ensureSupabase()
      .then(function () {
        return new Promise(function (resolve, reject) {
          var urls = [
            "/assets/js/core/casepath-auth-runtime.js?v=" + V,
            "/assets/js/core/casepath-auth-modal.js?v=" + V,
            "/assets/js/core/casepath-auth-entry.js?v=" + V,
            "/assets/js/auth-turnstile.js?v=" + V,
            "/assets/js/auth-register-captcha.js?v=" + V,
            "/auth/rate-limit.js?v=" + V,
            "/auth/auth.js?v=" + V,
            "/auth/session.js?v=" + V,
            "/auth/routeGuard.js?v=" + V,
            "/assets/js/core/casepath-auth-assertions.js?v=" + V,
            "/assets/js/core/casepath-auth-flow.js?v=" + V,
            "/assets/js/core/casepath-auth-invariants.js?v=" + V,
            "/assets/js/auth.js?v=" + V,
            "/assets/js/auth-password-policy.js?v=" + V,
            "/assets/js/header-account-chrome.js?v=" + V,
            "/auth/mfa-policy.js?v=" + V,
            "/auth/mfa-foundation.js?v=" + V,
            "/assets/js/core/casepath-mfa-ui.js?v=" + V,
          ];
          var i = 0;
          function next() {
            if (i >= urls.length) {
              resolve();
              return;
            }
            var src = urls[i++];
            var needle = src.split("?")[0];
            var existing = document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]');
            if (existing) {
              next();
              return;
            }
            var s = document.createElement("script");
            s.src = src;
            s.async = false;
            s.onload = next;
            s.onerror = function () {
              reject(new Error("auth-ui load failed: " + src));
            };
            (document.head || document.documentElement).appendChild(s);
          }
          next();
        });
      })
      .catch(function (err) {
        uiPromise = null;
        throw err;
      });
    return uiPromise;
  }

  function loadAuthSignup() {
    return loadAuthUi().then(function () {
      if (signupPromise) return signupPromise;
      signupPromise = Promise.resolve();
      return signupPromise;
    });
  }

  function loadAuthMfa() {
    return loadAuthUi().then(function () {
      if (mfaPromise) return mfaPromise;
      mfaPromise = new Promise(function (resolve, reject) {
        var urls = [
          "/auth/mfa-policy.js?v=" + V,
          "/auth/mfa-foundation.js?v=" + V,
          "/assets/js/core/casepath-mfa-ui.js?v=" + V,
        ];
        var i = 0;
        function next() {
          if (i >= urls.length) {
            resolve();
            return;
          }
          var src = urls[i++];
          var needle = src.split("?")[0];
          if (document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]')) {
            next();
            return;
          }
          var s = document.createElement("script");
          s.src = src;
          s.async = false;
          s.onload = next;
          s.onerror = function () {
            mfaPromise = null;
            reject(new Error("auth-mfa load failed: " + src));
          };
          (document.head || document.documentElement).appendChild(s);
        }
        if (!document.getElementById("casepath-account-security-css")) {
          var link = document.createElement("link");
          link.id = "casepath-account-security-css";
          link.rel = "stylesheet";
          link.href = "/assets/css/casepath-account-security.css?v=" + V;
          (document.head || document.documentElement).appendChild(link);
        }
        next();
      });
      return mfaPromise;
    });
  }

  w.CasePathAuthCore = {
    loadAuthUi: loadAuthUi,
    loadAuthSignup: loadAuthSignup,
    loadAuthMfa: loadAuthMfa,
    ensureSupabase: ensureSupabase,
  };

  function wireAuthTriggers() {
    document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || typeof t.closest !== "function") return;
        var signin = t.closest(
          '[data-auth-mode="signin"], [data-auth-submit="signin"], [onclick*="switchAuth(\'signin\'"]'
        );
        var signup = t.closest(
          '[data-auth-mode="signup"], [data-auth-submit="signup"], [onclick*="switchAuth(\'signup\'"]'
        );
        if (signin) void loadAuthUi();
        if (signup) void loadAuthSignup();
      },
      true
    );

    if (w.CasePathAuth && typeof w.CasePathAuth.openLogin === "function") {
      var origLogin = w.CasePathAuth.openLogin;
      w.CasePathAuth.openLogin = function (opts) {
        return loadAuthUi().then(function () {
          return origLogin.call(w.CasePathAuth, opts);
        });
      };
    }
    if (w.CasePathAuth && typeof w.CasePathAuth.openSignup === "function") {
      var origSignup = w.CasePathAuth.openSignup;
      w.CasePathAuth.openSignup = function (opts) {
        return loadAuthSignup().then(function () {
          return origSignup.call(w.CasePathAuth, opts);
        });
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAuthTriggers);
  } else {
    wireAuthTriggers();
  }

  var routeTriggers = ["workspace", "your-case", "document-centre", "doc-helper", "billing", "pricing"];
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var href = String(a.getAttribute("href") || "").toLowerCase();
    if (!href) return;
    var needsSupabase = routeTriggers.some(function (token) {
      return href.indexOf(token) !== -1;
    });
    if (needsSupabase) void ensureSupabase();
  });
})(typeof window !== "undefined" ? window : undefined);
