/**
 * CasePath governance quarantine — disables high-risk generators while preserving routes/shell.
 * Form assistants (field collection → formatting tools) are NOT quarantined.
 * @see docs/GOVERNANCE_QUARANTINED_FEATURES.md
 */
(function (w, doc) {
  "use strict";
  if (!w || !doc) return;

  var QUARANTINE_ATTR = "governance-review";
  var NOTICE_CLASS = "cp-governance-quarantine-notice";
  var NOTICE_TEXT = "This feature is currently being updated.";
  var EXPORT_WATERMARK = "Draft for review only";
  var EXPORT_FOOTER =
    "CasePath provides preparation and organisation tools only. CasePath is not a law firm, does not provide legal advice, and does not create a solicitor-client relationship. Have any output reviewed by a qualified lawyer before filing, serving, or relying on it.";

  /** Generators that assemble court-style content — remain blocked. */
  var QUARANTINED_GENERATORS = {
    "parenting-orders-generator": true,
    "document-helper-generator": true,
    "bfa-prenup-generator": true,
  };

  function isQuarantined(featureId) {
    if (!featureId) return false;
    return !!QUARANTINED_GENERATORS[String(featureId)];
  }

  function isGeneratorQuarantined(featureId) {
    return isQuarantined(featureId);
  }

  function ensureNotice(host) {
    if (!host || host.querySelector("." + NOTICE_CLASS)) return;
    var notice = doc.createElement("div");
    notice.className = NOTICE_CLASS;
    notice.setAttribute("role", "status");
    notice.innerHTML =
      "<p><strong>" +
      NOTICE_TEXT +
      "</strong></p>" +
      "<p class=\"cp-governance-quarantine-sub\">CasePath is preparing a safer version focused on notes, chronology, and review-ready organisation — not court-style drafting.</p>";
    host.insertBefore(notice, host.firstChild);
  }

  function applyDomQuarantine() {
    var nodes = doc.querySelectorAll('[data-casepath-disabled="' + QUARANTINE_ATTR + '"]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.setAttribute("aria-disabled", "true");
      ensureNotice(el);
      var interactive = el.querySelectorAll(
        "button, input, select, textarea, a[onclick], [contenteditable=true]"
      );
      for (var j = 0; j < interactive.length; j++) {
        var node = interactive[j];
        if (node.closest("." + NOTICE_CLASS)) continue;
        node.setAttribute("disabled", "disabled");
        node.setAttribute("tabindex", "-1");
        if (node.tagName === "A") {
          node.removeAttribute("onclick");
          node.style.pointerEvents = "none";
        }
      }
    }
  }

  function wrapExportHtml(html) {
    var body = String(html || "");
    var banner =
      '<div class="cp-export-governance-banner" style="border:2px solid #b45309;background:#fffbeb;color:#78350f;padding:0.75rem 1rem;margin:0 0 1.25rem;font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;">' +
      "<strong>" +
      EXPORT_WATERMARK +
      "</strong> — " +
      EXPORT_FOOTER +
      "</div>";
    var footer =
      '<div class="cp-export-governance-footer" style="margin-top:2rem;padding-top:0.75rem;border-top:1px solid #ccc;font-family:Arial,sans-serif;font-size:9pt;color:#555;line-height:1.45;">' +
      EXPORT_WATERMARK +
      ". " +
      EXPORT_FOOTER +
      "</div>";
    if (body.indexOf("cp-export-governance-banner") !== -1) return body;
    if (/<body[^>]*>/i.test(body)) {
      return body.replace(/<body([^>]*)>/i, "<body$1>" + banner).replace(/<\/body>/i, footer + "</body>");
    }
    return banner + body + footer;
  }

  function showQuarantineAlert() {
    try {
      alert(NOTICE_TEXT);
    } catch (_e) {}
  }

  w.CasePathGovernance = {
    QUARANTINE_ATTR: QUARANTINE_ATTR,
    QUARANTINED_GENERATORS: QUARANTINED_GENERATORS,
    isQuarantined: isQuarantined,
    isGeneratorQuarantined: isGeneratorQuarantined,
    noticeText: NOTICE_TEXT,
    showQuarantineNotice: showQuarantineAlert,
    applyDomQuarantine: applyDomQuarantine,
    wrapExportHtml: wrapExportHtml,
    exportWatermark: EXPORT_WATERMARK,
    exportFooter: EXPORT_FOOTER,
  };

  function boot() {
    applyDomQuarantine();
    try {
      doc.addEventListener("casepath:fragment-loaded", applyDomQuarantine);
    } catch (_e2) {}
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window, document);
