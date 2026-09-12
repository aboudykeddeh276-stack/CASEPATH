(function () {
  "use strict";

  var HEADER_SELECTOR = "body > header.header";
  var CANONICAL_HEADER_SELECTOR = "body > header.header .casepath-nav-categorized";
  var GREEN_SELECTOR = "body > header.header .nav-green-bar";

  function markCanonicalHeader() {
    var headers = Array.prototype.slice.call(document.querySelectorAll(HEADER_SELECTOR));
    headers.forEach(function (header) {
      if (!header.querySelector(".casepath-nav-categorized")) return;
      header.classList.add("cp-site-header");
      header.setAttribute("data-cp-header-system", "canonical");
    });
  }

  function normalizeGreenBars() {
    Array.prototype.slice.call(document.querySelectorAll(GREEN_SELECTOR)).forEach(function (bar) {
      bar.classList.add("cp-announcement-bar");
      bar.setAttribute("data-cp-green-role", "global-info-strip");
    });
  }

  function removeDuplicateHeaderStacks() {
    if (!document.querySelector(CANONICAL_HEADER_SELECTOR)) return;

    var seen = false;
    Array.prototype.slice.call(document.querySelectorAll(HEADER_SELECTOR)).forEach(function (header) {
      if (!header.querySelector(".casepath-nav-categorized")) return;
      if (!seen) {
        seen = true;
        return;
      }
      header.setAttribute("hidden", "");
      header.setAttribute("aria-hidden", "true");
      header.setAttribute("data-cp-header-duplicate-hidden", "true");
    });

    Array.prototype.slice.call(document.querySelectorAll("body > .disclaimer-banner")).forEach(function (banner, index) {
      if (index === 0) return;
      banner.setAttribute("hidden", "");
      banner.setAttribute("aria-hidden", "true");
      banner.setAttribute("data-cp-header-duplicate-hidden", "true");
    });

    Array.prototype.slice.call(document.querySelectorAll("body > .casepath-utility-bar")).forEach(function (bar, index) {
      if (index === 0) return;
      bar.setAttribute("hidden", "");
      bar.setAttribute("aria-hidden", "true");
      bar.setAttribute("data-cp-header-duplicate-hidden", "true");
    });
  }

  function publishPrivacyBannerHeight() {
    var banner = document.querySelector("body > header.header .cp-privacy-banner");
    var height = 0;

    if (banner && getComputedStyle(banner).display !== "none") {
      height = Math.ceil(banner.getBoundingClientRect().height);
    }

    document.documentElement.style.setProperty(
      "--cp-privacy-banner-height",
      (height > 0 ? height : 36) + "px"
    );
  }

  function publishMetrics() {
    var header = document.querySelector("body > header.header[data-cp-header-system='canonical']");
    var green = document.querySelector(GREEN_SELECTOR);
    var privacyBanner = document.querySelector("body > header.header .cp-privacy-banner");

    publishPrivacyBannerHeight();

    window.CasePathHeaderSystem = {
      version: "20260527-header-standardisation",
      canonicalHeaderCount: document.querySelectorAll(CANONICAL_HEADER_SELECTOR).length,
      greenStripCount: document.querySelectorAll(GREEN_SELECTOR).length,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
      greenStripHeight: green ? Math.round(green.getBoundingClientRect().height) : 0,
      privacyBannerHeight: privacyBanner ? Math.round(privacyBanner.getBoundingClientRect().height) : 0
    };
  }

  function syncHeader() {
    markCanonicalHeader();
    normalizeGreenBars();
    removeDuplicateHeaderStacks();
    publishMetrics();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncHeader, { once: true });
  } else {
    syncHeader();
  }

  window.addEventListener("load", syncHeader, { once: true });

  window.addEventListener("resize", publishPrivacyBannerHeight, { passive: true });
  window.addEventListener("orientationchange", publishPrivacyBannerHeight, { passive: true });

  if (typeof ResizeObserver !== "undefined") {
    var privacyBannerObserver = new ResizeObserver(publishPrivacyBannerHeight);
    document.addEventListener("DOMContentLoaded", function () {
      var banner = document.querySelector("body > header.header .cp-privacy-banner");
      if (banner) privacyBannerObserver.observe(banner);
    }, { once: true });
  }
})();
