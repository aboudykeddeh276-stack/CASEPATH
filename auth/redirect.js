/**
 * Same-origin safe navigation helper (Phase 3).
 * Blocks absolute URLs, protocol-relative URLs, dangerous schemes, encoded
 * open redirects, path traversal, and credential-like URL shapes.
 */
(function (global) {
  var NS = (global.CasePathAuth = global.CasePathAuth || {});

  function trimPath(s) {
    return String(s || "").trim();
  }

  function decodeIteratively(s, max) {
    var cur = String(s || "");
    var n = typeof max === "number" ? max : 6;
    while (n-- > 0) {
      try {
        var dec = decodeURIComponent(cur);
        if (dec === cur) break;
        cur = dec;
      } catch (e) {
        return null;
      }
    }
    return cur;
  }

  /**
   * @param {string} path - Relative path only (e.g. "/", "/index.html", "/document-centre.html")
   * @returns {string|null} Sanitised path or null if unsafe
   */
  function sanitiseRelativePath(path) {
    var p = trimPath(path);
    if (!p) return null;
    p = decodeIteratively(p, 8);
    if (p == null) return null;
    p = trimPath(p);
    var lower = p.toLowerCase();
    if (
      lower.indexOf("javascript:") === 0 ||
      lower.indexOf("data:") === 0 ||
      lower.indexOf("vbscript:") === 0
    ) {
      return null;
    }
    if (/^https?:\/\//i.test(p)) return null;
    if (/^\/\//.test(p)) return null;
    if (!p.startsWith("/")) return null;
    if (/[\u0000-\u001f\\]/.test(p)) return null;
    if (p.indexOf("@") !== -1) return null;
    var q = p.indexOf("?");
    var pathOnly = p;
    if (q !== -1) pathOnly = p.slice(0, q);
    if (pathOnly.indexOf("//") !== -1) return null;
    var segs = pathOnly.split("/");
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if (seg === "..") return null;
      var sl = seg.toLowerCase();
      if (sl === "." && seg.length === 1) continue;
    }
    return p;
  }

  /**
   * SPA ?goto= token: safe HTML id fragment only (prevents query injection into routing).
   * @param {string} raw
   * @returns {string|null}
   */
  function normalisePathname(path) {
    var p = String(path || "/").trim().toLowerCase();
    if (!p) return "/";
    if (p.charAt(0) !== "/") p = "/" + p;
    p = p.replace(/\/+$/, "") || "/";
    return p;
  }

  function isDocumentCentrePath(pathOrHref) {
    var raw = String(pathOrHref || "");
    var q = raw.indexOf("?");
    var pathOnly = q === -1 ? raw : raw.slice(0, q);
    var p = normalisePathname(pathOnly);
    return p === "/document-centre" || p === "/document-centre.html" || p.indexOf("/document-centre/") === 0;
  }

  function isIndexShellPath(pathOrHref) {
    var raw = String(pathOrHref || "");
    var q = raw.indexOf("?");
    var pathOnly = q === -1 ? raw : raw.slice(0, q);
    var p = normalisePathname(pathOnly);
    return p === "/" || p === "/index.html";
  }

  function isDocumentCentreHandoffTarget(pathOrHref) {
    var raw = String(pathOrHref || "");
    if (!raw) return false;
    if (isDocumentCentrePath(raw)) return true;
    try {
      var q = raw.indexOf("?");
      var pathOnly = q === -1 ? raw : raw.slice(0, q);
      var params = new URLSearchParams(q === -1 ? "" : raw.slice(q + 1));
      var goto = String(params.get("goto") || "")
        .trim()
        .toLowerCase();
      if (
        (normalisePathname(pathOnly) === "/" || normalisePathname(pathOnly) === "/index.html") &&
        (goto === "doc-helper" ||
          goto === "document" ||
          goto === "documents" ||
          goto === "document-centre" ||
          goto === "document-helper")
      ) {
        return true;
      }
    } catch (_eHandoff) {}
    return false;
  }

  function shouldBlockDocumentCentreToIndex(target) {
    if (!isDocumentCentrePath(global.location.pathname)) return false;
    var safe = sanitiseRelativePath(target);
    if (!safe) return false;
    return isIndexShellPath(safe);
  }

  function redirectTrace(target, reason, method) {
    try {
      var current =
        String(global.location.pathname || "/") +
        String(global.location.search || "") +
        String(global.location.hash || "");
      console.warn("REDIRECT TRACE", current, target, reason || method || "redirect");
    } catch (_eTrace) {}
  }

  function sanitiseSpaGotoToken(raw) {
    var s = trimPath(String(raw || ""));
    if (!s) return null;
    if (!/^[a-z0-9_-]{1,80}$/i.test(s)) return null;
    s = s.toLowerCase();
    if (s === "document" || s === "documents" || s === "document-centre" || s === "document-helper") {
      return "doc-helper";
    }
    if (s === "your-case" || s === "case" || s === "workspace") {
      return "vault";
    }
    if (s === "assistant") {
      return "ai-assistant";
    }
    return s;
  }

  function safeRedirect(path) {
    var safe = sanitiseRelativePath(path);
    if (!safe) {
      console.warn("CasePathAuth.safeRedirect: blocked unsafe path");
      safe = "/";
    }
    if (shouldBlockDocumentCentreToIndex(safe)) {
      redirectTrace(safe, "blocked_document_centre_to_index", "skip");
      return;
    }
    if (isDocumentCentrePath(safe) && isDocumentCentrePath(global.location.pathname)) {
      return;
    }
    redirectTrace(safe, "CasePathAuth.safeRedirect", "replace");
    try {
      global.location.replace(safe);
    } catch (e) {
      try {
        global.location.href = safe;
      } catch (e2) {
        console.warn("CasePathAuth.safeRedirect: navigation failed", e2);
      }
    }
  }

  /** Global alias for auth flows (same-origin relative paths only). */
  try {
    global.safeRedirect = safeRedirect;
  } catch (eExp) {
    /* ignore */
  }

  function safeAssignHref(path) {
    var safe = sanitiseRelativePath(path);
    if (!safe) {
      console.warn("CasePathAuth.safeAssignHref: blocked unsafe path");
      return false;
    }
    if (shouldBlockDocumentCentreToIndex(safe)) {
      redirectTrace(safe, "blocked_document_centre_to_index", "skip");
      return true;
    }
    if (isDocumentCentrePath(safe) && isDocumentCentrePath(global.location.pathname)) {
      return true;
    }
    redirectTrace(safe, "CasePathAuth.safeAssignHref", "href");
    try {
      global.location.href = safe;
      return true;
    } catch (e) {
      console.warn("CasePathAuth.safeAssignHref: failed", e);
      return false;
    }
  }

  /**
   * Reload the SPA shell without using "/" alone. Many local static servers
   * (e.g. Live Server) serve the app at /index.html while "/" lists the folder
   * or returns 404 — after sign-in, replace("/") then looks like "can't sign in".
   */
  function stableShellPath() {
    try {
      var p = String(global.location.pathname || "/");
      var h = String(global.location.hostname || "").toLowerCase();
      var isLocal =
        h === "localhost" ||
        h === "127.0.0.1" ||
        h === "[::1]" ||
        h === "::1";
      if (/index\.html$/i.test(p)) return p;
      if (isDocumentCentrePath(p)) return "/document-centre.html";
      if (isLocal && (p === "/" || p === "")) {
        try {
          var port = String(global.location.port || "");
          if (h === "localhost" && (port === "3000" || port === "3001")) return "/";
        } catch (e2) {
          /* ignore */
        }
        return "/index.html";
      }
      if (p === "/" || p === "") return "/";
      var slash = p.lastIndexOf("/");
      if (slash > 0) {
        return p.slice(0, slash + 1) + "index.html";
      }
    } catch (e) {
      /* ignore */
    }
    return "/index.html";
  }

  function safeStableShell() {
    safeRedirect(stableShellPath());
  }

  NS.redirect = NS.redirect || {};
  NS.redirect.safe = safeRedirect;
  NS.redirect.safeAssignHref = safeAssignHref;
  NS.redirect.sanitiseRelativePath = sanitiseRelativePath;
  NS.redirect.sanitiseSpaGotoToken = sanitiseSpaGotoToken;
  NS.redirect.stableShellPath = stableShellPath;
  NS.redirect.safeStableShell = safeStableShell;
  NS.redirect.isDocumentCentrePath = isDocumentCentrePath;
  NS.redirect.isIndexShellPath = isIndexShellPath;
  NS.redirect.isDocumentCentreHandoffTarget = isDocumentCentreHandoffTarget;
  NS.redirect.shouldBlockDocumentCentreToIndex = shouldBlockDocumentCentreToIndex;
  NS.redirect.redirectTrace = redirectTrace;
})(typeof window !== "undefined" ? window : this);
