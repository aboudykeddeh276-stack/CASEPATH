/**
 * Single deploy version for CasePath frontend bundles (cache-bust query ?v=).
 * Load synchronously in <head>
<meta name="casepath-build" content="20260607mobile1"> before other app scripts.
 */
(function (w) {
  "use strict";
  if (!w) return;
  w.__CASEPATH_ASSET_VERSION__ = "20260727iosscroll1";
})(typeof window !== "undefined" ? window : this);
