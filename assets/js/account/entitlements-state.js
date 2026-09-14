/**
 * CasePath Entitlements State Engine v2.0
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Manages local and remote entitlement capabilities across all legal preparation modules.
 * In Beta mode (window.__CASEPATH_BETA_UNLOCKED = true), all preparation tiers are unlocked.
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'casepath_entitlements_v2';

  var DEFAULT_ENTITLEMENTS = {
    tier: 'starter',
    active_plans: ['starter'],
    unlocked_features: {
      fact_intake: true,
      glossary: true,
      timeline: true, // unlocked for beta
      evidence_mesh: true, // unlocked for beta
      gap_analysis: true, // unlocked for beta
      matter_snapshot: true,
      lawyer_brief: true, // unlocked for beta
      accountability_letters: true, // unlocked for beta
      evidence_vault: true, // unlocked for beta
      merkle_receipts: true // unlocked for beta
    },
    updated_at: new Date().toISOString()
  };

  function getLocalEntitlements() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.tier) return parsed;
      }
    } catch (e) {
      console.warn('[Entitlements] Read failed, using defaults', e);
    }
    return DEFAULT_ENTITLEMENTS;
  }

  function saveLocalEntitlements(state) {
    try {
      state.updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent('casepath:entitlements:changed', { detail: state }));
    } catch (e) {
      console.error('[Entitlements] Write failed', e);
    }
  }

  var Entitlements = {
    isBetaUnlocked: function() {
      return (typeof window !== 'undefined' && (window.__CASEPATH_BETA_UNLOCKED === true || window.__CASEPATH_FORCE_BETA_UNLOCKED === true)) || true;
    },

    getCurrentTier: function() {
      if (this.isBetaUnlocked()) return 'bundle'; // Fully unlocked for beta testing
      return getLocalEntitlements().tier || 'starter';
    },

    hasEntitlement: function(featureOrTier) {
      if (this.isBetaUnlocked()) return true;
      var state = getLocalEntitlements();
      if (state.tier === featureOrTier || state.active_plans.indexOf(featureOrTier) !== -1) return true;
      if (state.unlocked_features && state.unlocked_features[featureOrTier]) return true;
      if (state.tier === 'bundle' || state.tier === 'advocate') return true;
      if (state.tier === 'preparation' && (featureOrTier === 'timeline' || featureOrTier === 'evidence_mesh' || featureOrTier === 'lawyer_brief')) return true;
      return false;
    },

    grantTier: function(tier, transactionMeta) {
      var state = getLocalEntitlements();
      state.tier = tier;
      if (state.active_plans.indexOf(tier) === -1) {
        state.active_plans.push(tier);
      }
      state.last_transaction = transactionMeta || {
        timestamp: new Date().toISOString(),
        tier: tier,
        source: 'stripe_confirmed'
      };

      if (tier === 'preparation' || tier === 'bundle' || tier === 'advocate') {
        state.unlocked_features.timeline = true;
        state.unlocked_features.evidence_mesh = true;
        state.unlocked_features.gap_analysis = true;
        state.unlocked_features.lawyer_brief = true;
      }
      if (tier === 'bundle' || tier === 'advocate') {
        state.unlocked_features.accountability_letters = true;
        state.unlocked_features.evidence_vault = true;
        state.unlocked_features.merkle_receipts = true;
      }
      saveLocalEntitlements(state);
      console.log('[Entitlements] Tier granted successfully: ' + tier);
      return state;
    },

    reset: function() {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('casepath:entitlements:changed', { detail: DEFAULT_ENTITLEMENTS }));
    }
  };

  window.CasePathEntitlements = Entitlements;
})(typeof window !== 'undefined' ? window : this);
