/**
 * Quick Exit — isolated, click-only safety control (production-safe).
 * Does nothing on load except mount the button. All exit actions run in activateQuickExit().
 *
 * API: window.activateQuickExit()  (alias: window.casepathQuickExit)
 * Disable UI: window.CASEPATH_ENABLE_QUICK_EXIT = false before this script loads.
 */
(function (w, doc) {
  "use strict";
  if (!w || typeof w !== "object") return;

  var REDIRECT_URL = "https://www.news.com.au";
  var MODULE_VERSION = "20260607mobile1";
  var MOBILE_VIEWPORT_MQ = "(max-width: 900px)";
  var DESKTOP_NAV_QUICK_EXIT_MQ = "(min-width: 1025px)";
  var FIXED_MOBILE_WRAP_ID = "casepath-quick-exit-fixed-mobile-wrap";
  var tooltipCloneCounter = 0;
  var QUICK_EXIT_TOOLTIP_COPY =
    "Quick Exit immediately leaves this site and opens a neutral page for privacy. This does not clear browser history.";
  var QUICK_EXIT_TOOLTIP_ID = "casepath-quick-exit-tooltip";
  var TOOLTIP_AUTO_HIDE_MS = 5000;
  var STORAGE_PREFIXES = ["cr_", "casepath_", "cp_"];
  var GENERIC_TITLE = "CasePath";
  var QUICK_EXIT_CHANNEL = "casepath-quick-exit-v1";
  var QUICK_EXIT_STORAGE_KEY = "casepath_quick_exit_broadcast_v1";

  var exiting = false;
  var featureDisabled = w.CASEPATH_ENABLE_QUICK_EXIT === false;

  function isFeatureEnabled() {
    return !featureDisabled;
  }

  function keyIsCasepathScoped(key) {
    if (!key || typeof key !== "string") return false;
    var i;
    for (i = 0; i < STORAGE_PREFIXES.length; i++) {
      if (key.indexOf(STORAGE_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  function removeScopedKeysFromStore(store) {
    if (!store) return;
    var keys = [];
    var i;
    try {
      for (i = 0; i < store.length; i++) {
        var k = store.key(i);
        if (k && keyIsCasepathScoped(k)) keys.push(k);
      }
    } catch (_e0) {
      return;
    }
    for (i = 0; i < keys.length; i++) {
      try {
        store.removeItem(keys[i]);
      } catch (_e1) {}
    }
  }

  function clearCasepathScopedStorage() {
    try {
      if (typeof localStorage !== "undefined") removeScopedKeysFromStore(localStorage);
    } catch (_e2) {}
    try {
      if (typeof sessionStorage !== "undefined") removeScopedKeysFromStore(sessionStorage);
    } catch (_e3) {}
  }

  function logQuickExit(phase, detail) {
    try {
      console.warn("[QUICK EXIT]", phase, Object.assign({ at: new Date().toISOString() }, detail || {}));
    } catch (_e) {}
  }

  function broadcastQuickExit() {
    var payload = { t: "quick-exit", k: "activate", ts: Date.now() };
    try {
      if (typeof BroadcastChannel !== "undefined") {
        var ch = new BroadcastChannel(QUICK_EXIT_CHANNEL);
        ch.postMessage(payload);
        setTimeout(function () {
          try {
            ch.close();
          } catch (_eClose) {}
        }, 250);
      }
    } catch (_e0) {}
    try {
      localStorage.setItem(QUICK_EXIT_STORAGE_KEY, JSON.stringify(payload));
    } catch (_e1) {}
  }

  function cancelPendingAutosaveOnly() {
    try {
      if (typeof w.__casepathCancelPendingAutosaves === "function") {
        w.__casepathCancelPendingAutosaves();
      }
    } catch (_e4) {}
  }

  function clearSensitiveMemoryState() {
    try {
      w.currentUser = null;
      w.pendingFeature = null;
      w.__casepathVaultState = null;
      w.__casepathChronologyState = null;
      w.__casepathEvidencePreviews = null;
      w.__casepathAssistantState = null;
      w.__casepathPendingUploads = null;
      w.__crSignInInFlight = false;
      w.__casepathSignupSubmitting = false;
      w.__crPasswordRecoveryActive = false;
    } catch (_e0) {}
    try {
      if (w.__CASEPATH_AUTH_RECOVERY__ && typeof w.__CASEPATH_AUTH_RECOVERY__.clearAuthState === "function") {
        w.__CASEPATH_AUTH_RECOVERY__.clearAuthState("QUICK_EXIT");
      } else if (w.CasePathAuth && typeof w.CasePathAuth.clearAuthState === "function") {
        w.CasePathAuth.clearAuthState("QUICK_EXIT");
      }
    } catch (_e1) {}
    try {
      if (w.__CASEPATH_AUTH_RECOVERY__ && typeof w.__CASEPATH_AUTH_RECOVERY__.resetCaptchaWidgets === "function") {
        w.__CASEPATH_AUTH_RECOVERY__.resetCaptchaWidgets();
      } else if (typeof w.resetTurnstile === "function") {
        w.resetTurnstile();
      }
    } catch (_e2) {}
  }

  function closeSensitiveUi() {
    if (!doc) return;
    try {
      var authModal = doc.getElementById("auth-modal");
      if (authModal) authModal.classList.remove("show");
    } catch (_e5) {}
    try {
      if (typeof w.closeAuthModal === "function") w.closeAuthModal();
    } catch (_e6) {}
    try {
      doc.querySelectorAll(".modal-overlay.show").forEach(function (el) {
        el.classList.remove("show");
      });
    } catch (_e7) {}
  }

  var QUICK_EXIT_SIGNOUT_MS = 1500;

  function signOutSilentLegacy() {
    try {
      w.__crIntentionalSignOut = true;
    } catch (_e8) {}
    try {
      if (
        w.CasePathAuth &&
        w.CasePathAuth.session &&
        typeof w.CasePathAuth.session.clearPendingRedirects === "function"
      ) {
        w.CasePathAuth.session.clearPendingRedirects();
      }
    } catch (_e9) {}
    try {
      if (w.CasePathAuth && typeof w.CasePathAuth.clearAuthState === "function") {
        w.CasePathAuth.clearAuthState("SIGNED_OUT");
      }
    } catch (_e9b) {}
    try {
      if (typeof w.crSetSignedInFlag === "function") {
        w.crSetSignedInFlag(false);
      }
    } catch (_e9c) {}
    w.currentUser = null;
    try {
      if (w.casepathAuthFlow && typeof w.casepathAuthFlow.signoutFlow === "function") {
        if (typeof w.loadAuthRuntimeOnce === "function") {
          w.loadAuthRuntimeOnce()
            .then(function () {
              return w.casepathAuthFlow.signoutFlow();
            })
            .catch(function () {});
        } else {
          w.casepathAuthFlow.signoutFlow().catch(function () {});
        }
      } else if (typeof w.logout === "function") {
        w.logout().catch(function () {});
      }
    } catch (_e11) {}
  }

  function runQuickExitSignOut(done) {
    if (typeof w.casepathForceGuestNavState === "function") {
      w.casepathForceGuestNavState("quick-exit");
    }
    if (typeof w.casepathPerformSignOut === "function") {
      Promise.race([
        w.casepathPerformSignOut({ skipRedirect: true, skipUiSync: true }),
        new Promise(function (resolve) {
          setTimeout(resolve, QUICK_EXIT_SIGNOUT_MS);
        }),
      ])
        .catch(function () {})
        .then(function () {
          if (typeof done === "function") done();
        });
      return;
    }
    signOutSilentLegacy();
    if (typeof done === "function") done();
  }

  function replaceHistoryRoot() {
    try {
      if (w.history && typeof w.history.replaceState === "function") {
        w.history.replaceState(null, GENERIC_TITLE, "/");
      }
    } catch (_e12) {}
    try {
      if (doc) doc.title = GENERIC_TITLE;
    } catch (_e13) {}
  }

  function finishQuickExitRedirect() {
    logQuickExit("redirect", { target: REDIRECT_URL });
    clearCasepathScopedStorage();
    replaceHistoryRoot();
    try {
      w.location.replace(REDIRECT_URL);
    } catch (_e14) {
      try {
        w.location.href = REDIRECT_URL;
      } catch (_e15) {}
    }
  }

  /** All exit side effects — invoke only from the Quick Exit button or explicit API call. */
  function activateQuickExit(options) {
    options = options || {};
    if (exiting) return;
    exiting = true;

    logQuickExit("start", { route: w.location ? w.location.pathname + w.location.search : "" });
    if (!options.remote) broadcastQuickExit();
    cancelPendingAutosaveOnly();
    closeSensitiveUi();
    clearSensitiveMemoryState();
    clearCasepathScopedStorage();
    runQuickExitSignOut(finishQuickExitRedirect);
  }

  w.activateQuickExit = activateQuickExit;
  w.casepathQuickExit = activateQuickExit;
  w.__CASEPATH_QUICK_EXIT_MODULE_VERSION__ = MODULE_VERSION;

  try {
    w.CASEPATH_ENABLE_QUICK_EXIT = isFeatureEnabled();
  } catch (_e16) {}

  function isCoarsePointer() {
    try {
      return w.matchMedia("(hover: none), (pointer: coarse)").matches;
    } catch (_eCp) {
      return false;
    }
  }

  function matchesMedia(query) {
    try {
      return w.matchMedia(query).matches;
    } catch (_eMq) {
      return false;
    }
  }

  function isMobileViewport() {
    return matchesMedia(MOBILE_VIEWPORT_MQ);
  }

  function isDesktopNavQuickExitViewport() {
    return matchesMedia(DESKTOP_NAV_QUICK_EXIT_MQ);
  }

  function slotHasQuickExit(slot) {
    return !!(slot && slot.querySelector(".cp-quick-exit-wrap, .casepath-quick-exit-btn"));
  }

  function hasPrimaryQuickExitButton() {
    return !!doc.getElementById("casepath-quick-exit-btn");
  }

  var quickExitTooltipHideTimer = null;

  function setTooltipVisible(wrap, tooltip, btn, visible) {
    if (!wrap || !tooltip || !btn) return;
    if (visible) {
      wrap.classList.add("is-tooltip-visible");
      tooltip.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-describedby", tooltip.id);
    } else {
      wrap.classList.remove("is-tooltip-visible");
      tooltip.setAttribute("aria-hidden", "true");
      btn.removeAttribute("aria-describedby");
    }
  }

  function clearQuickExitTooltipTimer() {
    if (!quickExitTooltipHideTimer) return;
    clearTimeout(quickExitTooltipHideTimer);
    quickExitTooltipHideTimer = null;
  }

  function hideQuickExitTooltip(wrap, tooltip, btn) {
    clearQuickExitTooltipTimer();
    setTooltipVisible(wrap, tooltip, btn, false);
  }

  function revealQuickExitTooltip(wrap, tooltip, btn, scheduleAutoHide) {
    setTooltipVisible(wrap, tooltip, btn, true);
    if (scheduleAutoHide === false) return;
    clearQuickExitTooltipTimer();
    quickExitTooltipHideTimer = setTimeout(function () {
      hideQuickExitTooltip(wrap, tooltip, btn);
    }, TOOLTIP_AUTO_HIDE_MS);
  }

  function wireQuickExitTooltip(wrap, btn, tooltip) {
    wrap.addEventListener(
      "click",
      function (ev) {
        if (!ev || ev.target !== btn) return;
        if (!isCoarsePointer() || wrap.classList.contains("is-tooltip-visible")) return;
        try {
          ev.preventDefault();
          ev.stopImmediatePropagation();
        } catch (_eCap) {}
        revealQuickExitTooltip(wrap, tooltip, btn, true);
      },
      true
    );

    wrap.addEventListener("mouseenter", function () {
      if (!isCoarsePointer()) revealQuickExitTooltip(wrap, tooltip, btn, true);
    });
    wrap.addEventListener("mouseleave", function () {
      hideQuickExitTooltip(wrap, tooltip, btn);
    });

    btn.addEventListener("focus", function () {
      revealQuickExitTooltip(wrap, tooltip, btn, true);
    });
    btn.addEventListener("blur", function () {
      hideQuickExitTooltip(wrap, tooltip, btn);
    });

    if (!w.__CASEPATH_QUICK_EXIT_ESC_WIRED__) {
      w.__CASEPATH_QUICK_EXIT_ESC_WIRED__ = true;
      doc.addEventListener("keydown", function (ev) {
        if (!ev || ev.key !== "Escape") return;
        var open = doc.querySelector(".cp-quick-exit-wrap.is-tooltip-visible");
        if (!open) return;
        var openBtn = open.querySelector(".casepath-quick-exit-btn");
        var openTip = open.querySelector(".cp-quick-exit-tooltip");
        hideQuickExitTooltip(open, openTip, openBtn);
        try {
          if (openBtn && typeof openBtn.focus === "function") openBtn.focus();
        } catch (_eEsc) {}
      });
    }
  }

  function createQuickExitTooltip(isPrimary) {
    var tooltip = doc.createElement("div");
    tooltip.id = isPrimary
      ? QUICK_EXIT_TOOLTIP_ID
      : QUICK_EXIT_TOOLTIP_ID + "-clone-" + ++tooltipCloneCounter;
    tooltip.className = "cp-quick-exit-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.textContent = QUICK_EXIT_TOOLTIP_COPY;
    return tooltip;
  }

  function createQuickExitButton(wrap, tooltip, isPrimary) {
    var btn = doc.createElement("button");
    btn.type = "button";
    if (isPrimary) {
      btn.id = "casepath-quick-exit-btn";
    } else {
      btn.setAttribute("data-casepath-quick-exit-clone", "true");
    }
    btn.className = "casepath-quick-exit-btn cp-quick-exit-btn";
    btn.setAttribute("aria-label", "Quick Exit");
    btn.textContent = "Quick Exit";
    btn.addEventListener("click", function (ev) {
      try {
        if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
        if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
      } catch (_e17) {}
      if (isCoarsePointer() && wrap && !wrap.classList.contains("is-tooltip-visible")) {
        revealQuickExitTooltip(wrap, tooltip, btn, true);
        return;
      }
      activateQuickExit();
    });
    wireQuickExitTooltip(wrap, btn, tooltip);
    return btn;
  }

  function buildQuickExitMount(isPrimary) {
    var wrap = doc.createElement("div");
    wrap.className = "cp-quick-exit-wrap";
    var tooltip = createQuickExitTooltip(!!isPrimary);
    var btn = createQuickExitButton(wrap, tooltip, !!isPrimary);
    wrap.appendChild(btn);
    wrap.appendChild(tooltip);
    return wrap;
  }

  function upgradeQuickExitWithTooltip(btn) {
    if (!btn || btn.closest(".cp-quick-exit-wrap")) return;
    var parent = btn.parentNode;
    if (!parent) return;
    var wrap = doc.createElement("div");
    wrap.className = "cp-quick-exit-wrap";
    var tooltip = createQuickExitTooltip(btn.id === "casepath-quick-exit-btn");
    parent.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    wrap.appendChild(tooltip);
    btn.classList.add("cp-quick-exit-btn");
    wireQuickExitTooltip(wrap, btn, tooltip);
  }

  function appendMountToSlot(slot, assignPrimaryId) {
    if (!slot || slotHasQuickExit(slot)) return false;
    var mount = buildQuickExitMount(!!assignPrimaryId);
    slot.appendChild(mount);
    return true;
  }

  function ensurePrimaryIdOnVisibleButton() {
    var primary = doc.getElementById("casepath-quick-exit-btn");
    if (!primary) return;
    if (!isDesktopNavQuickExitViewport() && primary.closest(".nav-quick-exit-slot--desktop")) {
      var utilBtn = doc.querySelector("#casepath-utility-quick-exit-slot .casepath-quick-exit-btn");
      if (utilBtn && utilBtn !== primary) {
        primary.removeAttribute("id");
        utilBtn.id = "casepath-quick-exit-btn";
      }
    }
  }

  function ensureFixedMobileQuickExit() {
    var existing = doc.getElementById(FIXED_MOBILE_WRAP_ID);
    if (!isMobileViewport()) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var mount = buildQuickExitMount(false);
    mount.id = FIXED_MOBILE_WRAP_ID;
    mount.classList.add("cp-quick-exit-wrap--fixed-mobile");
    doc.body.appendChild(mount);
  }

  function mountQuickExitButton() {
    if (!isFeatureEnabled() || !doc || !doc.body) return;

    var existingPrimary = doc.getElementById("casepath-quick-exit-btn");
    if (existingPrimary) {
      upgradeQuickExitWithTooltip(existingPrimary);
    }

    var navSlot = doc.getElementById("casepath-nav-quick-exit-slot");
    var utilSlot = doc.getElementById("casepath-utility-quick-exit-slot");
    var mobileMenuSlot = doc.getElementById("casepath-nav-mobile-quick-exit-slot");
    var assignPrimary = !hasPrimaryQuickExitButton();

    if (isDesktopNavQuickExitViewport()) {
      appendMountToSlot(navSlot, assignPrimary);
      assignPrimary = !hasPrimaryQuickExitButton();
    } else {
      appendMountToSlot(utilSlot, assignPrimary);
      assignPrimary = !hasPrimaryQuickExitButton();
    }

    if (isMobileViewport()) {
      appendMountToSlot(mobileMenuSlot, assignPrimary);
      ensureFixedMobileQuickExit();
    } else {
      ensureFixedMobileQuickExit();
    }

    ensurePrimaryIdOnVisibleButton();

    if (!doc.querySelector(".casepath-quick-exit-btn")) {
      doc.body.appendChild(buildQuickExitMount(true));
    }
  }

  function wireQuickExitViewportListener() {
    if (w.__CASEPATH_QUICK_EXIT_VIEWPORT_WIRED__) return;
    w.__CASEPATH_QUICK_EXIT_VIEWPORT_WIRED__ = true;
    var handler = function () {
      ensureButtonMounted();
    };
    try {
      w.matchMedia(MOBILE_VIEWPORT_MQ).addEventListener("change", handler);
    } catch (_eMq0) {
      try {
        w.matchMedia(MOBILE_VIEWPORT_MQ).addListener(handler);
      } catch (_eMq1) {}
    }
    try {
      w.matchMedia(DESKTOP_NAV_QUICK_EXIT_MQ).addEventListener("change", handler);
    } catch (_eMq2) {
      try {
        w.matchMedia(DESKTOP_NAV_QUICK_EXIT_MQ).addListener(handler);
      } catch (_eMq3) {}
    }
  }

  function ensureButtonMounted() {
    if (!isFeatureEnabled()) return;
    mountQuickExitButton();
  }

  function bootMountOnly() {
    ensureButtonMounted();
    wireQuickExitViewportListener();
    try {
      if (typeof BroadcastChannel !== "undefined" && !w.__CASEPATH_QUICK_EXIT_BC__) {
        var ch = new BroadcastChannel(QUICK_EXIT_CHANNEL);
        ch.onmessage = function (ev) {
          var d = ev && ev.data;
          if (d && d.t === "quick-exit" && d.k === "activate") activateQuickExit({ remote: true });
        };
        w.__CASEPATH_QUICK_EXIT_BC__ = ch;
      }
    } catch (_eBc) {}
    try {
      if (!w.__CASEPATH_QUICK_EXIT_STORAGE_WIRED__) {
        w.__CASEPATH_QUICK_EXIT_STORAGE_WIRED__ = true;
        w.addEventListener("storage", function (ev) {
          if (!ev || ev.key !== QUICK_EXIT_STORAGE_KEY || !ev.newValue) return;
          activateQuickExit({ remote: true });
        });
      }
    } catch (_eStorage) {}
    if (!w.CasePathEvents || typeof w.CasePathEvents.on !== "function") return;
    try {
      w.CasePathEvents.on("shell-ready", ensureButtonMounted);
    } catch (_e18) {}
  }

  if (!doc) return;

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", bootMountOnly);
  } else {
    bootMountOnly();
  }
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
