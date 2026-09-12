/**
 * CASEPATH INTERACTIVE TOOLS ENGINE (v2026.08.26-MAX)
 * Real-time calculation, DAG verification, and Form State persistence.
 */

(function(window) {
  "use strict";

  // Tab Switcher
  window.switchCaseTab = function(tabId) {
    document.querySelectorAll('.tool-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tool-pane').forEach(pane => pane.classList.remove('active'));
    
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const targetPane = document.getElementById(tabId);
    if (targetBtn) targetBtn.classList.add('active');
    if (targetPane) targetPane.classList.add('active');
  };

  // 1. Property Pool Balance Sheet Calculator
  window.calculateAssetPool = function() {
    const realEstate = parseFloat(document.getElementById('calc-realestate')?.value || 0);
    const superannuation = parseFloat(document.getElementById('calc-super')?.value || 0);
    const vehicles = parseFloat(document.getElementById('calc-vehicles')?.value || 0);
    const cashSavings = parseFloat(document.getElementById('calc-cash')?.value || 0);
    
    const mortgage = parseFloat(document.getElementById('calc-mortgage')?.value || 0);
    const loans = parseFloat(document.getElementById('calc-loans')?.value || 0);
    
    const splitPercent = parseFloat(document.getElementById('calc-split')?.value || 50);

    const grossAssets = realEstate + superannuation + vehicles + cashSavings;
    const totalLiabilities = mortgage + loans;
    const netPool = Math.max(0, grossAssets - totalLiabilities);

    const partyAShare = (netPool * (splitPercent / 100));
    const partyBShare = (netPool * ((100 - splitPercent) / 100));

    const fmt = (num) => '$' + num.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const elGross = document.getElementById('res-gross');
    const elLiab = document.getElementById('res-liab');
    const elNet = document.getElementById('res-net');
    const elPartyA = document.getElementById('res-party-a');
    const elPartyB = document.getElementById('res-party-b');

    if (elGross) elGross.textContent = fmt(grossAssets);
    if (elLiab) elLiab.textContent = fmt(totalLiabilities);
    if (elNet) elNet.textContent = fmt(netPool);
    if (elPartyA) elPartyA.textContent = fmt(partyAShare);
    if (elPartyB) elPartyB.textContent = fmt(partyBShare);

    // Commit calculation receipt to Merkle Ledger if initialized
    if (window.casepathLedger) {
      window.casepathLedger.commit("PROPERTY_POOL_CALCULATED", { grossAssets, totalLiabilities, netPool, splitPercent });
    }
  };

  // 2. Parenting Schedule Night Rotation Calculator
  window.calculateParentingSchedule = function() {
    const pattern = document.getElementById('parenting-pattern')?.value || "5-2-2-5";
    const weeksPerYear = 52;
    let parentANights = 7;
    let parentBNights = 7;

    if (pattern === "week-about") {
      parentANights = 7; parentBNights = 7;
    } else if (pattern === "5-2-2-5") {
      parentANights = 7; parentBNights = 7;
    } else if (pattern === "9-5") {
      parentANights = 9; parentBNights = 5;
    } else if (pattern === "10-4") {
      parentANights = 10; parentBNights = 4;
    } else if (pattern === "alternate-weekends") {
      parentANights = 12; parentBNights = 2;
    }

    const fortnightNights = 14;
    const parentAPercent = ((parentANights / fortnightNights) * 100).toFixed(1);
    const parentBPercent = ((parentBNights / fortnightNights) * 100).toFixed(1);

    const elPctA = document.getElementById('res-parent-a-pct');
    const elPctB = document.getElementById('res-parent-b-pct');
    const elNightsA = document.getElementById('res-parent-a-nights');
    const elNightsB = document.getElementById('res-parent-b-nights');

    if (elPctA) elPctA.textContent = parentAPercent + '%';
    if (elPctB) elPctB.textContent = parentBPercent + '%';
    if (elNightsA) elNightsA.textContent = `${parentANights * 26} nights / yr`;
    if (elNightsB) elNightsB.textContent = `${parentBNights * 26} nights / yr`;
  };

  // 3. FCFCOA Jurisdiction / List Triage Helper
  window.triageJurisdiction = function() {
    const matterType = document.getElementById('triage-matter')?.value;
    const urgency = document.getElementById('triage-urgency')?.value;
    const familyViolence = document.getElementById('triage-violence')?.value;

    let targetList = "Standard Family Law Pathway (FCFCOA Division 2)";
    let recommendation = "Filing standard Initiating Application after Section 60I Family Dispute Resolution (FDR) certificate.";

    if (urgency === "immediate") {
      targetList = "Urgent / Duty Judge List";
      recommendation = "Application for Urgent Interim Orders without prior mediation certificate required.";
    } else if (familyViolence === "yes") {
      targetList = "Evatt List (High Risk Safety Pathway)";
      recommendation = "Specialized judicial management with immediate risk assessment (DOOR 2) and accelerated court allocation.";
    } else if (matterType === "property_under_500k") {
      targetList = "Priority Property Pool under $500k (PPP500 List)";
      recommendation = "Streamlined financial disclosure pathway with reduced trial documentation.";
    }

    const elTitle = document.getElementById('triage-res-title');
    const elDesc = document.getElementById('triage-res-desc');
    if (elTitle) elTitle.textContent = targetList;
    if (elDesc) elDesc.textContent = recommendation;
  };

  // 4. Instant Legal Glossary Filter
  window.filterGlossary = function() {
    const query = (document.getElementById('glossary-search')?.value || '').toLowerCase().trim();
    const items = document.querySelectorAll('.glossary-card');
    let visibleCount = 0;

    items.forEach(item => {
      const term = (item.getAttribute('data-term') || '').toLowerCase();
      const def = item.textContent.toLowerCase();
      if (term.includes(query) || def.includes(query)) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    const elCount = document.getElementById('glossary-count');
    if (elCount) elCount.textContent = `Showing ${visibleCount} terms`;
  };

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    if (window.calculateAssetPool) window.calculateAssetPool();
    if (window.calculateParentingSchedule) window.calculateParentingSchedule();
    if (window.triageJurisdiction) window.triageJurisdiction();
  });
})(window);
