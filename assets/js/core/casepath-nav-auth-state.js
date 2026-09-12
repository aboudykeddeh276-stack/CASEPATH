/**
 * Canonical navbar auth state — single source of truth for guest vs authenticated nav.
 * Navbar MUST render only from window.__CASEPATH_AUTH_STATE__ via casepathRenderNavAuthState().
 */
(function (w, d) {
  "use strict";
  if (!w || w.__CASEPATH_NAV_AUTH_STATE_INIT__) return;
  w.__CASEPATH_NAV_AUTH_STATE_INIT__ = true;

  var AUTH_STATE = {
    mode: "hydrating",
    authenticated: false,
    hydrated: false,
    userId: null,
    email: null,
    plan: null,
    updatedAt: 0,
    source: null,
  };

  w.__CASEPATH_AUTH_STATE__ = AUTH_STATE;

  function navAuthLog(phase, detail) {
    try {
      if (w.__CASEPATH_AUTH_DEBUG__ === true) {
        console.log("[NAV AUTH STATE]", phase, detail || "");
      }
    } catch (_e) {}
  }

  function readPlanLabel() {
    try {
      if (typeof w.casepathHeaderAccountPlanLabel === "function") {
        var ent =
          typeof w.getCasePathEntitlements === "function"
            ? w.getCasePathEntitlements()
            : w.CasePathEntitlements || {};
        return w.casepathHeaderAccountPlanLabel(ent && ent.plan);
      }
    } catch (_e) {}
    return null;
  }

  function resolveAuthenticated() {
    if (!w.__crAuthHydrated) {
      return null;
    }
    try {
      if (w.authState && w.authState.isAuthenticated && w.authState.session) return true;
    } catch (_e0) {}
    if (typeof w.casepathIsAuthenticatedSync === "function") {
      var sync = w.casepathIsAuthenticatedSync();
      if (sync === true) return true;
      if (sync === false) return false;
    }
    if (typeof w.casepathWorkspaceAuthed === "function" && w.casepathWorkspaceAuthed()) return true;
    try {
      if (typeof w.crSupabaseAuthed === "function" && w.crSupabaseAuthed()) return true;
    } catch (_e1) {}
    return false;
  }

  function casepathSyncAuthState(opts) {
    opts = opts || {};
    var authed = resolveAuthenticated();
    var prev = AUTH_STATE.mode;

    if (authed === null) {
      AUTH_STATE.mode = "hydrating";
      AUTH_STATE.authenticated = false;
      AUTH_STATE.hydrated = false;
    } else if (authed) {
      AUTH_STATE.mode = "authenticated";
      AUTH_STATE.authenticated = true;
      AUTH_STATE.hydrated = true;
    } else {
      AUTH_STATE.mode = "guest";
      AUTH_STATE.authenticated = false;
      AUTH_STATE.hydrated = true;
    }

    try {
      var user = w.authState && w.authState.user ? w.authState.user : w.currentUser;
      AUTH_STATE.userId = user && user.id ? String(user.id) : null;
      AUTH_STATE.email =
        (user && user.email) ||
        (w.authState && w.authState.session && w.authState.session.user && w.authState.session.user.email) ||
        null;
    } catch (_eUser) {
      AUTH_STATE.userId = null;
      AUTH_STATE.email = null;
    }

    AUTH_STATE.plan = readPlanLabel();
    AUTH_STATE.updatedAt = Date.now();
    AUTH_STATE.source = opts.source || null;

    if (prev !== AUTH_STATE.mode) {
      navAuthLog("change", { from: prev, to: AUTH_STATE.mode, source: AUTH_STATE.source });
    }

    return AUTH_STATE;
  }

  function bindSignOutButton(btn) {
    if (!btn || btn.dataset.casepathSignOutBound === "1") return;
    btn.dataset.casepathSignOutBound = "1";
    btn.classList.add("nav-signout-utility");
    btn.setAttribute("aria-label", "Sign out of your account");
    btn.addEventListener("click", function (ev) {
      if (typeof w.casepathNavSignOutClick === "function") {
        w.casepathNavSignOutClick(ev);
        return;
      }
      if (ev && ev.preventDefault) ev.preventDefault();
      if (typeof w.casepathPerformSignOut === "function") {
        void w.casepathPerformSignOut({});
      } else if (typeof w.signOutFromSupabaseAndSync === "function") {
        void w.signOutFromSupabaseAndSync();
      }
    });
  }

  function setElVisible(el, visible, displayValue) {
    if (!el) return;
    if (visible) {
      if (displayValue) el.style.display = displayValue;
      else el.style.removeProperty("display");
      el.setAttribute("aria-hidden", "false");
    } else {
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }
  }

  function casepathRenderNavAuthState(opts) {
    opts = opts || {};
    var state = opts.forceState ? Object.assign({}, AUTH_STATE, opts.forceState) : casepathSyncAuthState(opts);
    var signedIn = state.mode === "authenticated";
    var hydrating = state.mode === "hydrating";

    var guestWrap = d.getElementById("nav-guest-actions");
    var signOutBtn = d.getElementById("navSignOutBtn");
    var signinBtn = d.getElementById("nav-signin-btn");
    var signupBtn = d.getElementById("nav-signup-btn");
    var legacyUser = d.getElementById("nav-user-area");
    var yourCaseNav = d.getElementById("nav-your-case-pulse");
    var authArea = d.getElementById("nav-auth-area");

    if (signedIn) {
      setElVisible(guestWrap, false);
      setElVisible(signOutBtn, true, "inline-flex");
      setElVisible(signinBtn, false);
      setElVisible(signupBtn, false);
      if (signinBtn) {
        signinBtn.style.display = "none";
        signinBtn.setAttribute("hidden", "");
      }
      if (signupBtn) {
        signupBtn.style.display = "none";
        signupBtn.setAttribute("hidden", "");
      }
      if (guestWrap) {
        guestWrap.style.display = "none";
        guestWrap.setAttribute("hidden", "");
      }
      setElVisible(legacyUser, true, "flex");
      setElVisible(yourCaseNav, true, "inline-block");
      bindSignOutButton(signOutBtn);
    } else if (hydrating) {
      setElVisible(guestWrap, false);
      setElVisible(signOutBtn, false);
      setElVisible(signinBtn, false);
      setElVisible(signupBtn, false);
      setElVisible(legacyUser, false);
      setElVisible(yourCaseNav, false);
    } else {
      setElVisible(guestWrap, true, "flex");
      if (guestWrap) guestWrap.removeAttribute("hidden");
      setElVisible(signOutBtn, false);
      setElVisible(signinBtn, true, "inline-flex");
      setElVisible(signupBtn, true, "inline-flex");
      if (signinBtn) signinBtn.removeAttribute("hidden");
      if (signupBtn) signupBtn.removeAttribute("hidden");
      setElVisible(legacyUser, false);
      setElVisible(yourCaseNav, false);
    }

    if (authArea) {
      authArea.classList.toggle("nav-auth-area--signed-in", signedIn);
      authArea.classList.toggle("nav-auth-area--guest", state.mode === "guest");
      authArea.classList.toggle("nav-auth-area--hydrating", hydrating);
    }

    if (d.documentElement) {
      d.documentElement.classList.toggle("casepath-auth-nav-authenticated", signedIn);
      d.documentElement.classList.toggle("casepath-auth-nav-guest", state.mode === "guest");
      d.documentElement.classList.toggle("casepath-auth-nav-hydrating", hydrating);
    }

    if (typeof w.casepathUpdateHeaderAccountStatus === "function") {
      w.casepathUpdateHeaderAccountStatus();
    }
    if (typeof w.casepathApplyStaticNavRolloutBadges === "function") {
      w.casepathApplyStaticNavRolloutBadges();
    }
    if (typeof w.syncMobileAuthLinks === "function") {
      w.syncMobileAuthLinks();
    }
    if (typeof w.casepathRenderPageAuthCta === "function") {
      w.casepathRenderPageAuthCta({
        source: opts.source || "nav-auth-render",
        forceState: state,
      });
    }

    navAuthLog("render", {
      mode: state.mode,
      source: opts.source || state.source,
    });

    return state;
  }

  function casepathSetAuthState(mode, detail) {
    detail = detail || {};
    if (mode === "authenticated") {
      AUTH_STATE.mode = "authenticated";
      AUTH_STATE.authenticated = true;
      AUTH_STATE.hydrated = true;
    } else if (mode === "guest") {
      AUTH_STATE.mode = "guest";
      AUTH_STATE.authenticated = false;
      AUTH_STATE.hydrated = true;
      AUTH_STATE.userId = null;
      AUTH_STATE.email = null;
      AUTH_STATE.plan = null;
    } else {
      AUTH_STATE.mode = "hydrating";
      AUTH_STATE.authenticated = false;
      AUTH_STATE.hydrated = false;
    }
    AUTH_STATE.updatedAt = Date.now();
    AUTH_STATE.source = detail.source || mode;
    return AUTH_STATE;
  }

  function casepathForceGuestNavState(source) {
    casepathSetAuthState("guest", { source: source || "force-guest" });
    return casepathRenderNavAuthState({ source: source || "force-guest", forceState: AUTH_STATE });
  }

  function installUpdateAuthHook() {
    if (w.__cpNavAuthStateHooked) return;
    w.__cpNavAuthStateHooked = true;
    var orig = w.updateAuthUI;
    w.updateAuthUI = async function () {
      var result;
      if (orig && orig !== w.updateAuthUI) {
        try {
          result = await orig.apply(w, arguments);
        } catch (_eOrig) {}
      }
      casepathRenderNavAuthState({ source: "updateAuthUI" });
      return result;
    };
  }

  async function bootNavAuthState() {
    casepathRenderNavAuthState({ source: "boot-pending" });
    try {
      if (typeof w.casepathWaitForAuthHydration === "function") {
        await w.casepathWaitForAuthHydration();
      }
    } catch (_eHydr) {}
    casepathRenderNavAuthState({ source: "boot-ready" });
  }

  w.casepathSyncAuthState = casepathSyncAuthState;
  w.casepathRenderNavAuthState = casepathRenderNavAuthState;
  w.casepathSetAuthState = casepathSetAuthState;
  w.casepathForceGuestNavState = casepathForceGuestNavState;

  installUpdateAuthHook();

  if (d) {
    d.addEventListener("casepath:access-ready", function () {
      casepathRenderNavAuthState({ source: "access-ready" });
    });
    try {
      if (w.CasePathEvents && typeof w.CasePathEvents.on === "function") {
        w.CasePathEvents.on("auth-state", function () {
          casepathRenderNavAuthState({ source: "auth-state-event" });
        });
        w.CasePathEvents.on("entitlements", function () {
          casepathSyncAuthState({ source: "entitlements" });
          casepathRenderNavAuthState({ source: "entitlements" });
        });
      }
    } catch (_eEv) {}
    w.addEventListener("storage", function (ev) {
      if (!ev) return;
      if (ev.key === "cr_signed_in" || ev.key === "cr_has_account") {
        casepathRenderNavAuthState({ source: "storage:" + ev.key });
      }
    });
  }

  casepathRenderNavAuthState({ source: "script-load" });

  if (d && d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", function () {
      void bootNavAuthState();
    });
  } else {
    void bootNavAuthState();
  }

  try {
    w.addEventListener("casepath:auth-state", function () {
      casepathRenderNavAuthState({ source: "casepath:auth-state" });
    });
  } catch (_eEvBus) {}
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
