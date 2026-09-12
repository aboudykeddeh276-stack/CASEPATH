/**
 * Canonical auth runtime bootstrap — single shared readiness promise for all shells.
 * Enable diagnostics: window.__CASEPATH_AUTH_DEBUG__ = true
 */
(function (w) {
  "use strict";
  if (!w || w.__CASEPATH_AUTH_BOOTSTRAP_LOADED__ || w.__CASEPATH_AUTH_BOOTSTRAP_INIT__) return;
  w.__CASEPATH_AUTH_BOOTSTRAP_LOADED__ = true;
  w.__CASEPATH_AUTH_BOOTSTRAP_INIT__ = true;

  try {
    if (!w.__CASEPATH_AUTH_CALLBACK_HREF_CAPTURED__) {
      w.__CASEPATH_AUTH_CALLBACK_HREF_CAPTURED__ = String(w.location.href || "");
    }
  } catch (_eEarlyHref) {}

  try {
    if (!w.__CASEPATH_P0_RECOVERY_DIAG__ && !document.querySelector('script[src*="casepath-p0-recovery-diagnostics.js"]')) {
      var p0Diag = document.createElement("script");
      p0Diag.src = "/assets/js/core/casepath-p0-recovery-diagnostics.js?v=20260727iosscroll1";
      p0Diag.async = false;
      (document.head || document.documentElement).appendChild(p0Diag);
    }
  } catch (_eP0Diag) {}

  var AUTH_BUNDLE_VERSION = "20260727iosscroll1";
  var LOADING_USER_MESSAGE = "Secure sign in is still loading…";
  var VERSION_MISMATCH_MESSAGE =
    "The site was updated. Please refresh the page and try again.";

  var bootstrapState = {
    authReady: false,
    turnstileReady: false,
    supabaseReady: false,
    listenersReady: false,
    hydrationReady: false,
    pendingAuthOps: 0,
    bootstrapErrors: [],
    duplicateLoaders: 0,
    scriptVersions: {},
    versionMismatch: false,
    finalized: false,
    readySucceeded: false,
    surface: "unknown",
  };

  var runtimeLoadPromise = null;
  var duplicateLoaderLogged = false;
  var readyResolve = null;
  var readyReject = null;
  var authReadyPromise = new Promise(function (resolve, reject) {
    readyResolve = resolve;
    readyReject = reject;
  });

  w.__CASEPATH_AUTH_BUNDLE_VERSION__ = AUTH_BUNDLE_VERSION;
  w.__CASEPATH_AUTH_READY__ = authReadyPromise;
  w.__CASEPATH_AUTH_LOADING_MESSAGE__ = LOADING_USER_MESSAGE;

  function authBootstrapDebugEnabled() {
    try {
      if (w.__CASEPATH_AUTH_DEBUG__ === true) return true;
      if (w.__CASEPATH_AUTH_DEBUG__ === false) return false;
    } catch (_e0) {}
    try {
      return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(w.location.hostname || "");
    } catch (_e1) {
      return false;
    }
  }

  function bootstrapLog(phase, detail) {
    try {
      console.log("[AUTH BOOTSTRAP]", phase, detail || "");
    } catch (_e) {}
  }

  function readyLog(phase, detail) {
    try {
      console.log("[AUTH READY]", phase, detail || "");
    } catch (_e) {}
  }

  function captchaTokenReady(mode) {
    mode = mode === "signup" ? "signup" : "signin";
    try {
      if (typeof w.casepathIsCaptchaReady === "function" && w.casepathIsCaptchaReady(mode)) return true;
    } catch (_e0) {}
    try {
      if (typeof w.casepathPeekCaptchaToken === "function") {
        return String(w.casepathPeekCaptchaToken(mode) || "").trim().length >= 20;
      }
    } catch (_e1) {}
    return false;
  }

  function recordBootstrapError(err) {
    var msg = err && err.message ? String(err.message) : String(err || "unknown");
    if (bootstrapState.bootstrapErrors.indexOf(msg) === -1) {
      bootstrapState.bootstrapErrors.push(msg);
    }
    bootstrapLog("error", { message: msg });
  }

  function assetVersion() {
    return (
      (typeof w.__CASEPATH_ASSET_VERSION__ === "string" && w.__CASEPATH_ASSET_VERSION__.trim()) ||
      AUTH_BUNDLE_VERSION
    );
  }

  function collectScriptVersions() {
    bootstrapState.scriptVersions = {
      asset: assetVersion(),
      bootstrap: AUTH_BUNDLE_VERSION,
      flow: w.__CASEPATH_AUTH_BUNDLE_VERSION__ || null,
      flowApi: w.casepathAuthFlow && w.casepathAuthFlow.AUTH_BUNDLE_VERSION ? w.casepathAuthFlow.AUTH_BUNDLE_VERSION : null,
    };
    return bootstrapState.scriptVersions;
  }

  function verifyAuthBundleVersions() {
    collectScriptVersions();
    var expected = AUTH_BUNDLE_VERSION;
    var assetV = bootstrapState.scriptVersions.asset;
    var flowV = bootstrapState.scriptVersions.flow || bootstrapState.scriptVersions.flowApi;
    var mismatch = false;
    if (assetV && assetV !== expected) mismatch = true;
    if (flowV && flowV !== expected) mismatch = true;
    bootstrapState.versionMismatch = mismatch;
    if (mismatch) {
      recordBootstrapError(VERSION_MISMATCH_MESSAGE);
      bootstrapLog("version-mismatch", bootstrapState.scriptVersions);
    } else {
      bootstrapLog("version-ok", bootstrapState.scriptVersions);
    }
    return !mismatch;
  }

  function captchaPolicyMode() {
    try {
      if (typeof w.casepathSupabaseCaptchaPolicy === "function") {
        return w.casepathSupabaseCaptchaPolicy().mode;
      }
    } catch (_e) {}
    if (w.CASEPATH_SUPABASE_AUTH_CAPTCHA === true) return "required";
    if (w.CASEPATH_SUPABASE_AUTH_CAPTCHA === false) return "off";
    return "off";
  }

  function checkSupabaseReady() {
    var client = w.supabaseClient || w.casepathSupabase;
    var ready = !!(client && client.auth && typeof client.auth.signInWithPassword === "function");
    if (ready && !bootstrapState.supabaseReady) readyLog("supabase:ready", {});
    bootstrapState.supabaseReady = ready;
    return ready;
  }

  function checkFlowReady() {
    var flow = w.casepathAuthFlow;
    var ready = !!(
      flow &&
      typeof flow.supabaseSignInWithPassword === "function" &&
      typeof flow.supabaseSignUp === "function" &&
      typeof flow.signinFlow === "function" &&
      typeof flow.signupFlow === "function" &&
      w.__CASEPATH_AUTH_RECOVERY__
    );
    if (ready && !bootstrapState.authReady) readyLog("flow:ready", {});
    bootstrapState.authReady = ready;
    return ready;
  }

  function checkAuthJsReady() {
    return typeof w.login === "function" && typeof w.signup === "function" && typeof w.requestPasswordReset === "function";
  }

  function checkTurnstileReady() {
    if (captchaPolicyMode() !== "required") {
      bootstrapState.turnstileReady = true;
      readyLog("turnstile:ready", { policy: "off" });
      return true;
    }
    if (captchaTokenReady("signin") || captchaTokenReady("signup")) {
      if (!bootstrapState.turnstileReady) readyLog("turnstile:ready", { via: "captcha-token" });
      bootstrapState.turnstileReady = true;
      return true;
    }
    var infraReady =
      typeof w.loadTurnstileOnce === "function" && typeof w.casepathScheduleAuthTurnstileRender === "function";
    var signupValidatorReady = typeof w.casepathValidateSignupCaptchaForSubmit === "function";
    var signinPeekReady = typeof w.casepathPeekCaptchaToken === "function" || typeof w.getTurnstileToken === "function";
    var ready = infraReady && (signupValidatorReady || signinPeekReady);
    if (ready && !bootstrapState.turnstileReady) readyLog("turnstile:ready", { via: "infra" });
    bootstrapState.turnstileReady = ready;
    return ready;
  }

  function checkListenersReady() {
    bootstrapState.listenersReady = !!(
      w.__CASEPATH_AUTH_FLOW_INIT__ &&
      w.casepathAuthFlow &&
      typeof w.casepathAuthFlow.signupFlow === "function"
    );
    return bootstrapState.listenersReady;
  }

  function checkHydrationReady() {
    if (typeof w.casepathIsAuthenticatedSync === "function") {
      var sync = w.casepathIsAuthenticatedSync();
      if (sync === true || sync === false) {
        bootstrapState.hydrationReady = true;
        return true;
      }
    }
    if (w.CasePathAuth && w.CasePathAuth.session && typeof w.CasePathAuth.session.getSession === "function") {
      bootstrapState.hydrationReady = true;
      return true;
    }
    if (typeof w.casepathWaitForAuthHydration !== "function") {
      bootstrapState.hydrationReady = true;
      return true;
    }
    return false;
  }

  function verifyAuthRuntimeComplete() {
    if (bootstrapState.versionMismatch) return false;
    if (!verifyAuthBundleVersions()) return false;
    return (
      checkSupabaseReady() &&
      checkFlowReady() &&
      checkAuthJsReady() &&
      checkTurnstileReady() &&
      checkListenersReady()
    );
  }

  function detectSurface() {
    try {
      if (document.getElementById("page-home")) return "spa";
      if (document.getElementById("auth-modal")) return "modal";
      return "static";
    } catch (_e) {
      return "unknown";
    }
  }

  function setAuthUiLoading(loading) {
    try {
      document.documentElement.classList.toggle("casepath-auth-bootstrapping", !!loading);
    } catch (_e0) {}
    var selectors = [
      '[data-auth-mode="signin"]',
      '[data-auth-mode="signup"]',
      '[data-auth-mode="reset"]',
      '[data-auth-submit="signin"]',
      '[data-auth-submit="signup"]',
      "#auth-signin .btn-full",
      "#signup-submit-btn",
      '[data-casepath-quick-exit="true"]',
      "#nav-quick-exit",
      ".nav-quick-exit",
    ];
    selectors.forEach(function (sel) {
      try {
        document.querySelectorAll(sel).forEach(function (el) {
          if (!el || el.tagName === "A") return;
          if (loading) {
            if (el.dataset.cpAuthBootstrapLocked !== "1") {
              el.dataset.cpAuthBootstrapPrevDisabled = el.disabled ? "1" : "0";
              el.dataset.cpAuthBootstrapLocked = "1";
            }
            el.disabled = true;
            el.setAttribute("aria-busy", "true");
            el.classList.add("casepath-auth-loading");
          } else if (el.dataset.cpAuthBootstrapLocked === "1") {
            el.dataset.cpAuthBootstrapLocked = "0";
            el.removeAttribute("aria-busy");
            el.classList.remove("casepath-auth-loading");
            if (el.dataset.cpAuthBootstrapPrevDisabled !== "1") {
              el.disabled = false;
            }
            if (sel === "#signup-submit-btn" && typeof w.crTermsCheck === "function") {
              w.crTermsCheck();
            }
          }
        });
      } catch (_e1) {}
    });
  }

  function clearAuthBootstrapLoadingUi() {
    setAuthUiLoading(false);
    try {
      if (document.documentElement) {
        document.documentElement.classList.remove("casepath-auth-bootstrapping");
        document.documentElement.removeAttribute("data-casepath-auth-bootstrap-pending");
      }
    } catch (_e0) {}
    ["signin-error", "signup-error"].forEach(function (id) {
      try {
        var el = document.getElementById(id);
        if (!el) return;
        var txt = String(el.textContent || "");
        if (/still loading|secure sign in is still loading/i.test(txt)) {
          el.textContent = "";
          el.style.display = "none";
        }
      } catch (_e1) {}
    });
    try {
      var signinBtn = document.querySelector("#auth-signin .btn-full");
      if (signinBtn && signinBtn.dataset.cpAuthBootstrapLocked === "1") {
        signinBtn.dataset.cpAuthBootstrapLocked = "0";
        signinBtn.removeAttribute("aria-busy");
        signinBtn.classList.remove("casepath-auth-loading");
        if (signinBtn.dataset.cpAuthBootstrapPrevDisabled !== "1") signinBtn.disabled = false;
        if (/signing in|still loading/i.test(signinBtn.textContent || "")) signinBtn.textContent = "Sign In";
      }
    } catch (_e2) {}
  }

  function showAuthBootstrapError(err) {
    var msg = err && err.message ? String(err.message) : String(err || VERSION_MISMATCH_MESSAGE);
    if (/out of date|version|updated/i.test(msg)) msg = VERSION_MISMATCH_MESSAGE;
    try {
      var errEl = document.getElementById("signin-error") || document.getElementById("signup-error");
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = "";
      }
    } catch (_e0) {}
    try {
      var btn = document.querySelector("#auth-signin .btn-full");
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        btn.classList.remove("casepath-auth-loading");
        if (/signing in/i.test(btn.textContent || "")) btn.textContent = "Sign In";
      }
    } catch (_e1) {}
  }

  function failAuthBootstrap(err) {
    recordBootstrapError(err);
    bootstrapState.finalized = true;
    bootstrapState.readySucceeded = false;
    readyLog("runtime:ready:set:false", { message: err && err.message });
    clearAuthBootstrapLoadingUi();
    showAuthBootstrapError(err);
    if (readyReject) {
      readyReject(err instanceof Error ? err : new Error(String(err || LOADING_USER_MESSAGE)));
    }
  }

  function succeedAuthBootstrap() {
    if (bootstrapState.readySucceeded) return;
    readyLog("runtime:ready:set:true", { reason: "succeedAuthBootstrap" });
    bootstrapState.finalized = true;
    bootstrapState.readySucceeded = true;
    bootstrapState.surface = detectSurface();
    bootstrapLog("ready", {
      surface: bootstrapState.surface,
      versions: collectScriptVersions(),
    });
    clearAuthBootstrapLoadingUi();
    installAuthSubmitGuards();
    if (typeof w.casepathAuthRuntimeSyncBootstrap === "function") {
      w.casepathAuthRuntimeSyncBootstrap({
        bootstrapReady: true,
        authReady: bootstrapState.authReady,
        turnstileReady: bootstrapState.turnstileReady,
        source: "succeedAuthBootstrap",
      });
    }
    if (readyResolve) readyResolve(true);
    readyLog("runtime:ready:complete", {
      surface: bootstrapState.surface,
      supabaseReady: bootstrapState.supabaseReady,
      turnstileReady: bootstrapState.turnstileReady,
    });
  }

  function tryFinalizeAuthBootstrap(reason) {
    if (bootstrapState.readySucceeded) return true;
    if (!verifyAuthRuntimeComplete()) {
      return false;
    }
    if (bootstrapState.finalized && !bootstrapState.readySucceeded) {
      readyLog("runtime:ready:recover", { reason: reason || "verify" });
      bootstrapState.bootstrapErrors = [];
    }
    bootstrapLog("finalize", { reason: reason || "verify" });
    succeedAuthBootstrap();
    return true;
  }

  function wrapAuthSubmitHandler(fn, name) {
    if (typeof fn !== "function" || fn._cpAuthBootstrapWrapped) return fn;
    var wrapped = async function () {
      await loadAuthRuntimeOnce();
      casepathAssertAuthRuntimeReady(name || "submit");
      return fn.apply(this, arguments);
    };
    wrapped._cpAuthBootstrapWrapped = true;
    return wrapped;
  }

  var submitGuardPollTimer = null;

  function installAuthSubmitGuards() {
    ["doSignIn", "doSignUp", "doPasswordReset"].forEach(function (name) {
      if (typeof w[name] === "function") {
        w[name] = wrapAuthSubmitHandler(w[name], name);
      }
    });
  }

  function installAuthSubmitGuardPolling() {
    return;
  }

  function waitForHydrationIfNeeded() {
    if (bootstrapState.hydrationReady) return Promise.resolve(true);
    if (typeof w.casepathWaitForAuthHydration !== "function") {
      bootstrapState.hydrationReady = true;
      return Promise.resolve(true);
    }
    return w.casepathWaitForAuthHydration()
      .then(function () {
        bootstrapState.hydrationReady = true;
        return true;
      })
      .catch(function (err) {
        recordBootstrapError(err);
        bootstrapState.hydrationReady = true;
        return true;
      });
  }

  function waitForRuntimeWithPoll(maxMs) {
    var started = Date.now();
    return new Promise(function (resolve, reject) {
      function tick() {
        if (tryFinalizeAuthBootstrap("poll")) {
          resolve(true);
          return;
        }
        if (Date.now() - started >= maxMs) {
          reject(new Error(LOADING_USER_MESSAGE));
          return;
        }
        setTimeout(tick, 50);
      }
      tick();
    });
  }

  function eagerScriptsPresent() {
    return !!(w.__CASEPATH_AUTH_FLOW_INIT__ && typeof w.login === "function");
  }

  function loadStaticAuthHostScript() {
    if (typeof w.__casepathLoadAuthScriptStack === "function") {
      return Promise.resolve(true);
    }
    if (typeof w.casepathEnsureAuthModalReady === "function") {
      return Promise.resolve(true);
    }
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src*="casepath-static-auth-host.js"]')) {
        var waitHost = function (n) {
          if (typeof w.__casepathLoadAuthScriptStack === "function" || typeof w.casepathEnsureAuthModalReady === "function") {
            resolve(true);
            return;
          }
          if (n <= 0) {
            reject(new Error("Auth host loader unavailable"));
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
      s.src = "/assets/js/casepath-static-auth-host.js?v=" + assetVersion();
      s.async = false;
      s.onload = function () {
        resolve(true);
      };
      s.onerror = function () {
        reject(new Error("Failed to load auth host"));
      };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function loadAuthScriptStackInternal() {
    if (typeof w.__casepathLoadAuthScriptStack === "function") {
      return w.__casepathLoadAuthScriptStack();
    }
    return loadStaticAuthHostScript().then(function () {
      if (typeof w.__casepathLoadAuthScriptStack === "function") {
        return w.__casepathLoadAuthScriptStack();
      }
      if (typeof w.casepathEnsureAuthModalReady === "function") {
        return w.casepathEnsureAuthModalReady().then(function () {
          if (w.__casepathAuthScriptStackPromise) return w.__casepathAuthScriptStackPromise;
          return waitForRuntimeWithPoll(30000);
        });
      }
      return Promise.reject(new Error("Auth script loader unavailable"));
    });
  }

  function loadAuthRuntimeOnce() {
    if (bootstrapState.readySucceeded && verifyAuthRuntimeComplete()) {
      return authReadyPromise;
    }
    if (runtimeLoadPromise) {
      bootstrapState.duplicateLoaders += 1;
      // Log at most once per load cycle: concurrent callers (nav hydration,
      // route gate, submit guards) legitimately share the single in-flight
      // promise; logging every caller produced the "duplicate-loader" spam.
      if (authBootstrapDebugEnabled() && !duplicateLoaderLogged) {
        duplicateLoaderLogged = true;
        bootstrapLog("duplicate-loader", { count: bootstrapState.duplicateLoaders, note: "shared in-flight runtime load" });
      }
      return runtimeLoadPromise;
    }
    duplicateLoaderLogged = false;

    readyLog("bootstrap:start", { surface: detectSurface(), eager: eagerScriptsPresent() });
    bootstrapLog("load-start", { surface: detectSurface(), eager: eagerScriptsPresent() });
    setAuthUiLoading(true);

    runtimeLoadPromise = Promise.resolve()
      .then(function () {
        if (!verifyAuthBundleVersions()) {
          throw new Error(VERSION_MISMATCH_MESSAGE);
        }
        if (eagerScriptsPresent()) {
          return waitForRuntimeWithPoll(5000);
        }
        return loadAuthScriptStackInternal();
      })
      .then(function () {
        readyLog("bootstrap:loaded", {});
        return waitForRuntimeWithPoll(30000);
      })
      .then(function () {
        if (!tryFinalizeAuthBootstrap("loadAuthRuntimeOnce")) {
          throw new Error(LOADING_USER_MESSAGE);
        }
        void waitForHydrationIfNeeded();
        return authReadyPromise;
      })
      .catch(function (err) {
        runtimeLoadPromise = null;
        if (verifyAuthRuntimeComplete() && tryFinalizeAuthBootstrap("loadAuthRuntimeOnce-recover")) {
          return authReadyPromise;
        }
        failAuthBootstrap(err);
        throw err instanceof Error ? err : new Error(String(err || LOADING_USER_MESSAGE));
      });

    return runtimeLoadPromise;
  }

  function casepathAuthBootstrapDiagnostics() {
    verifyAuthRuntimeComplete();
    collectScriptVersions();
    return {
      authRuntimeReady: bootstrapState.readySucceeded && verifyAuthRuntimeComplete(),
      authReady: bootstrapState.authReady,
      turnstileReady: bootstrapState.turnstileReady,
      supabaseReady: bootstrapState.supabaseReady,
      listenersReady: bootstrapState.listenersReady,
      hydrationReady: bootstrapState.hydrationReady,
      pendingAuthOps: bootstrapState.pendingAuthOps,
      bootstrapErrors: bootstrapState.bootstrapErrors.slice(),
      duplicateLoaders: bootstrapState.duplicateLoaders,
      scriptVersions: bootstrapState.scriptVersions,
      versionMismatch: bootstrapState.versionMismatch,
      finalized: bootstrapState.finalized,
      readySucceeded: bootstrapState.readySucceeded,
      surface: bootstrapState.surface || detectSurface(),
      captchaPolicy: captchaPolicyMode(),
      runtimeComplete: verifyAuthRuntimeComplete(),
      captchaSolved: captchaTokenReady("signin") || captchaTokenReady("signup"),
      pendingBootstrap: !bootstrapState.readySucceeded && !!runtimeLoadPromise,
      currentAuthVersion: AUTH_BUNDLE_VERSION,
    };
  }

  function casepathAuthReadyDiagnostics() {
    var rt = w.__CASEPATH_AUTH_RUNTIME__ || {};
    var base = casepathAuthBootstrapDiagnostics();
    base.pendingCaptcha = rt.pendingState === "captcha-pending" || false;
    base.runtimePhase = rt.phase || null;
    return base;
  }

  function casepathEnsureAuthRuntimeReady() {
    if (bootstrapState.readySucceeded && verifyAuthRuntimeComplete()) {
      return authReadyPromise;
    }
    return loadAuthRuntimeOnce();
  }

  function casepathAssertAuthRuntimeReady(action) {
    if (tryFinalizeAuthBootstrap(action || "assert")) return true;
    if (bootstrapState.readySucceeded && verifyAuthRuntimeComplete()) return true;
    if (bootstrapState.versionMismatch) {
      throw new Error(VERSION_MISMATCH_MESSAGE);
    }
    throw new Error(LOADING_USER_MESSAGE);
  }

  function casepathNotifyAuthModuleReady(moduleName) {
    bootstrapLog("module-ready", { module: moduleName });
    readyLog("bootstrap:loaded", { module: moduleName });
    tryFinalizeAuthBootstrap(moduleName);
  }

  function casepathTrackAuthOpStart() {
    bootstrapState.pendingAuthOps += 1;
    if (typeof w.casepathAuthRuntimeSyncBootstrap === "function") {
      w.casepathAuthRuntimeSyncBootstrap({ activeAuthOperation: "auth-op", source: "trackAuthOpStart" });
    }
  }

  function casepathTrackAuthOpEnd() {
    bootstrapState.pendingAuthOps = Math.max(0, bootstrapState.pendingAuthOps - 1);
    if (typeof w.casepathAuthRuntimeSyncBootstrap === "function") {
      w.casepathAuthRuntimeSyncBootstrap({
        activeAuthOperation: bootstrapState.pendingAuthOps > 0 ? "auth-op" : null,
        source: "trackAuthOpEnd",
      });
    }
  }

  w.loadAuthRuntimeOnce = loadAuthRuntimeOnce;
  w.casepathEnsureAuthRuntimeReady = casepathEnsureAuthRuntimeReady;
  w.casepathAssertAuthRuntimeReady = casepathAssertAuthRuntimeReady;
  w.casepathAuthBootstrapDiagnostics = casepathAuthBootstrapDiagnostics;
  w.casepathAuthReadyDiagnostics = casepathAuthReadyDiagnostics;
  w.casepathClearAuthBootstrapLoadingUi = clearAuthBootstrapLoadingUi;
  w.casepathNotifyAuthModuleReady = casepathNotifyAuthModuleReady;
  w.casepathTrackAuthOpStart = casepathTrackAuthOpStart;
  w.casepathTrackAuthOpEnd = casepathTrackAuthOpEnd;
  w.casepathSetAuthUiLoading = setAuthUiLoading;
  w.casepathTryFinalizeAuthBootstrap = tryFinalizeAuthBootstrap;
  w.installAuthSubmitGuards = installAuthSubmitGuards;
  w.__casepathAuthBootstrapLoadRuntime = loadAuthRuntimeOnce;

  setAuthUiLoading(false);
  bootstrapLog("init", { version: AUTH_BUNDLE_VERSION });

  /* HOTFIX: lazy auth load only — no page-load script stack preload (was freezing tabs). */

  try {
    if (typeof document !== "undefined" && !document.getElementById("casepath-auth-bootstrap-style")) {
      var styleEl = document.createElement("style");
      styleEl.id = "casepath-auth-bootstrap-style";
      styleEl.textContent =
        ".casepath-auth-loading{opacity:.72;cursor:wait!important}" +
        "html.casepath-auth-bootstrapping [data-auth-mode]{pointer-events:none;opacity:.72}" +
        "#signin-error,#signup-error{margin-top:.65rem;line-height:1.45}" +
        "#signin-error:empty,#signup-error:empty{display:none!important}";
      (document.head || document.documentElement).appendChild(styleEl);
    }
  } catch (_styleErr) {}

  /* HOTFIX: no automatic auth stack preload on DOMContentLoaded. */

  /*
   * Finalize-when-ready poll. The eager-load shells (home, workspace) load the
   * full auth stack via <script> tags, so the runtime can become COMPLETE
   * without any code calling loadAuthRuntimeOnce(). The per-module
   * casepathNotifyAuthModuleReady() finalize attempts all fire BEFORE the
   * Turnstile infra is ready, so the bootstrap would otherwise sit
   * "complete but never finalized" (readySucceeded=false). That stuck state is
   * what made every later loadAuthRuntimeOnce() caller log "duplicate-loader".
   * This poll ONLY finalizes an already-complete runtime — it never loads the
   * script stack, so it respects the no-preload hotfix above.
   */
  function startBootstrapFinalizePoll() {
    if (bootstrapState.readySucceeded) return;
    var started = Date.now();
    var MAX_MS = 30000;
    (function tick() {
      if (bootstrapState.readySucceeded) return;
      if (tryFinalizeAuthBootstrap("boot-finalize-poll")) return;
      if (Date.now() - started >= MAX_MS) return;
      setTimeout(tick, 200);
    })();
  }

  function loadLocalDevAuthBridge() {
    try {
      var h = String((w.location && w.location.hostname) || "")
        .toLowerCase()
        .trim();
      if (h !== "localhost" && h !== "127.0.0.1" && h !== "[::1]" && h !== "::1") return;
      if (w.CasePathProductionInvariant && w.CasePathProductionInvariant.isProductionOrigin && w.CasePathProductionInvariant.isProductionOrigin()) {
        return;
      }
      var v = w.__CASEPATH_ASSET_VERSION__ || AUTH_BUNDLE_VERSION;
      var src = "/assets/js/core/casepath-local-dev-auth-bridge.js?v=" + v;
      if (document.querySelector('script[src*="casepath-local-dev-auth-bridge"]')) return;
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      (document.head || document.documentElement).appendChild(s);
    } catch (_bridgeLoad) {
      /* ignore */
    }
  }

  loadLocalDevAuthBridge();

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startBootstrapFinalizePoll);
    } else {
      startBootstrapFinalizePoll();
    }
  } catch (_finalizePollErr) {
    startBootstrapFinalizePoll();
  }
})(typeof window !== "undefined" ? window : this);
