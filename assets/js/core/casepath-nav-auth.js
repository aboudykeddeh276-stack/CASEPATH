/**

 * Canonical workspace auth (Supabase session + currentUser mirror).

 * Do not gate workspace nav on localStorage cr_signed_in / cr_user alone.

 */

(function (w) {

  "use strict";

  if (!w || typeof w !== "object") return;



  var sessionCache = { known: false, authed: false, at: 0 };

  var CACHE_MS = 45000;

  var AUTH_SCRIPT_V = "20260607mobile1";



  var WORKSPACE_NAV_IDS = {

    "nav-your-case-pulse": "vault",

    "nav-calendar": "calendar",

    "nav-doc-helper": "documents",

    "nav-doc-prepare": "documents",

    "nav-ai-assistant": "assistant",

    "nav-mediation": "mediation",

    "nav-checklists": "checklists",

    "nav-parenting-orders": "parenting-orders",

    "nav-lawyer-portal": "lawyerPortal",

  };



  var PUBLIC_LOWER_NAV_IDS = {
    "nav-mission": true,
    "nav-glossary": true,
    "nav-mental-health": true,
    "nav-kids": true,
    "nav-prepare-hub": true,
    "nav-court-documents": true,
    "nav-more-tools": true,
    "nav-trusted-partners": true,
    "nav-court-day": true,
    "nav-checklists": true,
    "nav-self-represented-guide": true,
    "nav-avo": true,
    "nav-new-item": true,
    "nav-pricing": true,
    "nav-ai-assistant": true,
  };



  var WORKSPACE_FEATURES = {

    vault: true,

    assistant: true,

    ai_assistant: true,

    documents: true,

    document_builder: true,

    "doc-helper": true,

    mediation: true,

  };



  function passwordRecoveryActive() {

    try {

      return !!w.__crPasswordRecoveryActive;

    } catch (e) {

      return false;

    }

  }



  function authDebugEnabled() {

    try {

      if (w.__CASEPATH_AUTH_DEBUG__ === true) return true;

      if (w.__CASEPATH_AUTH_DEBUG__ === false) return false;

    } catch (e0) {}

    try {

      return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(w.location.hostname || "");

    } catch (e1) {

      return false;

    }

  }



  function setAuthPendingAttr(on) {

    try {

      if (document.documentElement) {

        if (on) document.documentElement.setAttribute("data-casepath-auth-pending", "true");

        else document.documentElement.removeAttribute("data-casepath-auth-pending");

      }

    } catch (eP) {}

  }



  function sessionPresentSync() {

    try {

      if (

        w.__crAuthHydrated &&

        w.authState &&

        w.authState.isAuthenticated &&

        w.authState.session

      ) {

        return true;

      }

    } catch (e0) {}

    if (sessionCache.known && sessionCache.authed && Date.now() - sessionCache.at < CACHE_MS) {

      return true;

    }

    return false;

  }



  function currentUserWorkspaceReady() {

    try {

      var u = w.currentUser;

      return !!(u && u.loggedIn === true && u.source === "supabase" && u.id);

    } catch (e) {

      return false;

    }

  }



  function mirrorCurrentUserFromAuthState() {

    try {

      if (currentUserWorkspaceReady()) return;

      var u = w.authState && w.authState.user;

      var s = w.authState && w.authState.session;

      if (!u || !s) return;

      var meta = u.user_metadata || {};

      w.currentUser = {

        id: u.id,

        email: u.email,

        loggedIn: true,

        source: "supabase",

        emailVerified: !!(u.email_confirmed_at || u.new_email_confirmed_at),

        name: meta.full_name || meta.name || (u.email || "").split("@")[0] || "User",

        postcode: meta.postcode != null ? String(meta.postcode).trim() : null,

      };

    } catch (eMir) {}

  }



  function supabaseUserEmail() {

    try {

      if (w.authState && w.authState.user && w.authState.user.email) return w.authState.user.email;

      if (w.currentUser && w.currentUser.email) return w.currentUser.email;

    } catch (eEm) {}

    return null;

  }



  /** Canonical: session + currentUser.source supabase + loggedIn */

  function casepathWorkspaceAuthed() {

    if (passwordRecoveryActive()) return false;

    if (!currentUserWorkspaceReady()) return false;

    return sessionPresentSync();

  }



  function casepathNavAuthed() {

    return casepathWorkspaceAuthed();

  }



  function casepathAuthHydrated() {

    return w.__crAuthHydrated === true;

  }



  /**

   * Sync auth read — only valid after hydration.

   * @returns {boolean|null} true/false when hydrated; null when hydration incomplete.

   */

  function casepathIsAuthenticatedSync() {

    if (!casepathAuthHydrated()) return null;

    if (passwordRecoveryActive()) return false;

    if (casepathWorkspaceAuthed()) return true;

    try {

      if (w.authState && w.authState.isAuthenticated && w.authState.session) return true;

    } catch (eAs) {}

    try {

      if (typeof w.crSupabaseAuthed === "function" && w.crSupabaseAuthed()) return true;

    } catch (eCr) {}

    if (sessionCache.known && sessionCache.authed) return true;

    return false;

  }



  async function casepathIsAuthenticated() {

    await casepathWaitForAuthHydration();

    return casepathIsAuthenticatedSync() === true;

  }



  function logAuthGateCheck(context, result) {

    if (!authDebugEnabled()) return;

    try {

      console.log("[AUTH GATE CHECK]", {

        context: context || "unknown",

        page: w.location ? w.location.pathname + w.location.search + w.location.hash : null,

        hydrated: casepathAuthHydrated(),

        authState: w.authState

          ? {

              isAuthenticated: !!w.authState.isAuthenticated,

              loading: w.authState.loading,

              hasSession: !!(w.authState.session && w.authState.session.access_token),

            }

          : null,

        navAuthed: casepathNavAuthed(),

        supabaseUser: supabaseUserEmail(),

        crSupabaseAuthed:

          typeof w.crSupabaseAuthed === "function" ? !!w.crSupabaseAuthed() : null,

        result: result,

      });

    } catch (eLog) {}

  }



  function warnGateBeforeHydration(context) {

    if (!authDebugEnabled()) return;

    try {

      console.warn("[AUTH ERROR] Gate attempted before auth hydration complete", {

        context: context || "unknown",

        page: w.location && w.location.pathname,

        hydrated: w.__crAuthHydrated,

      });

    } catch (eWarn) {}

  }



  function invalidateNavAuthCache() {

    sessionCache = { known: false, authed: false, at: 0 };

  }



  function appendScriptOnce(src) {

    return new Promise(function (resolve, reject) {

      var needle = src.split("?")[0];

      var existing = document.querySelector('script[src*="' + needle.replace(/"/g, "") + '"]');

      if (existing) {

        if (existing.dataset.cpLoaded === "1") {

          resolve();

          return;

        }

        if (needle.indexOf("/auth/auth.js") !== -1 && w.CasePathAuth) {

          existing.dataset.cpLoaded = "1";

          resolve();

          return;

        }

        if (needle.indexOf("/auth/session.js") !== -1 && w.CasePathAuth && w.CasePathAuth.session) {

          existing.dataset.cpLoaded = "1";

          resolve();

          return;

        }

        existing.addEventListener("load", function () {

          existing.dataset.cpLoaded = "1";

          resolve();

        });

        existing.addEventListener("error", function () {

          reject(new Error("Failed to load " + src));

        });

        return;

      }

      var s = document.createElement("script");

      s.src = src;

      s.async = false;

      s.onload = function () {

        s.dataset.cpLoaded = "1";

        resolve();

      };

      s.onerror = function () {

        reject(new Error("Failed to load " + src));

      };

      (document.head || document.documentElement).appendChild(s);

    });

  }



  async function ensureAuthViewModelScripts() {

    if (w.CasePathAuth && w.CasePathAuth.session && w.authState) return;

    await appendScriptOnce("/auth/auth.js?v=" + AUTH_SCRIPT_V);

    await appendScriptOnce("/auth/session.js?v=" + AUTH_SCRIPT_V);

  }



  async function waitForSupabaseClient(maxAttempts) {

    var attempts = maxAttempts || 80;

    for (var i = 0; i < attempts; i++) {

      try {

        if (typeof w.initSupabaseClient === "function" && w.initSupabaseClient()) return true;

      } catch (eInit) {}

      if (w.supabaseClient && w.supabaseClient.auth) return true;

      await new Promise(function (r) {

        setTimeout(r, 50);

      });

    }

    return !!(w.supabaseClient && w.supabaseClient.auth);

  }



  async function casepathWaitForAuthHydration() {

    if (casepathAuthHydrated()) return true;

    if (w.__casepathAuthHydratePromise) return w.__casepathAuthHydratePromise;



    setAuthPendingAttr(true);

    w.__casepathAuthHydratePromise = (async function () {

      try {

        await waitForSupabaseClient();

        if (typeof w.casepathAwaitAuthCallback === "function") {
          await w.casepathAwaitAuthCallback();
        }

        await ensureAuthViewModelScripts();



        if (w.CasePathAuth && w.CasePathAuth.session && typeof w.CasePathAuth.session.hydrateFromGetSession === "function") {

          await Promise.race([
            w.CasePathAuth.session.hydrateFromGetSession(),
            new Promise(function (resolve) {
              setTimeout(resolve, 8000);
            }),
          ]);
          try {
            if (!w.__crAuthHydrated) w.__crAuthHydrated = true;
          } catch (eHySess) {}

        } else if (w.supabaseClient && w.supabaseClient.auth) {

          try {

            var r = await Promise.race([
              w.supabaseClient.auth.getSession(),
              new Promise(function (resolve) {
                setTimeout(function () {
                  resolve({ data: { session: null }, error: new Error("getSession timeout") });
                }, 8000);
              }),
            ]);

            var has = !!(r && r.data && r.data.session);

            sessionCache = { known: true, authed: has, at: Date.now() };

            if (has && w.CasePathAuth && typeof w.CasePathAuth.applySession === "function") {

              w.CasePathAuth.applySession(r.data.session, "NAV_HYDRATE");

            } else if (!has && w.CasePathAuth && typeof w.CasePathAuth.clearAuthState === "function") {

              w.CasePathAuth.clearAuthState("NAV_HYDRATE_EMPTY");

            }

            w.__crAuthHydrated = true;

          } catch (eSess) {

            sessionCache = { known: true, authed: false, at: Date.now() };

            w.__crAuthHydrated = true;

          }

        } else {

          sessionCache = { known: false, authed: false, at: Date.now() };

          w.__crAuthHydrated = true;

        }



        mirrorCurrentUserFromAuthState();



        if (typeof w.syncUser === "function") {

          try {

            await w.syncUser();

          } catch (eSu) {}

        } else {

          mirrorCurrentUserFromAuthState();

        }



        invalidateNavAuthCache();
        wireStaticAuthStateListener();

        if (typeof w.casepathRenderNavAuthState === "function") {
          w.casepathRenderNavAuthState({ source: "auth-hydration-complete" });
        }

        try {
          if (typeof document !== "undefined" && document.dispatchEvent) {
            document.dispatchEvent(new CustomEvent("casepath:auth-hydrated"));
          }
        } catch (_eAuthEvt) {}
        if (w.CasePathProtectedRoutes && typeof w.CasePathProtectedRoutes.reconcileAuthenticatedAccess === "function") {
          w.CasePathProtectedRoutes.reconcileAuthenticatedAccess("auth-hydration-complete");
        }

        return casepathAuthHydrated();

      } finally {

        setAuthPendingAttr(false);

      }

    })();



    try {

      return await w.__casepathAuthHydratePromise;

    } catch (eHydr) {

      w.__casepathAuthHydratePromise = null;

      try {

        w.__crAuthHydrated = true;

      } catch (eHy) {}

      setAuthPendingAttr(false);

      return false;

    }

  }



  function casepathWhenAuthHydrated(fn) {

    void casepathWaitForAuthHydration().then(function () {

      if (typeof fn === "function") fn();

    });

  }



  function casepathAuthDebugLog(feature, extra) {

    if (!authDebugEnabled()) return;

    var info = extra && typeof extra === "object" ? extra : { reason: extra };

    console.log("[AUTH DEBUG]", {

      feature: feature || info.feature || null,

      reason: info.reason || null,

      hydrated: casepathAuthHydrated(),

      loggedIn: w.currentUser && w.currentUser.loggedIn === true,

      currentUser: w.currentUser

        ? { id: w.currentUser.id, source: w.currentUser.source, loggedIn: w.currentUser.loggedIn }

        : null,

      source: w.currentUser && w.currentUser.source,

      supabaseSession: sessionPresentSync(),

      workspaceAuthed: casepathWorkspaceAuthed(),

      authStateAuthed: w.authState && w.authState.isAuthenticated,

      pathname: w.location && w.location.pathname,

    });

  }



  async function casepathResolveNavAuthed() {

    if (casepathWorkspaceAuthed()) {

      logAuthGateCheck("resolveNavAuthed:workspace", true);

      return true;

    }

    await casepathWaitForAuthHydration();

    var sync = casepathIsAuthenticatedSync();

    if (sync === true) {

      logAuthGateCheck("resolveNavAuthed:hydrated", true);

      return true;

    }

    if (sync === false) {

      logAuthGateCheck("resolveNavAuthed:hydrated", false);

      return false;

    }

    logAuthGateCheck("resolveNavAuthed:unknown", false);

    return false;

  }



  function isWorkspaceFeature(feature) {

    var k = String(feature || "").trim();

    if (!k) return false;

    try {

      if (typeof w.normalizeFeatureKey === "function") {

        k = w.normalizeFeatureKey(k) || k;

      }

    } catch (eNk) {}

    return WORKSPACE_FEATURES[k] === true;

  }



  function workspaceNavId(navId) {

    return WORKSPACE_NAV_IDS[navId] || null;

  }



  function isPublicLowerNavId(navId) {

    return PUBLIC_LOWER_NAV_IDS[navId] === true;

  }



  function featureKeyFromNavId(navId) {

    return workspaceNavId(navId) || null;

  }



  function featureKeyFromPageId(pageId) {
    var id = String(pageId || "").trim();
    if (id === "vault" || id === "case") return "vault";
    if (id === "ai-assistant" || id === "assistant") return "assistant";
    if (id === "doc-helper" || id === "documents") return "documents";
    if (id === "checklists") return "checklists";
    if (id === "calendar") return "calendar";
    if (id === "mediation") return "mediation";
    if (id === "parenting-orders") return "parenting-orders";
    if (id === "lawyer-portal") return "lawyerPortal";
    return null;
  }

  function logAuthSuccessFlow(flow) {
    if (!authDebugEnabled()) return;
    try {
      console.log("[AUTH SUCCESS FLOW]", flow || {});
    } catch (eLog) {}
  }

  function dismissAuthModals() {
    if (typeof w.casepathAuthModalClose === "function") {
      try {
        w.casepathAuthModalClose({ reason: "dismissAuthModals", skipFieldRestore: true, force: true });
      } catch (eClose) {}
    } else if (typeof w.closeAuth === "function") {
      try {
        w.closeAuth();
      } catch (eClose) {}
    }
    var authModal = document.getElementById("auth-modal");
    if (authModal) {
      authModal.classList.remove("show");
      authModal.setAttribute("aria-hidden", "true");
    }
    var soon = document.getElementById("casepath-coming-soon-modal");
    if (soon) {
      soon.classList.remove("show");
      soon.setAttribute("aria-hidden", "true");
    }
    var early = document.getElementById("casepath-early-access-modal");
    if (early) {
      early.classList.remove("show");
      early.setAttribute("aria-hidden", "true");
    }
    try {
      document.documentElement.style.overflow = "";
    } catch (eOv) {}
    if (typeof w.casepathHideComingSoonModal === "function") {
      try {
        w.casepathHideComingSoonModal();
      } catch (eHide) {}
    }
  }

  function consumePostAuthRedirect() {
    try {
      var next = sessionStorage.getItem("cr_after_auth_url");
      if (!next) return false;
      var redir = w.CasePathAuth && w.CasePathAuth.redirect;
      if (
        redir &&
        typeof redir.shouldBlockDocumentCentreToIndex === "function" &&
        redir.shouldBlockDocumentCentreToIndex(next)
      ) {
        sessionStorage.removeItem("cr_after_auth_url");
        if (typeof redir.redirectTrace === "function") {
          redir.redirectTrace(next, "consumePostAuthRedirect:blocked_document_centre_to_index", "skip");
        } else {
          console.warn(
            "REDIRECT TRACE",
            w.location.pathname + w.location.search + w.location.hash,
            next,
            "consumePostAuthRedirect:blocked_document_centre_to_index"
          );
        }
        return false;
      }
      sessionStorage.removeItem("cr_after_auth_url");
      if (redir && typeof redir.sanitiseRelativePath === "function") {
        var safeNext = redir.sanitiseRelativePath(next);
        if (!safeNext) return false;
        if (typeof redir.safe === "function") {
          redir.safe(safeNext);
          return true;
        }
        if (typeof redir.safeAssignHref === "function") {
          return !!redir.safeAssignHref(safeNext);
        }
        if (typeof redir.redirectTrace === "function") {
          redir.redirectTrace(safeNext, "consumePostAuthRedirect", "replace");
        } else {
          console.warn("REDIRECT TRACE", w.location.pathname + w.location.search + w.location.hash, safeNext, "consumePostAuthRedirect");
        }
        w.location.replace(safeNext);
        return true;
      }
      if (next.charAt(0) === "/") {
        if (w.CasePathAuth && w.CasePathAuth.redirect && typeof w.CasePathAuth.redirect.redirectTrace === "function") {
          w.CasePathAuth.redirect.redirectTrace(next, "consumePostAuthRedirect", "href");
        } else {
          console.warn("REDIRECT TRACE", w.location.pathname + w.location.search + w.location.hash, next, "consumePostAuthRedirect");
        }
        w.location.href = next;
        return true;
      }
    } catch (eRedir) {}
    return false;
  }

  function authResultFromLoginData(data) {
    if (!data) return { session: null, user: null };
    var session = data.session || null;
    var user = data.user || (session && session.user) || null;
    return { session: session, user: user };
  }

  function applySessionFromLogin(session, eventName) {
    if (w.CasePathAuth && typeof w.CasePathAuth.applySession === "function") {
      try {
        w.CasePathAuth.applySession(session, eventName || "SIGNED_IN");
        return;
      } catch (eApply) {
        if (authDebugEnabled()) console.warn("[AUTH] applySession failed", eApply);
      }
    }
    try {
      var u = session && session.user ? session.user : null;
      w.authState = w.authState || {};
      w.authState.session = session;
      w.authState.user = u;
      w.authState.isAuthenticated = !!u;
      w.authState.loading = false;
      w.authState.lastEvent = eventName || "SIGNED_IN";
      w.authState.updatedAt = Date.now();
    } catch (eFallback) {}
  }

  function authModalStillOpen() {
    var modal = document.getElementById("auth-modal");
    return !!(modal && modal.classList.contains("show"));
  }

  function markStaticShellAuthedReady() {
    if (document.getElementById("page-home")) return;
    try {
      if (w.CasePathAccess && typeof w.CasePathAccess.markAccessReady === "function") {
        w.CasePathAccess.markAccessReady();
        return;
      }
    } catch (eMr) {}
    try {
      w.casepathAccessReady = true;
      if (document.documentElement) {
        document.documentElement.removeAttribute("data-casepath-access-pending");
      }
      document.dispatchEvent(new CustomEvent("casepath:access-ready"));
    } catch (eEv) {}
  }

  function signinTraceLog(phase, detail) {
    try {
      if (w.casepathAuthFlow && typeof w.casepathAuthFlow.signinLog === "function") {
        w.casepathAuthFlow.signinLog(phase, detail || {});
        return;
      }
      console.log("[SIGNIN]", phase, detail || {});
    } catch (_eLog) {}
  }

  async function resolveAuthSessionFromLogin(authData) {
    var parsed = authResultFromLoginData(authData);
    if (parsed.session && parsed.user) return parsed;
    try {
      if (w.supabaseClient && w.supabaseClient.auth && typeof w.supabaseClient.auth.getSession === "function") {
        var res = await w.supabaseClient.auth.getSession();
        var sess = res && res.data && res.data.session ? res.data.session : null;
        signinTraceLog("session:exists", {
          fromResponse: !!(parsed.session && parsed.user),
          fromGetSession: !!sess,
        });
        if (sess) {
          return {
            session: sess,
            user: parsed.user || sess.user || null,
          };
        }
      }
    } catch (eSess) {
      signinTraceLog("session:exists", { error: eSess && eSess.message, fromResponse: !!(parsed.session && parsed.user) });
    }
    return parsed;
  }

  function casepathCompleteAuthSignInImmediate(session, user, flow) {
    signinTraceLog("listener:start", { source: "complete-sign-in-immediate" });
    applySessionFromLogin(session, "SIGNED_IN");
    try {
      w.__crAuthHydrated = true;
    } catch (eHy) {}
    flow.authHydrated = true;
    sessionCache = { known: true, authed: true, at: Date.now() };
    mirrorCurrentUserFromAuthState();
    invalidateNavAuthCache();
    wireStaticAuthStateListener();
    signinTraceLog("listener:complete", { source: "complete-sign-in-immediate" });

    signinTraceLog("nav:start", { source: "complete-sign-in-immediate" });
    if (typeof w.casepathSetAuthState === "function") {
      w.casepathSetAuthState("authenticated", { source: "complete-sign-in-immediate" });
    }
    if (typeof w.casepathRenderNavAuthState === "function") {
      w.casepathRenderNavAuthState({ source: "complete-sign-in-immediate" });
    }
    if (typeof w.crSetSignedInFlag === "function") {
      try {
        w.crSetSignedInFlag(true);
      } catch (eFlag) {}
    }
    if (typeof w.casepathAuthRuntimeSyncBootstrap === "function") {
      w.casepathAuthRuntimeSyncBootstrap({ activeAuthOperation: null, source: "complete-sign-in-immediate" });
    }
    try {
      if (document.documentElement) {
        document.documentElement.removeAttribute("data-casepath-auth-pending");
      }
    } catch (ePending) {}
    dismissAuthModals();
    flow.modalClosed = !authModalStillOpen();
    signinTraceLog("modal:close", { modalClosed: flow.modalClosed, source: "complete-sign-in-immediate" });
    signinTraceLog("nav:complete", { source: "complete-sign-in-immediate" });
    signinTraceLog("signin:complete", { phase: "immediate" });
  }

  function schedulePostAuthHydration(session, user, options, flow) {
    queueMicrotask(function () {
      void (async function () {
        signinTraceLog("profile:start", { source: "post-auth-hydration" });
        try {
          if (typeof w.syncUser === "function") {
            try {
              await Promise.race([
                w.syncUser(),
                new Promise(function (_, reject) {
                  setTimeout(function () {
                    reject(new Error("syncUser timeout"));
                  }, 10000);
                }),
              ]);
            } catch (eSync) {
              if (authDebugEnabled()) console.warn("[AUTH] syncUser after sign-in", eSync);
            }
            mirrorCurrentUserFromAuthState();
            invalidateNavAuthCache();
          }

          if (typeof w.casepathUpdateHeaderAccountStatus === "function") {
            w.casepathUpdateHeaderAccountStatus();
          }
          if (typeof w.casepathRenderNavAuthState === "function") {
            w.casepathRenderNavAuthState({ source: "complete-sign-in-background" });
          } else if (typeof w.updateAuthUI === "function") {
            try {
              await w.updateAuthUI();
            } catch (eUi) {}
          }
          if (typeof w.casepathApplyStaticNavRolloutBadges === "function") {
            w.casepathApplyStaticNavRolloutBadges();
          }
          markStaticShellAuthedReady();
          try {
            if (w.CasePathEvents && typeof w.CasePathEvents.dispatch === "function") {
              w.CasePathEvents.dispatch("auth-state", { event: "SIGNED_IN", hasSession: true });
            }
          } catch (eEv) {}

          if (typeof w.crFlushPendingPageAfterAuth === "function") {
            try {
              w.crFlushPendingPageAfterAuth();
            } catch (ePending) {}
          }

          if (typeof w.crConsumePostAuthRedirect === "function") {
            flow.redirectTriggered = !!w.crConsumePostAuthRedirect();
          } else {
            flow.redirectTriggered = consumePostAuthRedirect();
          }

          if (!flow.redirectTriggered && options.reloadInPlace !== false) {
            try {
              var pending = sessionStorage.getItem("cr_pending_spa_route");
              if (pending && typeof w.casepathNavigateLiveFeature === "function") {
                w.casepathNavigateLiveFeature(pending);
                flow.redirectTriggered = true;
              }
            } catch (ePend) {}
          }

          if (!flow.redirectTriggered && options.staticReload !== false && !document.getElementById("page-home")) {
            try {
              w.location.reload();
              flow.redirectTriggered = true;
            } catch (eReload) {}
          }
        } catch (eHydr) {
          if (authDebugEnabled()) console.warn("[AUTH] post-auth hydration", eHydr);
        } finally {
          signinTraceLog("profile:complete", { source: "post-auth-hydration" });
          logAuthSuccessFlow(flow);
        }
      })();
    });
  }

  async function casepathCompleteAuthSignIn(authData, opts) {
    var options = opts || {};
    var parsed = await resolveAuthSessionFromLogin(authData);
    var session = parsed.session;
    var user = parsed.user;
    var loginOk = !!(session && user);
    var flow = {
      loginSuccess: loginOk,
      sessionExists: !!session,
      userExists: !!user,
      accessTokenExists: !!(session && session.access_token),
      modalClosed: false,
      authHydrated: false,
      redirectTriggered: false,
      currentPath: w.location ? w.location.pathname + w.location.search + w.location.hash : null,
    };

    if (!loginOk) {
      try {
        if (w.casepathAuthFlow && typeof w.casepathAuthFlow.log === "function") {
          w.casepathAuthFlow.log("post_signup:skipped", { reason: "no-session" });
        }
      } catch (_eSkip) {}
      logAuthSuccessFlow(flow);
      return false;
    }

    try {
      if (w.casepathAuthFlow && typeof w.casepathAuthFlow.log === "function") {
        w.casepathAuthFlow.log("post_signup:start", { hasSession: !!session, hasUser: !!user, blocking: false });
      }
      casepathCompleteAuthSignInImmediate(session, user, flow);
      schedulePostAuthHydration(session, user, options, flow);
    } catch (eComplete) {
      if (authDebugEnabled()) console.warn("[AUTH] casepathCompleteAuthSignIn", eComplete);
      try {
        casepathCompleteAuthSignInImmediate(session, user, flow);
      } catch (eImmediate) {}
    } finally {
      if (loginOk) {
        dismissAuthModals();
        flow.modalClosed = !authModalStillOpen();
      }
    }
    return loginOk;
  }

  function wireStaticAuthStateListener() {
    if (w.__casepathAuthStateListenerWired) return;
    if (!w.supabaseClient || !w.supabaseClient.auth || typeof w.supabaseClient.auth.onAuthStateChange !== "function") {
      return;
    }
    w.__casepathAuthStateListenerWired = true;
    w.supabaseClient.auth.onAuthStateChange(function (event, session) {
      var ev = String(event || "");
      if (session && w.CasePathAuth && typeof w.CasePathAuth.applySession === "function") {
        w.CasePathAuth.applySession(session, event);
      } else if (!session && w.CasePathAuth) {
        if (ev === "SIGNED_OUT" || ev === "USER_DELETED") {
          if (typeof w.CasePathAuth.clearAuthState === "function") {
            w.CasePathAuth.clearAuthState(event);
          }
        } else if (ev === "INITIAL_SESSION" && typeof w.CasePathAuth.applySession === "function") {
          w.CasePathAuth.applySession(null, event);
        }
      }
      try {
        w.__crAuthHydrated = true;
      } catch (eHy) {}
      mirrorCurrentUserFromAuthState();
      invalidateNavAuthCache();
      if (typeof w.casepathRenderNavAuthState === "function") {
        w.casepathRenderNavAuthState({ source: "onAuthStateChange:" + event });
      }
      if (authDebugEnabled()) {
        logAuthSuccessFlow({
          loginSuccess: !!session,
          sessionExists: !!session,
          userExists: !!(session && session.user),
          modalClosed: null,
          authHydrated: true,
          redirectTriggered: null,
          currentPath: w.location ? w.location.pathname + w.location.search : null,
          authEvent: event,
          source: "onAuthStateChange",
        });
      }
    });
  }

  w.casepathWorkspaceAuthed = casepathWorkspaceAuthed;

  w.casepathNavAuthed = casepathNavAuthed;

  w.casepathAuthHydrated = casepathAuthHydrated;

  w.casepathIsAuthenticatedSync = casepathIsAuthenticatedSync;

  w.casepathIsAuthenticated = casepathIsAuthenticated;

  w.casepathWaitForAuthHydration = casepathWaitForAuthHydration;

  w.casepathWhenAuthHydrated = casepathWhenAuthHydrated;

  w.casepathLogAuthGateCheck = logAuthGateCheck;
  w.casepathDismissAuthModals = dismissAuthModals;
  w.casepathCompleteAuthSignIn = casepathCompleteAuthSignIn;
  w.casepathCompleteAuthSignInImmediate = casepathCompleteAuthSignInImmediate;
  w.casepathConsumePostAuthRedirect = consumePostAuthRedirect;
  w.casepathResolveNavAuthed = casepathResolveNavAuthed;

  w.casepathInvalidateNavAuthCache = invalidateNavAuthCache;

  w.casepathAuthDebugLog = casepathAuthDebugLog;

  w.casepathIsWorkspaceFeature = isWorkspaceFeature;

  w.casepathWorkspaceNavIds = WORKSPACE_NAV_IDS;

  w.casepathIsWorkspaceNavId = function (navId) {

    return !!workspaceNavId(navId);

  };

  w.casepathIsPublicLowerNavId = isPublicLowerNavId;

  w.casepathNavFeatureFromId = featureKeyFromNavId;

  w.casepathNavFeatureFromPageId = featureKeyFromPageId;

  var signOutInFlight = false;

  function casepathNavigateAfterSignOut() {
    var target = "/index.html";
    if (w.CasePathAuth && w.CasePathAuth.redirect && typeof w.CasePathAuth.redirect.stableShellPath === "function") {
      target = w.CasePathAuth.redirect.stableShellPath();
    }
    var currentPath = String(w.location && w.location.pathname ? w.location.pathname : "/");
    var targetPath = String(target || "/index.html").split("?")[0];
    var isMainSpa =
      typeof w.showPage === "function" &&
      typeof document !== "undefined" &&
      document.getElementById &&
      document.getElementById("page-home");
    if (isMainSpa) {
      try {
        w.showPage("home");
      } catch (eSp) {}
    }
    if (
      targetPath === currentPath ||
      (currentPath === "/" && (targetPath === "/" || targetPath === "/index.html"))
    ) {
      try {
        w.location.reload();
        return;
      } catch (eReload) {}
    }
    if (w.CasePathAuth && w.CasePathAuth.redirect && typeof w.CasePathAuth.redirect.safeStableShell === "function") {
      w.CasePathAuth.redirect.safeStableShell();
    } else if (w.CasePathAuth && w.CasePathAuth.redirect && typeof w.CasePathAuth.redirect.safe === "function") {
      w.CasePathAuth.redirect.safe("/index.html");
    } else {
      try {
        w.location.replace("/index.html");
      } catch (eNav) {
        try {
          w.location.href = "/index.html";
        } catch (eNav2) {}
      }
    }
  }

  async function casepathPerformSignOut(options) {
    options = options || {};
    if (signOutInFlight && !options.force) {
      return { ok: false, reason: "in_flight" };
    }
    signOutInFlight = true;
    var flow = w.casepathAuthFlow;
    try {
      if (flow && typeof flow.log === "function") {
        flow.log("signout:start", {});
      }
    } catch (eLog) {}

    try {
      try {
        w.__crIntentionalSignOut = true;
      } catch (eI0) {}
      try {
        w.__crPasswordRecoveryActive = false;
      } catch (ePw) {}
      try {
        w.__casepathIdleSigningOut = false;
      } catch (eIdle) {}
      try {
        sessionStorage.removeItem("cr_last_activity_ms");
      } catch (eAct) {}

      await waitForSupabaseClient(40);
      try {
        await ensureAuthViewModelScripts();
      } catch (eScripts) {}

      if (
        w.CasePathAuth &&
        w.CasePathAuth.session &&
        typeof w.CasePathAuth.session.clearPendingRedirects === "function"
      ) {
        w.CasePathAuth.session.clearPendingRedirects();
      }

      try {
        if (flow && typeof flow.log === "function") {
          flow.log("signout:profile-flush", {});
        }
      } catch (eLogFlush) {}
      if (
        w.CaseProfileHydration &&
        typeof w.CaseProfileHydration.flushBeforeSignOut === "function"
      ) {
        try {
          await w.CaseProfileHydration.flushBeforeSignOut();
        } catch (eProfileFlush) {
          console.warn("[AUTH] Case Profile flush before sign-out failed", eProfileFlush);
        }
      } else if (w.CaseProfileService && typeof w.CaseProfileService.syncToRemote === "function") {
        try {
          await w.CaseProfileService.syncToRemote();
        } catch (eProfileFlush2) {
          console.warn("[AUTH] Case Profile sync before sign-out failed", eProfileFlush2);
        }
      }

      try {
        if (flow && typeof flow.signoutFlow === "function") {
          await flow.signoutFlow();
        } else if (typeof w.logout === "function") {
          await w.logout();
        }
      } catch (eSo) {
        console.warn("[AUTH] Supabase sign-out failed", eSo);
      }

      w.currentUser = null;
      if (typeof w.crSetSignedInFlag === "function") {
        try {
          w.crSetSignedInFlag(false);
        } catch (eFlag) {}
      }
      if (w.CasePathAuth && typeof w.CasePathAuth.clearAuthState === "function") {
        w.CasePathAuth.clearAuthState("SIGNED_OUT");
      }
      if (
        w.CasePathAuth &&
        w.CasePathAuth.session &&
        typeof w.CasePathAuth.session.clearVolatileClientCaches === "function"
      ) {
        try {
          w.CasePathAuth.session.clearVolatileClientCaches();
        } catch (eVol) {}
      }
      try {
        if (w.__CASEPATH_AUTH_RECOVERY__ && typeof w.__CASEPATH_AUTH_RECOVERY__.clearAuthState === "function") {
          w.__CASEPATH_AUTH_RECOVERY__.clearAuthState("SIGNED_OUT");
        }
      } catch (eRecClear) {}
      try {
        dismissAuthModals();
      } catch (eDismiss) {}
      try {
        if (w.__CASEPATH_AUTH_RECOVERY__ && typeof w.__CASEPATH_AUTH_RECOVERY__.resetCaptchaWidgets === "function") {
          w.__CASEPATH_AUTH_RECOVERY__.resetCaptchaWidgets();
        } else if (typeof w.resetTurnstile === "function") {
          w.resetTurnstile();
        }
      } catch (eResetCaptcha) {}
      try {
        if (typeof w.casepathBroadcastAuthLogout === "function") {
          w.casepathBroadcastAuthLogout();
        }
      } catch (eBc) {}
      invalidateNavAuthCache();

      if (typeof w.casepathSetAuthState === "function") {
        w.casepathSetAuthState("guest", { source: "sign-out" });
      }
      if (typeof w.casepathRenderNavAuthState === "function") {
        w.casepathRenderNavAuthState({ source: "sign-out" });
      }

      if (!options.skipUiSync) {
        if (typeof w.updateAuthUI === "function") {
          try {
            await w.updateAuthUI();
          } catch (eUi) {}
        }
        if (typeof w.updateNav === "function") {
          try {
            w.updateNav();
          } catch (eNav) {}
        }
        if (typeof w.updateGates === "function") {
          try {
            w.updateGates();
          } catch (eGate) {}
        } else {
          var guest = document.getElementById("nav-guest-actions");
          var soBtn = document.getElementById("navSignOutBtn");
          if (guest && soBtn) {
            guest.style.display = "flex";
            soBtn.style.display = "none";
          }
        }
      }

      if (!options.skipRedirect) {
        dismissAuthModals();
        casepathNavigateAfterSignOut();
      }

      try {
        if (flow && typeof flow.log === "function") {
          flow.log("signout:complete", {});
        }
      } catch (eLogDone) {}

      return { ok: true };
    } finally {
      signOutInFlight = false;
      try {
        setTimeout(function () {
          try {
            w.__crIntentionalSignOut = false;
          } catch (eI1) {}
        }, 2500);
      } catch (eI2) {}
    }
  }

  function casepathNavSignOutClick(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (ev && ev.stopPropagation) ev.stopPropagation();
    void casepathPerformSignOut({});
  }

  function wireNavSignOutButton() {
    var btn = document.getElementById("navSignOutBtn");
    if (!btn || btn.dataset.casepathSignOutBound === "1") return;
    btn.dataset.casepathSignOutBound = "1";
    btn.addEventListener("click", casepathNavSignOutClick);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wireNavSignOutButton);
    } else {
      wireNavSignOutButton();
    }
    document.addEventListener("casepath:access-ready", wireNavSignOutButton);
  }

  w.casepathPerformSignOut = casepathPerformSignOut;
  w.casepathNavSignOutClick = casepathNavSignOutClick;
  w.casepathNavigateAfterSignOut = casepathNavigateAfterSignOut;

  document.addEventListener("casepath:access-ready", invalidateNavAuthCache);



  try {

    if (w.CasePathEvents && typeof w.CasePathEvents.on === "function") {

      w.CasePathEvents.on("auth", invalidateNavAuthCache);

    }

  } catch (eEv) {}

})(typeof window !== "undefined" ? window : this);

