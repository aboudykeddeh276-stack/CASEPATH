/**
 * Canonical page hero / editorial CTA — guest vs authenticated rendering.
 * Mount points: [data-casepath-page-cta]
 * Auth source: window.__CASEPATH_AUTH_STATE__ via casepathSyncAuthState().
 */
(function (w, d) {
  "use strict";
  if (!w || w.__CASEPATH_PAGE_AUTH_CTA_INIT__) return;
  w.__CASEPATH_PAGE_AUTH_CTA_INIT__ = true;

  var DEFAULTS = {
    guestPrimaryHref: "/signup/",
    guestPrimaryText: "Create Account",
    authPrimaryHref: "/app/workspace/",
    authPrimaryText: "Open Your Case",
    secondaryHref: "#features",
    secondaryText: "Explore Features",
  };

  var NAV_SIGNUP_IDS = { "nav-signup-btn": true, "nav-signin-btn": true };

  function readAuthState(opts) {
    opts = opts || {};
    if (opts.forceState && opts.forceState.mode) {
      return opts.forceState;
    }
    if (typeof w.casepathSyncAuthState === "function") {
      return w.casepathSyncAuthState(opts);
    }
    return w.__CASEPATH_AUTH_STATE__ || { mode: "hydrating", authenticated: false, hydrated: false };
  }

  function mountConfig(mount) {
    return {
      guestPrimaryHref: mount.getAttribute("data-guest-primary-href") || DEFAULTS.guestPrimaryHref,
      guestPrimaryText: mount.getAttribute("data-guest-primary-text") || DEFAULTS.guestPrimaryText,
      authPrimaryHref: mount.getAttribute("data-auth-primary-href") || DEFAULTS.authPrimaryHref,
      authPrimaryText: mount.getAttribute("data-auth-primary-text") || DEFAULTS.authPrimaryText,
      secondaryHref: mount.getAttribute("data-secondary-href") || DEFAULTS.secondaryHref,
      secondaryText: mount.getAttribute("data-secondary-text") || DEFAULTS.secondaryText,
      variant: mount.getAttribute("data-variant") || "hero",
      extraHref: mount.getAttribute("data-extra-href") || "",
      extraText: mount.getAttribute("data-extra-text") || "",
      hideSecondary: mount.getAttribute("data-hide-secondary") === "true",
    };
  }

  function classForRole(cfg, role) {
    if (cfg.variant === "editorial") {
      if (role === "primary") return "hiw-btn hiw-btn--primary";
      return "hiw-btn";
    }
    if (cfg.variant === "checklists") {
      if (role === "primary") return "cl-btn-primary";
      if (role === "secondary") return "cl-btn-secondary";
      return "cl-btn-outline";
    }
    if (role === "primary") return "hiw-hero-cta";
    if (role === "secondary") return "hiw-hero-cta hiw-hero-cta--secondary";
    return "hiw-hero-cta hiw-hero-cta--secondary";
  }

  function makeLink(href, text, className, opts) {
    opts = opts || {};
    var a = d.createElement("a");
    a.href = href;
    a.className = className;
    a.textContent = text;
    if (opts.authSignup) {
      a.setAttribute("data-auth", "signup");
    }
    return a;
  }

  function renderMount(mount, signedIn, hydrating) {
    var cfg = mountConfig(mount);
    mount.replaceChildren();

    if (hydrating) {
      mount.setAttribute("data-casepath-page-cta-state", "hydrating");
      return;
    }

    mount.setAttribute("data-casepath-page-cta-state", signedIn ? "authenticated" : "guest");

    if (signedIn) {
      mount.appendChild(
        makeLink(cfg.authPrimaryHref, cfg.authPrimaryText, classForRole(cfg, "primary"))
      );
    } else {
      mount.appendChild(
        makeLink(cfg.guestPrimaryHref, cfg.guestPrimaryText, classForRole(cfg, "primary"), {
          authSignup: cfg.guestPrimaryHref === "#" || cfg.guestPrimaryHref.indexOf("auth=signup") !== -1,
        })
      );
    }

    if (!cfg.hideSecondary) {
      mount.appendChild(
        makeLink(cfg.secondaryHref, cfg.secondaryText, classForRole(cfg, "secondary"))
      );
    }

    if (cfg.extraHref && cfg.extraText) {
      mount.appendChild(makeLink(cfg.extraHref, cfg.extraText, classForRole(cfg, "extra")));
    }
  }

  function isAccountSignupCta(el) {
    if (!el || el.nodeType !== 1) return false;
    if (NAV_SIGNUP_IDS[el.id]) return false;
    if (el.closest && el.closest("[data-casepath-page-cta]")) return false;

    var auth = el.getAttribute("data-auth");
    var authMode = el.getAttribute("data-auth-mode");
    if (auth === "signup" || authMode === "signup") return true;

    var label = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!label) return false;
    if (label === "create account" || label === "create your account") return true;
    if (label === "create free account") return true;
    if (label === "sign up" || label === "get started") return true;
  }

  function syncLegacyAccountSignupCtas(signedIn, hydrating) {
    if (hydrating) return;
    d.querySelectorAll("a,button").forEach(function (el) {
      if (!isAccountSignupCta(el)) return;
      if (signedIn) {
        el.remove();
      }
    });
  }

  function casepathRenderPageAuthCta(opts) {
    opts = opts || {};
    var state = readAuthState(opts);
    var signedIn = state.mode === "authenticated";
    var hydrating = state.mode === "hydrating";

    d.querySelectorAll("[data-casepath-page-cta]").forEach(function (mount) {
      renderMount(mount, signedIn, hydrating);
    });

    syncLegacyAccountSignupCtas(signedIn, hydrating);

    return state;
  }

  function bootPageAuthCta() {
    casepathRenderPageAuthCta({ source: "page-cta-boot" });
    try {
      if (typeof w.casepathWaitForAuthHydration === "function") {
        void w.casepathWaitForAuthHydration().then(function () {
          casepathRenderPageAuthCta({ source: "page-cta-hydrated" });
        });
      }
    } catch (_eHydr) {}
  }

  w.casepathRenderPageAuthCta = casepathRenderPageAuthCta;

  if (d) {
    if (d.readyState === "loading") {
      d.addEventListener("DOMContentLoaded", bootPageAuthCta);
    } else {
      bootPageAuthCta();
    }

    d.addEventListener("casepath:access-ready", function () {
      casepathRenderPageAuthCta({ source: "access-ready" });
    });

    try {
      if (w.CasePathEvents && typeof w.CasePathEvents.on === "function") {
        w.CasePathEvents.on("auth-state", function () {
          casepathRenderPageAuthCta({ source: "auth-state-event" });
        });
      }
    } catch (_eEv) {}

    w.addEventListener("casepath:auth-state", function () {
      casepathRenderPageAuthCta({ source: "casepath:auth-state" });
    });

    w.addEventListener("storage", function (ev) {
      if (!ev) return;
      if (ev.key === "cr_signed_in" || ev.key === "cr_has_account") {
        casepathRenderPageAuthCta({ source: "storage:" + ev.key });
      }
    });
  }
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
