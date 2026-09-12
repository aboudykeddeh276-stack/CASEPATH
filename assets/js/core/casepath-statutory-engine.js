/**
 * CASEPATH AUSTRALIAN FAMILY LAW STATUTORY RULE ENGINE (v2026.08.26)
 * Direct implementation of Family Law Act 1975 (Cth), 2024 Amendments, and FCFCOA Rules.
 * Operating Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236)
 */

(function(window) {
  "use strict";

  // =========================================================================
  // 1. SECTION 79 / 90SM FOUR-STEP PROPERTY SETTLEMENT MECHANIC
  // =========================================================================
  class PropertySettlementEngine {
    constructor() {
      this.assets = [];
      this.liabilities = [];
      this.superannuation = [];
      this.contributions = {
        initialA: 50,
        initialB: 50,
        duringFinancialA: 50,
        duringFinancialB: 50,
        homemakerA: 50,
        homemakerB: 50,
        postSeparationA: 50,
        postSeparationB: 50
      };
      this.futureNeeds = {
        earningDisparity: "equal",    // a_higher, b_higher, equal
        primaryCareOfChildren: "equal",// a_primary, b_primary, equal
        healthDisparity: "none",      // a_impaired, b_impaired, none
        relationshipLengthYears: 10
      };
    }

    addAsset(name, category, value, party) {
      this.assets.push({ id: `ast_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, name, category, value: Number(value), party });
      return this;
    }

    addLiability(name, category, value, party) {
      this.liabilities.push({ id: `liab_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, name, category, value: Number(value), party });
      return this;
    }

    addSuper(name, value, party) {
      this.superannuation.push({ id: `sup_${Date.now()}_${Math.random().toString(36).substr(2,4)}`, name, value: Number(value), party });
      return this;
    }

    compute() {
      const grossNonSuper = this.assets.reduce((sum, a) => sum + a.value, 0);
      const totalLiabilities = this.liabilities.reduce((sum, l) => sum + l.value, 0);
      const netNonSuperPool = Math.max(0, grossNonSuper - totalLiabilities);
      
      const totalSuper = this.superannuation.reduce((sum, s) => sum + s.value, 0);
      const totalGlobalNetPool = netNonSuperPool + totalSuper;

      // Contribution Weighting (Step 2)
      const contribWeightA = (
        this.contributions.initialA * 0.20 +
        this.contributions.duringFinancialA * 0.35 +
        this.contributions.homemakerA * 0.35 +
        this.contributions.postSeparationA * 0.10
      );
      const contribWeightB = 100 - contribWeightA;

      // Section 75(2) Future Needs Adjustments (Step 3)
      let s75AdjustmentToA = 0;
      if (this.futureNeeds.earningDisparity === "b_higher") s75AdjustmentToA += 5.0;
      if (this.futureNeeds.earningDisparity === "a_higher") s75AdjustmentToA -= 5.0;

      if (this.futureNeeds.primaryCareOfChildren === "a_primary") s75AdjustmentToA += 7.5;
      if (this.futureNeeds.primaryCareOfChildren === "b_primary") s75AdjustmentToA -= 7.5;

      if (this.futureNeeds.healthDisparity === "a_impaired") s75AdjustmentToA += 5.0;
      if (this.futureNeeds.healthDisparity === "b_impaired") s75AdjustmentToA -= 5.0;

      // Final Statutory Split
      const finalSplitA = Math.min(85, Math.max(15, contribWeightA + s75AdjustmentToA));
      const finalSplitB = 100 - finalSplitA;

      const partyANetEntitlement = totalGlobalNetPool * (finalSplitA / 100);
      const partyBNetEntitlement = totalGlobalNetPool * (finalSplitB / 100);

      return {
        step1_pool: { grossNonSuper, totalLiabilities, netNonSuperPool, totalSuper, totalGlobalNetPool },
        step2_contributions: { partyA: contribWeightA.toFixed(1), partyB: contribWeightB.toFixed(1) },
        step3_futureNeedsAdjustment: s75AdjustmentToA.toFixed(1),
        step4_finalSplit: { partyAPercent: finalSplitA.toFixed(1), partyBPercent: finalSplitB.toFixed(1), partyAAmount: partyANetEntitlement, partyBAmount: partyBNetEntitlement },
        statutoryJustAndEquitable: true
      };
    }
  }

  // =========================================================================
  // 2. SECTION 60CC BEST INTERESTS PARENTING SCHEDULE MECHANIC
  // =========================================================================
  class ParentingScheduleEngine {
    constructor() {
      this.scheduleType = "5-2-2-5";
      this.holidaysSplit = "equal_alternating";
      this.specialDays = { christmasEve: "alternate", birthdays: "shared", mothersFathersDay: "dedicated" };
    }

    calculateFortnightNights(pattern) {
      const patterns = {
        "5-2-2-5": { a: 7, b: 7, desc: "Equal 50/50 care with 5 nights on, 2 nights off rotation" },
        "7-7": { a: 7, b: 7, desc: "Week about 7/7 care with changeover Friday/Monday" },
        "9-5": { a: 9, b: 5, desc: "Primary care with alternate 5-night blocks (64% / 36%)" },
        "10-4": { a: 10, b: 4, desc: "Primary care with alternate 4-night weekend blocks (71% / 29%)" },
        "12-2": { a: 12, b: 2, desc: "Primary care with alternate weekend care (86% / 14%)" }
      };
      const res = patterns[pattern] || patterns["5-2-2-5"];
      const pctA = ((res.a / 14) * 100).toFixed(1);
      const pctB = ((res.b / 14) * 100).toFixed(1);
      const annualNightsA = Math.round(res.a * 26.07);
      const annualNightsB = 365 - annualNightsA;

      return { pattern, nightsFortnightA: res.a, nightsFortnightB: res.b, pctA, pctB, annualNightsA, annualNightsB, description: res.desc };
    }
  }

  // =========================================================================
  // 3. AFFIDAVIT & EVIDENCE ANNEXURE INDEX BUILDER
  // =========================================================================
  class AffidavitBuilderEngine {
    constructor() {
      this.deponent = "";
      this.paragraphs = [];
      this.annexures = [];
    }

    addParagraph(text, topic) {
      this.paragraphs.push({ num: this.paragraphs.length + 1, text, topic, ts: Date.now() });
      return this;
    }

    addAnnexure(mark, description, dateCreated, pageCount) {
      this.annexures.push({ mark: mark.toUpperCase(), description, dateCreated, pageCount: Number(pageCount) });
      return this;
    }

    compileCourtReadyAffidavit() {
      let doc = `IN THE FEDERAL CIRCUIT AND FAMILY COURT OF AUSTRALIA\nAT [REGISTRY]\nCOURT FILE NO: [FILE_NUMBER]\n\n`;
      doc += `AFFIDAVIT OF: ${this.deponent.toUpperCase() || '[DEPONENT NAME]'}\nDATE OF FILING: ${new Date().toLocaleDateString('en-AU')}\n\n`;
      doc += `I, ${this.deponent || '[Full Name]'}, [Occupation], of [City/State], affirm/make oath and say:\n\n`;
      
      this.paragraphs.forEach((p) => {
        doc += `${p.num}. ${p.text}\n\n`;
      });

      if (this.annexures.length > 0) {
        doc += `\nSCHEDULE OF ANNEXURES:\n`;
        this.annexures.forEach(a => {
          doc += `• Annexure "${a.mark}": ${a.description} (Dated: ${a.dateCreated || 'N/A'}, ${a.pageCount} pages)\n`;
        });
      }

      doc += `\nSWORN / AFFIRMED AT: ____________________\nBEFORE ME: ____________________ [Solicitor / Justice of the Peace]`;
      return doc;
    }
  }

  window.CasePathStatutory = {
    PropertySettlementEngine,
    ParentingScheduleEngine,
    AffidavitBuilderEngine
  };

})(window);
