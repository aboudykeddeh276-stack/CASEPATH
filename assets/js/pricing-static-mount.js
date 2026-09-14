// CasePath Dynamic Pricing & Checkout Lane v2.0
// Universal Tricky Life Situations Architecture
// Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
(function() {
  'use strict';
  console.log('[CasePath Pricing] Dynamic pricing mount initialized.');
  
  // Ensure entitlements and billing checkout lane are loaded
  function loadScript(src) {
    if (document.querySelector('script[src*="' + src + '"]')) return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  loadScript('/assets/js/account/entitlements-state.js')
    .then(function() { return loadScript('/assets/js/account/billing-smoke-log.js'); })
    .then(function() { return loadScript('/assets/js/account/billing-checkout-lane.js'); })
    .then(function() {
      console.log('[CasePath Pricing] Billing checkout lane verified & active.');
    })
    .catch(function(err) {
      console.warn('[CasePath Pricing] Static loader fallback active', err);
    });

  var mount = document.getElementById('pricing-static-mount');
  var status = document.getElementById('pricing-load-status');
  if (status) status.style.display = 'none';
  if (mount) mount.innerHTML = '';
})();
