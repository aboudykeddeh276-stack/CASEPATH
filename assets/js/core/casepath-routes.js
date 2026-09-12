/**
 * Canonical CasePath route registry — single source of truth for URLs.
 * Safe on static hosts; no build step required.
 */
(function () {
  var R = {
    home: "/index.html",
    glossary: "/glossary.html",
    mission: "/mission.html",
    whatListIsMyCaseIn: "/what-list-is-my-case-in.html",
    howItWorks: "/how-it-works.html",
    pricing: "/pricing.html",
    kids: "/kids.html",
    mentalHealth: "/mental-health.html",
    selfRepresentedGuide: "/self-represented-guide.html",
    courtDayPreparation: "/court-day-preparation.html",
    prepare: "/prepare.html",
    supportTools: "/support-tools.html",
    checklists: "/checklists.html",
    /** Canonical Document Centre static shell. */
    documentCentre: "/document-centre.html",
    formatAffidavit: "/format-affidavit.html",
    formatParentingOrders: "/format-parenting-orders.html",
    formatCourtApplication: "/format-court-application.html",
    chronologyBuilder: "/chronology-builder.html",
    evidenceCatalogue: "/evidence-catalogue.html",
    exhibitRegister: "/exhibit-register.html",
    communicationLog: "/communication-log.html",
    incidentTimeline: "/incident-timeline.html",
    yourCase: "/app/workspace/index.html",
    calendar: "/app/calendar/index.html",
    /** Thin app entry points (redirect shells) */
    appWorkspace: "/app/workspace/index.html",
    /** Canonical Ask a Question — home SPA #page-qa (legacy /app/assistant/ is not the chat surface). */
    askQuestion: "/index.html?goto=qa",
    appAssistant: "/index.html?goto=qa",
    appDocuments: "/document-centre.html",
    appCalendar: "/app/calendar/index.html",
    appMediation: "/app/mediation/index.html",
    mediation: "/app/mediation/index.html",
    /** @deprecated alias — use appMediation */
    mediationComingSoon: "/app/mediation/index.html",
    mediationBeta: "/app/mediation/index.html",
    mediationStaging: "/app/mediation/index.html",
    /** Legacy SPA page ids still served from index until extracted */
    spa: {
      vault: "/app/workspace/index.html",
      workspace: "/app/workspace/index.html",
      "doc-helper": "/document-centre.html",
      "document-centre": "/document-centre.html",
      document: "/document-centre.html",
      documents: "/document-centre.html",
      assistant: "/index.html?goto=qa",
      "ai-assistant": "/index.html?goto=qa",
      calendar: "/app/calendar/index.html",
      forms: "/index.html",
      qa: "/index.html?goto=qa",
      avo: "/protection-orders.html",
      "self-represented-guide": "/self-represented-guide.html",
      "court-day-preparation": "/court-day-preparation.html",
      prepare: "/prepare.html",
      "parenting-orders": "/parenting-orders.html",
      "your-team": "/your-team.html",
      referrals: "/referrals.html",
      "lawyer-portal": "/lawyer-portal.html",
      legislation: "/glossary.html",
      "start-case": "/index.html"
    }
  };

  function gotoHref(pageId) {
    var id = String(pageId || "").trim();
    if (!id) return R.home;
    return "/?goto=" + encodeURIComponent(id);
  }

  function askQuestionHref() {
    return R.askQuestion || gotoHref("qa");
  }

  function url(key) {
    if (!key) return R.home;
    var k = String(key);
    if (R[k] != null) return R[k];
    if (R.spa[k] != null) return R.spa[k];
    return R.home;
  }

  function assignHref(href) {
    var h = href || R.home;
    if (
      window.CasePathAuth &&
      window.CasePathAuth.redirect &&
      typeof window.CasePathAuth.redirect.safeAssignHref === "function"
    ) {
      return window.CasePathAuth.redirect.safeAssignHref(h);
    }
    window.location.href = h;
    return true;
  }

  function go(keyOrId) {
    return assignHref(url(keyOrId));
  }

  window.CasePathRoutes = {
    R: R,
    url: url,
    gotoHref: gotoHref,
    askQuestionHref: askQuestionHref,
    assignHref: assignHref,
    go: go,
    /** Canonical authenticated workspace URL (alias of appWorkspace / yourCase). */
    workspace: R.appWorkspace,
  };
})();
