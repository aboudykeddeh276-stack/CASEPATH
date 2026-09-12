/**
 * CASEPATH MASTER WORKSTATION RUNTIME (v2026.08.26-MAX)
 * Binds DOM to TransactionalVFS, MerkleReceiptLedger, and Statutory Rule Engines.
 */

(function(window) {
  "use strict";

  // Initialize Sovereign Substrate
  const vfs = new window.KeddehCoreEvolution.TransactionalVFS();
  const ledger = new window.KeddehCoreEvolution.MerkleReceiptLedger();
  const dag = new window.KeddehCoreEvolution.DAGEngine();

  window.casepathVFS = vfs;
  window.casepathLedger = ledger;
  window.casepathDAG = dag;

  const propEngine = new window.CasePathStatutory.PropertySettlementEngine();
  const parentingEngine = new window.CasePathStatutory.ParentingScheduleEngine();
  const affidavitEngine = new window.CasePathStatutory.AffidavitBuilderEngine();

  window.casepathProp = propEngine;
  window.casepathParenting = parentingEngine;
  window.casepathAffidavit = affidavitEngine;

  // Register DAG Skills
  dag.register({
    id: "VALIDATE_PROPERTY_INPUTS",
    run: async ({ prop }) => {
      const result = prop.compute();
      vfs.set("/session/property/result.json", result, { type: "PROPERTY_SETTLEMENT" });
      await ledger.commit("PROPERTY_SETTLEMENT_CALCULATED", { netPool: result.step1_pool.totalGlobalNetPool, splitA: result.step4_finalSplit.partyAPercent });
      return result;
    }
  });

  dag.register({
    id: "COMPILE_DOC_PACKET",
    dependsOn: ["VALIDATE_PROPERTY_INPUTS"],
    run: async ({ results, affidavit }) => {
      const affidavitDoc = affidavit.compileCourtReadyAffidavit();
      vfs.set("/session/affidavit/draft.txt", affidavitDoc, { type: "COURT_AFFIDAVIT" });
      const receipt = await ledger.commit("COURT_PACKET_SEALED", { docLength: affidavitDoc.length });
      return { affidavitDoc, receiptHash: receipt.hash, status: "READY_FOR_LEGAL_PRACTITIONER" };
    }
  });

  // UI Interactive Handlers
  window.runPropertyComputation = async function() {
    // Collect Inputs
    const homeVal = parseFloat(document.getElementById('cp-prop-home')?.value || 0);
    const homeDebt = parseFloat(document.getElementById('cp-prop-debt')?.value || 0);
    const superA = parseFloat(document.getElementById('cp-prop-super-a')?.value || 0);
    const superB = parseFloat(document.getElementById('cp-prop-super-b')?.value || 0);
    const cash = parseFloat(document.getElementById('cp-prop-cash')?.value || 0);
    const loans = parseFloat(document.getElementById('cp-prop-loans')?.value || 0);

    propEngine.assets = [
      { name: "Real Estate (Matrimonial Home)", category: "Real Estate", value: homeVal, party: "Joint" },
      { name: "Cash Savings & Investments", category: "Cash", value: cash, party: "Joint" }
    ];
    propEngine.liabilities = [
      { name: "Mortgage on Home", category: "Mortgage", value: homeDebt, party: "Joint" },
      { name: "Personal Loans / Credit", category: "Credit", value: loans, party: "Joint" }
    ];
    propEngine.superannuation = [
      { name: "Superannuation (Party A)", value: superA, party: "Party A" },
      { name: "Superannuation (Party B)", value: superB, party: "Party B" }
    ];

    propEngine.futureNeeds.earningDisparity = document.getElementById('cp-prop-earning')?.value || "equal";
    propEngine.futureNeeds.primaryCareOfChildren = document.getElementById('cp-prop-care')?.value || "equal";

    const res = await dag.executePipeline(["VALIDATE_PROPERTY_INPUTS"], { prop: propEngine });
    const computed = res.VALIDATE_PROPERTY_INPUTS;

    const fmt = (n) => '$' + Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });

    const elNet = document.getElementById('cp-out-net-pool');
    const elSplitA = document.getElementById('cp-out-split-a');
    const elSplitB = document.getElementById('cp-out-split-b');
    const elAmtA = document.getElementById('cp-out-amt-a');
    const elAmtB = document.getElementById('cp-out-amt-b');
    const elHash = document.getElementById('cp-out-merkle-hash');

    if (elNet) elNet.textContent = fmt(computed.step1_pool.totalGlobalNetPool);
    if (elSplitA) elSplitA.textContent = computed.step4_finalSplit.partyAPercent + '%';
    if (elSplitB) elSplitB.textContent = computed.step4_finalSplit.partyBPercent + '%';
    if (elAmtA) elAmtA.textContent = fmt(computed.step4_finalSplit.partyAAmount);
    if (elAmtB) elAmtB.textContent = fmt(computed.step4_finalSplit.partyBAmount);

    if (elHash && ledger.chain.length > 0) {
      elHash.textContent = ledger.chain[ledger.chain.length - 1].hash.substring(0, 16) + '...';
    }
  };

  // Affidavit live builder
  window.addAffidavitFact = function() {
    const topic = document.getElementById('cp-aff-topic')?.value || 'General Fact';
    const text = document.getElementById('cp-aff-text')?.value;
    if (!text || text.trim() === '') return;

    affidavitEngine.deponent = document.getElementById('cp-aff-deponent')?.value || 'Applicant';
    affidavitEngine.addParagraph(text.trim(), topic);
    document.getElementById('cp-aff-text').value = '';

    renderAffidavitPreview();
  };

  window.addAffidavitAnnexure = function() {
    const mark = document.getElementById('cp-annex-mark')?.value || 'A';
    const desc = document.getElementById('cp-annex-desc')?.value;
    const pages = document.getElementById('cp-annex-pages')?.value || 1;
    if (!desc || desc.trim() === '') return;

    affidavitEngine.addAnnexure(mark, desc.trim(), new Date().toLocaleDateString('en-AU'), pages);
    document.getElementById('cp-annex-desc').value = '';
    renderAffidavitPreview();
  };

  function renderAffidavitPreview() {
    const previewEl = document.getElementById('cp-aff-preview');
    if (previewEl) {
      previewEl.textContent = affidavitEngine.compileCourtReadyAffidavit();
    }
  }

  // Export Packet to downloadable text / court format
  window.exportCourtPacket = function() {
    const packet = affidavitEngine.compileCourtReadyAffidavit();
    const blob = new Blob([packet], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CasePath_Court_Affidavit_Draft_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (window.runPropertyComputation) window.runPropertyComputation();
  });

})(window);
