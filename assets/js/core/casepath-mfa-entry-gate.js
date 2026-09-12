/**
 * MFA Beta Entry Experience — optional enrolment prompt before Your Case / Workspace / Dashboard.
 * Reuses CasePathAuth.mfa + CasePathMfaUi.enableMfaFlow; no backend auth changes.
 */
(function (w, d) {
  "use strict";
  if (!w || w.CasePathMfaEntryGate) return;

  var ASSET_V = "20260715mfaentry1";
  var SKIP_KEY = "cp_mfa_entry_skipped";
  var LOGIN_STAMP_KEY = "cp_mfa_entry_login_stamp";
  var MODAL_ID = "cp-mfa-entry-modal";

  var gateState = {
    presented: false,
    pendingPromise: null,
    escapeHandler: null,
  };

  function policy() {
    return w.CasePathAuth && w.CasePathAuth.mfaPolicy ? w.CasePathAuth.mfaPolicy : null;
  }

  function mfa() {
    return w.CasePathAuth && w.CasePathAuth.mfa ? w.CasePathAuth.mfa : null;
  }

  function normalisePath(raw) {
    var path = String(raw || "/").trim().replace(/\\/g, "/");
    if (!path) return "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    path = path.toLowerCase();
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path || "/";
  }

  function pathMatchesPrefix(path, prefix) {
    return path === prefix || path.indexOf(prefix + "/") === 0;
  }

  function isVaultEntryPath(path) {
    var p = normalisePath(path);
    return pathMatchesPrefix(p, "/app/workspace") || p === "/your-case.html" || p === "/your-case";
  }

  function isVaultEntryClassification(classification) {
    if (!classification) return isVaultEntryPath(w.location.pathname || "/");
    if (classification.featureKey === "vault") return true;
    if (classification.gotoToken === "vault" || classification.gotoToken === "case" || classification.gotoToken === "workspace") {
      return true;
    }
    return isVaultEntryPath(classification.path || w.location.pathname || "/");
  }

  function isVaultPageId(pageId) {
    var id = String(pageId || "").trim().toLowerCase();
    return id === "vault" || id === "case" || id === "workspace";
  }

  function readAuthedSync() {
    try {
      if (typeof w.casepathIsAuthenticatedSync === "function") {
        var sync = w.casepathIsAuthenticatedSync();
        if (sync === true) return true;
        if (sync === false) return false;
      }
    } catch (_e0) {}
    try {
      if (w.authState && w.authState.isAuthenticated && w.authState.session) return true;
    } catch (_e1) {}
    return false;
  }

  function getLoginStamp() {
    try {
      if (w.authState && w.authState.user && w.authState.user.id) return String(w.authState.user.id);
      if (w.currentUser && w.currentUser.id) return String(w.currentUser.id);
    } catch (_e) {}
    return null;
  }

  function hasSkippedThisLogin() {
    try {
      if (w.sessionStorage.getItem(SKIP_KEY) !== "1") return false;
      var stamp = w.sessionStorage.getItem(LOGIN_STAMP_KEY);
      var current = getLoginStamp();
      return !!(stamp && current && stamp === current);
    } catch (_e) {
      return false;
    }
  }

  function markSkippedThisVisit() {
    try {
      w.sessionStorage.setItem(SKIP_KEY, "1");
      var stamp = getLoginStamp();
      if (stamp) w.sessionStorage.setItem(LOGIN_STAMP_KEY, stamp);
    } catch (_e) {}
  }

  function clearSkipOnNewLogin() {
    try {
      w.sessionStorage.removeItem(SKIP_KEY);
      var stamp = getLoginStamp();
      if (stamp) w.sessionStorage.setItem(LOGIN_STAMP_KEY, stamp);
    } catch (_e) {}
  }

  function isMfaRequired() {
    var p = policy();
    return !!(p && p.MFA_ENABLED && p.MFA_REQUIRED);
  }

  function ensureMfaStackLoaded() {
    if (w.CasePathMfaUi && w.CasePathAuth && w.CasePathAuth.mfa) {
      return Promise.resolve(true);
    }
    if (w.CasePathAuthCore && typeof w.CasePathAuthCore.loadAuthMfa === "function") {
      return Promise.resolve(w.CasePathAuthCore.loadAuthMfa()).then(function () {
        return !!(w.CasePathMfaUi && w.CasePathAuth && w.CasePathAuth.mfa);
      });
    }
    return new Promise(function (resolve) {
      var attempts = 0;
      function poll() {
        attempts += 1;
        if (w.CasePathMfaUi && w.CasePathAuth && w.CasePathAuth.mfa) {
          resolve(true);
          return;
        }
        if (attempts >= 40) {
          resolve(false);
          return;
        }
        w.setTimeout(poll, 100);
      }
      poll();
    });
  }

  async function shouldPrompt() {
    var p = policy();
    if (!p || !p.MFA_ENABLED) return false;
    if (!readAuthedSync()) return false;
    var loaded = await ensureMfaStackLoaded();
    if (!loaded) return false;
    var M = mfa();
    if (!M || typeof M.isEnrolled !== "function") return false;
    try {
      if (await M.isEnrolled()) return false;
    } catch (_eEnroll) {
      return false;
    }
    if (!isMfaRequired() && hasSkippedThisLogin()) return false;
    return true;
  }

  function ensureEntryStyle() {
    if (d.getElementById("cp-mfa-entry-gate-style")) return;
    var style = d.createElement("style");
    style.id = "cp-mfa-entry-gate-style";
    style.textContent =
      ".cp-mfa-entry-overlay{z-index:2147482100!important;background:rgba(15,23,42,0.72)!important;}" +
      ".cp-mfa-entry-overlay .cp-mfa-entry-modal{max-width:520px;width:calc(100% - 2rem);}" +
      ".cp-mfa-entry-body p{margin:0 0 0.85rem;color:var(--mid);font-size:0.95rem;line-height:1.55;}" +
      ".cp-mfa-entry-body p:last-child{margin-bottom:0;}" +
      ".cp-mfa-entry-footer{margin-top:1.1rem;padding-top:0.85rem;border-top:1px solid var(--border);font-size:0.82rem;color:var(--soft);line-height:1.45;}" +
      ".cp-mfa-entry-actions{display:flex;flex-direction:column;gap:0.55rem;margin-top:1.25rem;}" +
      "html[data-casepath-route-blocked='mfa-entry'] [data-casepath-protected-shell-root]{" +
      "pointer-events:none!important;user-select:none;opacity:0.12;filter:blur(2px);}";
    (d.head || d.documentElement).appendChild(style);
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getFocusableElements(root) {
    if (!root) return [];
    try {
      return Array.prototype.slice.call(
        root.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    } catch (_e) {
      return [];
    }
  }

  function wireFocusTrap(overlay) {
    if (!overlay || overlay.getAttribute("data-cp-focus-trap") === "1") return;
    overlay.setAttribute("data-cp-focus-trap", "1");
    overlay.addEventListener("keydown", function (ev) {
      if (ev.key !== "Tab") return;
      var modal = overlay.querySelector(".modal");
      var focusable = getFocusableElements(modal);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (ev.shiftKey && d.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && d.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    });
  }

  function openOverlay(el) {
    if (w.CasePathRuntime && w.CasePathRuntime.overlay) {
      w.CasePathRuntime.overlay.open(el, { focus: true });
    } else {
      el.classList.add("show");
      el.style.display = "flex";
      el.setAttribute("aria-hidden", "false");
    }
  }

  function closeOverlay(el) {
    if (!el) return;
    if (w.CasePathRuntime && w.CasePathRuntime.overlay) {
      w.CasePathRuntime.overlay.close(el);
    } else {
      el.classList.remove("show");
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }
  }

  function removeEscapeHandler() {
    if (gateState.escapeHandler) {
      d.removeEventListener("keydown", gateState.escapeHandler);
      gateState.escapeHandler = null;
    }
  }

  function buildModalBody(required) {
    if (required) {
      return (
        '<p>Multi-Factor Authentication is required before accessing Your Case.</p>' +
        '<p>Your Case contains sensitive family law information. MFA adds an extra layer of protection using an authenticator app.</p>'
      );
    }
    return (
      "<p>Your Case contains sensitive family law information, including your case details, court information, documents and personal records.</p>" +
      "<p>Multi-Factor Authentication (MFA) adds an extra layer of protection using an authenticator app.</p>" +
      "<p>During beta, MFA is optional but strongly recommended.</p>"
    );
  }

  function presentEntryModal(opts) {
    opts = opts || {};
    ensureEntryStyle();
    var required = isMfaRequired();
    var existing = d.getElementById(MODAL_ID);
    if (existing) existing.remove();

    var skipBtn = required
      ? ""
      : '<button type="button" class="btn-text" id="cp-mfa-entry-skip">Skip for now</button>';
    var closeBtn = required
      ? ""
      : '<button type="button" class="modal-close cp-mfa-close" aria-label="Close" id="cp-mfa-entry-close">&times;</button>';

    var overlay = d.createElement("div");
    overlay.className = "modal-overlay cp-mfa-overlay cp-mfa-entry-overlay show";
    overlay.id = MODAL_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "cp-mfa-entry-title");
    overlay.setAttribute("aria-hidden", "false");
    overlay.innerHTML =
      '<div class="modal cp-mfa-modal cp-mfa-entry-modal">' +
      closeBtn +
      '<h2 id="cp-mfa-entry-title">Protect Your Case</h2>' +
      '<div class="cp-mfa-entry-body">' +
      buildModalBody(required) +
      "</div>" +
      '<div class="cp-mfa-entry-actions">' +
      '<button type="button" class="btn-full" id="cp-mfa-entry-enable">Enable MFA</button>' +
      skipBtn +
      "</div>" +
      '<p class="cp-mfa-entry-footer">You can enable MFA later at any time from Profile → Account Security.</p>' +
      "</div>";
    (d.body || d.documentElement).appendChild(overlay);

    wireFocusTrap(overlay);
    openOverlay(overlay);

    var enableBtn = overlay.querySelector("#cp-mfa-entry-enable");
    if (enableBtn) enableBtn.focus();

    if (!required) {
      gateState.escapeHandler = function (ev) {
        if (ev.key === "Escape") {
          ev.preventDefault();
          if (typeof opts.onSkip === "function") opts.onSkip();
        }
      };
      d.addEventListener("keydown", gateState.escapeHandler);
    }

    function finishSkip() {
      removeEscapeHandler();
      closeOverlay(overlay);
      gateState.presented = false;
      if (typeof opts.onSkip === "function") opts.onSkip();
    }

    function finishSuccess() {
      removeEscapeHandler();
      closeOverlay(overlay);
      gateState.presented = false;
      if (typeof opts.onAllowed === "function") opts.onAllowed({ enrolled: true });
    }

    var skipEl = overlay.querySelector("#cp-mfa-entry-skip");
    if (skipEl) skipEl.addEventListener("click", finishSkip);
    var closeEl = overlay.querySelector("#cp-mfa-entry-close");
    if (closeEl) closeEl.addEventListener("click", finishSkip);

    if (enableBtn) {
      enableBtn.addEventListener("click", function () {
        if (!w.CasePathMfaUi || typeof w.CasePathMfaUi.enableMfaFlow !== "function") return;
        enableBtn.disabled = true;
        w.CasePathMfaUi.enableMfaFlow({
          onSuccess: function () {
            enableBtn.disabled = false;
            finishSuccess();
          },
        }).catch(function () {
          enableBtn.disabled = false;
        });
      });
    }

    gateState.presented = true;
    return overlay;
  }

  function blockShellForEntry(classification) {
    if (w.CasePathProtectedRoutes && typeof w.CasePathProtectedRoutes.setShellBlocked === "function") {
      return;
    }
    try {
      d.documentElement.setAttribute("data-casepath-route-blocked", "mfa-entry");
    } catch (_e) {}
    try {
      var roots = d.querySelectorAll("[data-casepath-protected-shell-root]");
      for (var i = 0; i < roots.length; i++) {
        roots[i].setAttribute("aria-hidden", "true");
        roots[i].setAttribute("data-casepath-shell-gated", "mfa-entry");
      }
    } catch (_e2) {}
  }

  function waitForVaultMfaEntry(classification) {
    if (!isVaultEntryClassification(classification)) {
      return Promise.resolve({ allowed: true, prompted: false, skipped: false });
    }
    if (gateState.pendingPromise) return gateState.pendingPromise;

    gateState.pendingPromise = shouldPrompt().then(function (needsPrompt) {
      if (!needsPrompt) {
        gateState.pendingPromise = null;
        return { allowed: true, prompted: false, skipped: hasSkippedThisLogin() };
      }
      blockShellForEntry(classification);
      return new Promise(function (resolve) {
        presentEntryModal({
          onSkip: function () {
            markSkippedThisVisit();
            gateState.pendingPromise = null;
            resolve({ allowed: true, prompted: true, skipped: true });
          },
          onAllowed: function (detail) {
            gateState.pendingPromise = null;
            resolve({
              allowed: true,
              prompted: true,
              skipped: false,
              enrolled: !!(detail && detail.enrolled),
            });
          },
        });
      });
    });

    return gateState.pendingPromise;
  }

  function guardBeforeVaultEntry(pageId) {
    if (!isVaultPageId(pageId)) return Promise.resolve(true);
    return waitForVaultMfaEntry({ featureKey: "vault", path: w.location.pathname }).then(function (result) {
      return !!(result && result.allowed);
    });
  }

  function wireLoginClear() {
    if (w.__CASEPATH_MFA_ENTRY_LOGIN_WIRED__) return;
    w.__CASEPATH_MFA_ENTRY_LOGIN_WIRED__ = true;
    try {
      if (w.supabaseClient && w.supabaseClient.auth && typeof w.supabaseClient.auth.onAuthStateChange === "function") {
        w.supabaseClient.auth.onAuthStateChange(function (event) {
          if (/SIGNED_IN/i.test(String(event || ""))) clearSkipOnNewLogin();
        });
      }
    } catch (_eSb) {}
    try {
      d.addEventListener("casepath:auth-hydrated", function () {
        /* no-op; stamp set on login events */
      });
    } catch (_eDom) {}
    try {
      if (w.CasePathEvents && typeof w.CasePathEvents.on === "function") {
        w.CasePathEvents.on("auth-state", function (detail) {
          if (detail && /SIGNED_IN/i.test(String(detail.event || ""))) clearSkipOnNewLogin();
        });
      }
    } catch (_eEv) {}
  }

  function wrapShowPageHook() {
    if (w.__CASEPATH_MFA_ENTRY_SHOWPAGE_WIRED__) return;
    w.__CASEPATH_MFA_ENTRY_SHOWPAGE_WIRED__ = true;
    var prev = w.showPage;
    if (typeof prev !== "function" || prev._mfaEntryHook) return;
    function showPageWithMfaEntry(id) {
      var args = arguments;
      if (!isVaultPageId(id)) return prev.apply(this, args);
      return guardBeforeVaultEntry(id).then(function (allowed) {
        if (!allowed) return null;
        return prev.apply(w, args);
      });
    }
    showPageWithMfaEntry._mfaEntryHook = true;
    w.showPage = showPageWithMfaEntry;
  }

  function isEntryPending() {
    return !!(gateState.presented || gateState.pendingPromise);
  }

  function waitForPendingEntry() {
    if (!gateState.pendingPromise) return Promise.resolve(true);
    return gateState.pendingPromise.then(function (result) {
      return !!(result && result.allowed);
    });
  }

  function wrapWorkspaceEntryResolver() {
    if (w.__CASEPATH_MFA_ENTRY_RESOLVE_WIRED__) return;
    w.__CASEPATH_MFA_ENTRY_RESOLVE_WIRED__ = true;
    function installWrap() {
      var prev = w.resolveCaseWorkspaceEntry;
      if (typeof prev !== "function" || prev._mfaEntryWrapped) return;
      w.resolveCaseWorkspaceEntry = function () {
        return waitForPendingEntry().then(function (allowed) {
          if (!allowed) return;
          return prev.apply(w, arguments);
        });
      };
      w.resolveCaseWorkspaceEntry._mfaEntryWrapped = true;
    }
    installWrap();
    w.setTimeout(installWrap, 0);
    w.setTimeout(installWrap, 1200);
  }

  function init() {
    wireLoginClear();
    wrapShowPageHook();
    wrapWorkspaceEntryResolver();
    if (d.readyState === "loading") {
      d.addEventListener("DOMContentLoaded", wrapShowPageHook, { once: true });
    } else {
      w.setTimeout(wrapShowPageHook, 0);
    }
  }

  w.CasePathMfaEntryGate = {
    version: ASSET_V,
    isVaultEntryRoute: isVaultEntryClassification,
    isVaultPageId: isVaultPageId,
    shouldPrompt: shouldPrompt,
    waitForVaultMfaEntry: waitForVaultMfaEntry,
    guardBeforeVaultEntry: guardBeforeVaultEntry,
    markSkippedThisVisit: markSkippedThisVisit,
    clearSkipOnNewLogin: clearSkipOnNewLogin,
    hasSkippedThisLogin: hasSkippedThisLogin,
    isEntryPending: isEntryPending,
    waitForPendingEntry: waitForPendingEntry,
    presentEntryModal: presentEntryModal,
    resetGateState: function () {
      gateState.presented = false;
      gateState.pendingPromise = null;
      removeEscapeHandler();
    },
  };

  init();
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
