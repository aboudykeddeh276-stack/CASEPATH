/**
 * Header language UI for static CasePath pages (preference + dropdown only).
 */
(function () {
  (function ensureSiteLanguageStore(g) {
    if (g.casepathSiteLanguageGet) return;
    function isDevHost() {
      var h = (location.hostname || "").toLowerCase();
      return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
    }
    g.casepathSiteLanguageGet = function () {
      try {
        return isDevHost() ? sessionStorage.getItem("siteLanguage") : localStorage.getItem("siteLanguage");
      } catch (e) {
        return null;
      }
    };
    g.casepathSiteLanguageSet = function (code) {
      try {
        (isDevHost() ? sessionStorage : localStorage).setItem("siteLanguage", code);
      } catch (e2) {}
    };
    if (isDevHost()) {
      try {
        var expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "googtrans=;" + expire + ";path=/";
        document.cookie = "googtrans=;" + expire + ";path=/;domain=" + location.hostname;
      } catch (e3) {}
    }
  })(window);

  window.toggleLangDropdown = function (e) {
    if (e && e.stopPropagation) e.stopPropagation();
    var dd = document.getElementById("lang-dropdown");
    if (dd) dd.classList.toggle("open");
  };

  window.setLang = function (langCode, flag, label) {
    var dd = document.getElementById("lang-dropdown");
    if (dd) dd.classList.remove("open");
    document.querySelectorAll(".lang-option").forEach(function (btn) {
      var oc = btn.getAttribute("onclick") || "";
      btn.classList.toggle("active", oc.indexOf("'" + langCode + "'") !== -1);
    });
    var f = document.getElementById("lang-current-flag");
    var l = document.getElementById("lang-current-label");
    if (f) f.textContent = flag;
    if (l) l.textContent = label;
    if (window.casepathSiteLanguageSet) window.casepathSiteLanguageSet(langCode);
    else {
      try {
        localStorage.setItem("siteLanguage", langCode);
      } catch (err) {}
    }
    var langSelect = document.getElementById("languageSwitcher");
    if (langSelect && langSelect.querySelector('option[value="' + langCode + '"]')) {
      langSelect.value = langCode;
    }
  };

  document.addEventListener("click", function () {
    var dd = document.getElementById("lang-dropdown");
    if (dd) dd.classList.remove("open");
  });

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("page-home")) return;
    var wrap = document.getElementById("lang-selector-wrap");
    if (!wrap) return;
    wrap.style.removeProperty("display");
    var inlineRest = wrap.getAttribute("style");
    if (!inlineRest || !String(inlineRest).trim()) {
      wrap.removeAttribute("style");
    }
    var btn = document.getElementById("lang-btn");
    if (btn) {
      btn.removeAttribute("disabled");
      btn.style.removeProperty("opacity");
      btn.style.removeProperty("cursor");
    }

    try {
      var savedLang = window.casepathSiteLanguageGet
        ? window.casepathSiteLanguageGet()
        : localStorage.getItem("siteLanguage");
      if (savedLang) window.setLang(savedLang, "", "");
    } catch (e2) {}
  });
})();
