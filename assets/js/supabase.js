(function () {
  try {
    if (!window.__CASEPATH_AUTH_CALLBACK_HREF_CAPTURED__) {
      window.__CASEPATH_AUTH_CALLBACK_HREF_CAPTURED__ = String(window.location.href || "");
    }
  } catch (_capHref) {}

  function readCaptchaBootstrapFromMeta() {
    try {
      if (typeof document === "undefined" || !document.querySelector) return;
      var captchaMeta = document.querySelector('meta[name="casepath-supabase-auth-captcha"]');
      if (captchaMeta) {
        var captchaVal = String(captchaMeta.getAttribute("content") || "")
          .trim()
          .toLowerCase();
        if (captchaVal === "true" || captchaVal === "1" || captchaVal === "yes") {
          window.CASEPATH_SUPABASE_AUTH_CAPTCHA = true;
        } else if (captchaVal === "false" || captchaVal === "0" || captchaVal === "no") {
          window.CASEPATH_SUPABASE_AUTH_CAPTCHA = false;
        }
      }
      if (window.CASEPATH_SUPABASE_AUTH_CAPTCHA === true && !window.CASEPATH_TURNSTILE_SITE_KEY) {
        var keyMeta = document.querySelector('meta[name="casepath-turnstile-site-key"]');
        var keyVal = keyMeta ? String(keyMeta.getAttribute("content") || "").trim() : "";
        if (keyVal) window.CASEPATH_TURNSTILE_SITE_KEY = keyVal;
      }
    } catch (_e) {
      /* ignore */
    }
  }

  var CANONICAL_TURNSTILE_SITE_KEY = "0x4AAAAAADUYDl4M5bsDNyNJ";

  function applyCanonicalTurnstileSiteKey() {
    if (window.CASEPATH_TURNSTILE_SITE_KEY) return;
    try {
      var keyMeta = document.querySelector('meta[name="casepath-turnstile-site-key"]');
      var keyVal = keyMeta ? String(keyMeta.getAttribute("content") || "").trim() : "";
      if (keyVal) {
        window.CASEPATH_TURNSTILE_SITE_KEY = keyVal;
        return;
      }
    } catch (_eKey) {}
    window.CASEPATH_TURNSTILE_SITE_KEY = CANONICAL_TURNSTILE_SITE_KEY;
  }

  /** Supabase Auth CAPTCHA is on server-side — default client flag ON unless explicitly disabled. */
  function ensureCaptchaBootstrap() {
    readCaptchaBootstrapFromMeta();
    if (window.CASEPATH_SUPABASE_AUTH_CAPTCHA === true || window.CASEPATH_SUPABASE_AUTH_CAPTCHA === false) {
      if (window.CASEPATH_SUPABASE_AUTH_CAPTCHA === true) applyCanonicalTurnstileSiteKey();
      return;
    }
    window.CASEPATH_SUPABASE_AUTH_CAPTCHA = true;
    applyCanonicalTurnstileSiteKey();
  }
  ensureCaptchaBootstrap();

  /**
   * Active CasePath production Supabase: ref zcjpqsekucmmjdnykcuu (host below). Edge Functions use
   * the same project via Supabase dashboard secrets (SUPABASE_URL / keys). Other Supabase projects
   * may exist for history or testing elsewhere in the org; this file is the browser runtime source of truth.
   */
  var CANONICAL_ACTIVE_SUPABASE_REF = "zcjpqsekucmmjdnykcuu";
  var supabaseUrl = "https://zcjpqsekucmmjdnykcuu.supabase.co";
  var supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjanBxc2VrdWNtbWpkbnlrY3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzgzODIsImV4cCI6MjA4NzkxNDM4Mn0.WP0DfVYLZHaKmAvEMh9VOshfprJ3cTtYUJAGvPfGyL8";
  /** Edge Functions (e.g. ai-assistant) gate on SUPABASE_ANON_KEY env — publishable key on deployed project. */
  var supabasePublishableKey = "sb_publishable_0ZKJVGbPNnOWf5dsnerUjw_PplPjkY-";

  function casepathEdgeFunctionApiKey() {
    var pub =
      typeof window !== "undefined" && window.SUPABASE_PUBLISHABLE_KEY
        ? String(window.SUPABASE_PUBLISHABLE_KEY).trim()
        : String(supabasePublishableKey || "").trim();
    if (pub) return pub;
    return typeof window !== "undefined" && window.SUPABASE_ANON_KEY
      ? String(window.SUPABASE_ANON_KEY).trim()
      : String(supabaseKey || "").trim();
  }

  function parseSupabaseProjectRefFromUrl(url) {
    try {
      var m = String(url || "").match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
      return m ? String(m[1]).toLowerCase() : null;
    } catch (_e) {
      return null;
    }
  }

  var activeRefFromUrl = parseSupabaseProjectRefFromUrl(supabaseUrl);
  console.log("[AUTH] Active Supabase Project Ref: " + (activeRefFromUrl || "(unparsed)"));
  if (activeRefFromUrl && activeRefFromUrl !== String(CANONICAL_ACTIVE_SUPABASE_REF).toLowerCase()) {
    console.error(
      "[AUTH] Supabase project ref mismatch: CasePath active runtime must use ref " +
        CANONICAL_ACTIVE_SUPABASE_REF +
        " but SUPABASE URL hostname resolves to " +
        activeRefFromUrl +
        ". Fix assets/js/supabase.js before shipping."
    );
  } else if (supabaseUrl && !activeRefFromUrl) {
    console.error(
      "[AUTH] Supabase URL is set but not a valid https://<ref>.supabase.co URL; expected ref " +
        CANONICAL_ACTIVE_SUPABASE_REF +
        "."
    );
  }

  console.log("[AUTH] Supabase bootstrap starting");

  try {
    var _cspMeta =
      typeof document !== "undefined" &&
      document.querySelector &&
      document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    console.log("[AUTH] startup config", {
      SUPABASE_URL_present: !!supabaseUrl,
      SUPABASE_ANON_KEY_present: !!supabaseKey,
      SUPABASE_PUBLISHABLE_KEY_present: !!supabasePublishableKey,
      origin: typeof window !== "undefined" && window.location ? window.location.origin : "(n/a)",
      cspMetaPresent: !!_cspMeta,
      cspNote: _cspMeta
        ? "meta CSP tag present (may combine with server headers)"
        : "no meta CSP in DOM (server Header CSP only)",
    });
  } catch (_cfgErr) {
    console.warn("[AUTH] startup config log failed", _cfgErr && _cfgErr.message ? _cfgErr.message : _cfgErr);
  }

  function probeAuthSettingsConnectivity() {
    if (window.__casepathAuthConnectivityProbed) return;
    window.__casepathAuthConnectivityProbed = true;
    var base = String(supabaseUrl || "").replace(/\/$/, "");
    if (!base) return;
    var url = base + "/auth/v1/settings";
    fetch(url, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      headers: {
        apikey: supabaseKey,
        Authorization: "Bearer " + supabaseKey,
      },
    })
      .then(function (res) {
        if (res && res.ok) console.log("[AUTH] Supabase URL OK");
        else console.warn("[AUTH] Supabase connectivity FAILED", { status: res ? res.status : "no response" });
      })
      .catch(function (e) {
        console.warn("[AUTH] Supabase connectivity FAILED", e && e.message ? e.message : e);
      });
  }

  function getCreateClient() {
    var lib = typeof window !== "undefined" ? window.supabase : null;
    if (!lib) return null;
    if (typeof lib.createClient === "function") return lib.createClient;
    if (lib.default && typeof lib.default.createClient === "function") return lib.default.createClient;
    return null;
  }

  function initSupabaseClient() {
    if (window.supabaseClient) return true;
    var createClient = getCreateClient();
    if (!createClient) {
      console.error(
        "[AUTH] Supabase client not created: library did not load (no createClient on window.supabase). Is the CDN script blocked?"
      );
      return false;
    }
    var client;
    try {
      client = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.error("[AUTH] Supabase client not created: createClient() failed", e);
      return false;
    }
    window.SUPABASE_PROJECT_URL = supabaseUrl;
    window.SUPABASE_ANON_KEY = supabaseKey;
    window.SUPABASE_PUBLISHABLE_KEY = supabasePublishableKey;
    /* CAPTCHA is opt-in: set window.CASEPATH_SUPABASE_AUTH_CAPTCHA = true before this script to enable Turnstile. */
    if (window.CASEPATH_SUPABASE_AUTH_CAPTCHA === true) {
      var existingKey =
        typeof window.CASEPATH_TURNSTILE_SITE_KEY !== "undefined" && window.CASEPATH_TURNSTILE_SITE_KEY != null
          ? String(window.CASEPATH_TURNSTILE_SITE_KEY).trim()
          : "";
      window.CASEPATH_TURNSTILE_SITE_KEY = existingKey;
    } else {
      window.CASEPATH_SUPABASE_AUTH_CAPTCHA = false;
      window.CASEPATH_TURNSTILE_SITE_KEY = "";
    }
    window.supabaseClient = client;
    window.casepathSupabase = client;
    console.log("[AUTH] Supabase client created", {
      captchaEnabled: window.CASEPATH_SUPABASE_AUTH_CAPTCHA === true,
      turnstileSiteKeyPresent: !!(window.CASEPATH_TURNSTILE_SITE_KEY && String(window.CASEPATH_TURNSTILE_SITE_KEY).trim()),
    });
    wireEarlyPasswordRecoveryListener(client);
    loadAuthCallbackProcessor();
    probeAuthSettingsConnectivity();
    return true;
  }

  function loadStaticAuthHostForRecovery() {
    return new Promise(function (resolve) {
      if (typeof window.casepathEnsureAuthModalReady === "function") {
        resolve();
        return;
      }
      var existing = document.querySelector('script[src*="casepath-static-auth-host.js"]');
      if (existing) {
        var tries = 0;
        (function waitHost() {
          if (typeof window.casepathEnsureAuthModalReady === "function" || tries++ > 120) {
            resolve();
            return;
          }
          setTimeout(waitHost, 50);
        })();
        return;
      }
      var v =
        (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
        "20260707turnstilededup1";
      var s = document.createElement("script");
      s.src = "/assets/js/casepath-static-auth-host.js?v=" + v;
      s.async = false;
      s.onload = function () {
        var tries = 0;
        (function waitReady() {
          if (typeof window.casepathEnsureAuthModalReady === "function" || tries++ > 120) {
            resolve();
            return;
          }
          setTimeout(waitReady, 50);
        })();
      };
      s.onerror = function () {
        resolve();
      };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function wireEarlyPasswordRecoveryListener(client) {
    if (window.__CASEPATH_EARLY_PW_RECOVERY_LISTENER__) return;
    if (!client || !client.auth || typeof client.auth.onAuthStateChange !== "function") return;
    window.__CASEPATH_EARLY_PW_RECOVERY_LISTENER__ = true;
    client.auth.onAuthStateChange(function (event, session) {
      if (event !== "PASSWORD_RECOVERY" || !session) return;
      try {
        window.__CASEPATH_PASSWORD_RECOVERY_CAPTURED__ = true;
        window.__crPasswordRecoveryActive = true;
        window.__CASEPATH_RECOVERY_PANEL_PENDING__ = true;
      } catch (_eFlag) {}
      void (async function () {
        await loadStaticAuthHostForRecovery();
        try {
          if (typeof window.casepathEnsureAuthModalReady === "function") {
            await window.casepathEnsureAuthModalReady();
          }
        } catch (_eEnsure) {}
        function tryOpen() {
          if (typeof window.casepathOpenRecoveryPasswordPanel === "function") {
            return window.casepathOpenRecoveryPasswordPanel();
          }
          return false;
        }
        if (tryOpen()) {
          try {
            window.__CASEPATH_RECOVERY_PANEL_PENDING__ = false;
          } catch (_eDone) {}
          return;
        }
        var tries = 0;
        var timer = setInterval(function () {
          if (tryOpen()) {
            try {
              window.__CASEPATH_RECOVERY_PANEL_PENDING__ = false;
            } catch (_eDone2) {}
            clearInterval(timer);
            return;
          }
          if (++tries > 60) clearInterval(timer);
        }, 150);
      })();
    });
  }

  function loadAuthCallbackProcessor() {
    if (window.__CASEPATH_AUTH_CALLBACK_MODULE__) {
      if (typeof window.casepathProcessAuthCallback === "function") {
        window.__CASEPATH_AUTH_CALLBACK_PROMISE__ = window.casepathProcessAuthCallback();
      }
      return;
    }
    if (window.__CASEPATH_AUTH_CALLBACK_LOADER__) return;
    window.__CASEPATH_AUTH_CALLBACK_LOADER__ = true;
    var v =
      (typeof window.__CASEPATH_ASSET_VERSION__ === "string" && window.__CASEPATH_ASSET_VERSION__.trim()) ||
      "20260707turnstilededup1";
    var src = "/assets/js/core/casepath-auth-callback.js?v=" + v;
    try {
      if (document.querySelector('script[src*="casepath-auth-callback.js"]')) return;
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      (document.head || document.documentElement).appendChild(s);
    } catch (_eLoadCb) {}
  }

  function logAuthStripeAndEnvironment() {
    try {
      var pk =
        typeof window !== "undefined" && window.CASEPATH_STRIPE_PUBLISHABLE_KEY
          ? String(window.CASEPATH_STRIPE_PUBLISHABLE_KEY).trim()
          : "";
      var stripeMode = "unknown";
      if (/^pk_live_/.test(pk)) stripeMode = "live";
      else if (/^pk_test_/.test(pk)) stripeMode = "test";
      console.log("[AUTH] Stripe mode: " + stripeMode);

      var h =
        typeof window !== "undefined" && window.location && window.location.hostname
          ? String(window.location.hostname)
          : "";
      var envLabel = "unknown";
      if (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(h)) envLabel = "local";
      else if (h) envLabel = "production";
      console.log("[AUTH] Environment: " + envLabel);
    } catch (e) {
      console.warn("[AUTH] Stripe/environment log failed", e && e.message ? e.message : e);
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", logAuthStripeAndEnvironment);
    } else {
      logAuthStripeAndEnvironment();
    }
  }

  window.initSupabaseClient = initSupabaseClient;
  window.casepathEdgeFunctionApiKey = casepathEdgeFunctionApiKey;
  window.SUPABASE_PUBLISHABLE_KEY = supabasePublishableKey;
  initSupabaseClient();
})();
