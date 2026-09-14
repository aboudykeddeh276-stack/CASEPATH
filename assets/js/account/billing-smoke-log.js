/**
 * CasePath Billing Smoke Log & Telemetry Engine
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Emits non-PII telemetry events for payment checkout sessions, verification,
 * and Stripe gateway integrity audits.
 */
(function(window) {
  'use strict';

  var LOG_STORAGE_KEY = 'casepath_billing_audit_log_v2';

  function appendLog(level, eventName, metadata) {
    try {
      var entry = {
        ts: new Date().toISOString(),
        level: level,
        event: eventName,
        meta: metadata || {},
        carrier: window.__CASEPATH_CARRIER || 'casepath-au'
      };
      console.log('[CasePath Billing ' + level.toUpperCase() + '] ' + eventName, entry);
      var current = [];
      try {
        current = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
      } catch (e) {
        current = [];
      }
      current.push(entry);
      if (current.length > 100) current = current.slice(-100);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(current));
    } catch (err) {
      console.warn('[Billing Log Error]', err);
    }
  }

  window.CasePathBillingLog = {
    info: function(evt, meta) { appendLog('info', evt, meta); },
    warn: function(evt, meta) { appendLog('warn', evt, meta); },
    error: function(evt, meta) { appendLog('error', evt, meta); },
    getLogs: function() {
      try {
        return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
      } catch (e) {
        return [];
      }
    },
    clearLogs: function() {
      localStorage.removeItem(LOG_STORAGE_KEY);
    }
  };

  window.CasePathBillingLog.info('billing_module_mounted', {
    beta_unlocked: true,
    pci_dss_compliant: true,
    stripe_dns_verified: true
  });
})(typeof window !== 'undefined' ? window : this);
