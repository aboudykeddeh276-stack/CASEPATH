// CasePath Glossary Sidebar Accordion
(function() {
  'use strict';
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-glossary-rail-sync]').forEach(function(details) {
      // Auto-open on desktop screens
      if (window.innerWidth >= 900) {
        details.setAttribute('open', '');
      }
    });
  });
})();
