/**
 * CasePath Signup Wizard — route helpers. Redirects signup entry points to /signup/.
 */
(function (w) {
  "use strict";
  if (!w || w.__CASEPATH_SIGNUP_ROUTE_INIT__) return;
  w.__CASEPATH_SIGNUP_ROUTE_INIT__ = true;

  var BASE = "/signup/";
  var TERMS = "/signup/terms";
  var SECURITY = "/signup/security";

  function rememberReturnUrl() {
    try {
      if (typeof w.rememberCurrentPageReturnUrl === "function") {
        w.rememberCurrentPageReturnUrl();
        return;
      }
      var path = w.location.pathname + w.location.search + w.location.hash;
      if (!path || path.indexOf("/signup") === 0) return;
      sessionStorage.setItem("cr_after_auth_url", path);
    } catch (e) { /* ignore */ }
  }

  function navigateToSignupWizard(opts) {
    opts = opts || {};
    if (!opts.skipRemember) rememberReturnUrl();
    var target = BASE;
    if (opts.step === "terms") target = TERMS;
    else if (opts.step === "security") target = SECURITY;
    try {
      if (w.location.pathname + w.location.search === target.replace(/\/$/, "")) return true;
      w.location.href = target;
      return true;
    } catch (e) {
      return false;
    }
  }

  function isSignupWizardPath() {
    try {
      return (w.location.pathname || "").indexOf("/signup") === 0;
    } catch (e) {
      return false;
    }
  }

  w.casepathSignupWizardBase = BASE;
  w.casepathNavigateToSignupWizard = navigateToSignupWizard;
  w.casepathIsSignupWizardPath = isSignupWizardPath;
})(typeof window !== "undefined" ? window : undefined);
