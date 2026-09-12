/**
 * Marks canonical lower-nav active state from body[data-casepath-active-nav].
 */
(function (doc) {
  "use strict";
  if (!doc || !doc.body) return;

  function evaluateCaseProfileRuntime() {
    var w = typeof window !== "undefined" ? window : null;
    if (w && w.CasePathRouteGates && typeof w.CasePathRouteGates.evaluateCaseProfile === "function") {
      w.CasePathRouteGates.evaluateCaseProfile("shell-active-nav");
      return;
    }
    if (w && typeof w.shouldLoadCaseProfileRuntime === "function" && typeof w.ensureCaseProfileRuntime === "function") {
      if (w.shouldLoadCaseProfileRuntime()) w.ensureCaseProfileRuntime();
    }
  }

  var NAV_ID_MAP = {
    "how-it-works": "nav-how-it-works",
    "quick-start": "nav-quick-start",
    mediation: "nav-mediation",
    "ai-assistant": "nav-ai-assistant",
    assistant: "nav-ai-assistant",
    "doc-helper": "nav-court-documents",
    documents: "nav-court-documents",
    prepare: "nav-prepare-hub",
    "court-documents": "nav-court-documents",
    "more-tools": "nav-more-tools",
    "trusted-partners": "nav-trusted-partners",
    "court-day": "nav-court-day",
    calendar: "nav-calendar",
    vault: "nav-your-case-pulse",
    case: "nav-your-case-pulse",
    pricing: "nav-pricing",
    mission: "nav-mission",
    glossary: "nav-glossary",
    "mental-health": "nav-mental-health",
    kids: "nav-kids",
    "digital-parenting": "nav-digital-parenting",
    "your-team": "nav-your-team",
    "support-tools": "nav-more-tools",
    checklists: "nav-checklists",
    "parenting-orders": "nav-parenting-orders",
    avo: "nav-more-tools",
    "self-represented-guide": "nav-self-represented-guide",
    qa: "nav-ai-assistant",
    referrals: "nav-referrals",
    "lawyer-portal": "nav-lawyer-portal",
    "your-data": "nav-your-data",
  };

  function resolveActiveNavKey() {
    var key = String(doc.body.getAttribute("data-casepath-active-nav") || "").trim();
    if (key) return key;
    try {
      var w = typeof window !== "undefined" ? window : null;
      var path = w && w.location ? String(w.location.pathname || "").toLowerCase() : "";
      if (path.indexOf("/app/workspace") !== -1 || path.indexOf("/your-case") !== -1) return "case";
      if (path.indexOf("/app/assistant") !== -1) return "ai-assistant";
      if (path.indexOf("/app/mediation") !== -1) return "mediation";
    } catch (e0) {}
    return "";
  }

  function applyActiveNav() {
    var key = resolveActiveNavKey();
    if (!key) return;
    var id = NAV_ID_MAP[key] || ("nav-" + key);
    var link = doc.getElementById(id);
    if (!link) return;
    doc.querySelectorAll(
      "#nav-primary-cluster a.active, #nav-guide-grid a.active, #nav-main-grid a.active"
    ).forEach(function (a) {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    });
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
    var menu = link.closest(".nav-cat-menu");
    if (menu && menu.id) {
      var toggle = doc.querySelector('[aria-controls="' + menu.id + '"]');
      if (toggle) {
        toggle.classList.add("active");
        toggle.setAttribute("aria-current", "true");
      }
    }
    if (id === "nav-doc-helper" || id === "nav-court-documents") {
      var prep = doc.getElementById("nav-court-documents");
      if (prep) {
        prep.classList.add("active");
        prep.setAttribute("aria-current", "page");
      }
    }
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () {
      applyActiveNav();
      evaluateCaseProfileRuntime();
    });
  } else {
    applyActiveNav();
    evaluateCaseProfileRuntime();
  }
})(typeof document !== "undefined" ? document : null);
