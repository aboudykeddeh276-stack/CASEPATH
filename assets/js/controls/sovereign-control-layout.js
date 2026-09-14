/**
 * Sovereign Layout & Column Control Module v2.0
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Centralizes grid layout, responsive columns, gutters, and page margins.
 * Calling SovereignControlLayout.setDensity('compact' | 'standard' | 'spacious')
 * or SovereignControlLayout.setColumns(2 | 3 | 4) recalibrates grid geometry.
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'sovereign_control_layout_density';

  var DENSITY_PRESETS = {
    'standard': {
      name: 'Standard Editorial (Default)',
      containerMax: '1200px',
      pageMargin: '24px',
      sectionPaddingY: '64px',
      gridCols: 3,
      colGap: '24px',
      rowGap: '28px',
      cardRadius: '16px',
      cardPadding: '32px'
    },
    'compact': {
      name: 'High-Density Analytical (Data Workbench)',
      containerMax: '1080px',
      pageMargin: '16px',
      sectionPaddingY: '36px',
      gridCols: 3,
      colGap: '16px',
      rowGap: '18px',
      cardRadius: '10px',
      cardPadding: '20px'
    },
    'spacious': {
      name: 'Spacious Executive (Wide Canvas)',
      containerMax: '1440px',
      pageMargin: '36px',
      sectionPaddingY: '88px',
      gridCols: 4,
      colGap: '32px',
      rowGap: '36px',
      cardRadius: '20px',
      cardPadding: '40px'
    }
  };

  function applyLayoutTokens(preset) {
    if (!preset) return;
    var root = document.documentElement;

    root.style.setProperty('--cp-container-max', preset.containerMax);
    root.style.setProperty('--cp-page-margin', preset.pageMargin);
    root.style.setProperty('--cp-section-padding-y', preset.sectionPaddingY);
    root.style.setProperty('--cp-grid-cols', String(preset.gridCols));
    root.style.setProperty('--cp-col-gap', preset.colGap);
    root.style.setProperty('--cp-row-gap', preset.rowGap);
    root.style.setProperty('--cp-card-radius', preset.cardRadius);
    root.style.setProperty('--cp-card-padding', preset.cardPadding);
  }

  var LayoutControl = {
    presets: DENSITY_PRESETS,

    setDensity: function(densityKey, options) {
      densityKey = (densityKey || '').toLowerCase();
      var preset = DENSITY_PRESETS[densityKey];
      if (!preset) {
        densityKey = 'standard';
        preset = DENSITY_PRESETS.standard;
      }

      applyLayoutTokens(preset);

      var persist = (options && options.persist !== undefined) ? options.persist : true;
      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, densityKey);
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('sovereign:layout:changed', {
        detail: { key: densityKey, preset: preset }
      }));

      console.log('[LayoutControl] Layout density switched to: ' + preset.name);
      return preset;
    },

    setColumns: function(cols) {
      var n = Math.max(1, Math.min(6, parseInt(cols, 10) || 3));
      document.documentElement.style.setProperty('--cp-grid-cols', String(n));
      window.dispatchEvent(new CustomEvent('sovereign:layout:cols_changed', { detail: { cols: n } }));
      console.log('[LayoutControl] Grid columns set to: ' + n);
    },

    getCurrentDensityKey: function() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && DENSITY_PRESETS[saved]) return saved;
      } catch (e) {}
      return 'standard';
    },

    getCurrentPreset: function() {
      return DENSITY_PRESETS[this.getCurrentDensityKey()];
    },

    init: function() {
      var currentKey = this.getCurrentDensityKey();
      this.setDensity(currentKey, { persist: false });
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { LayoutControl.init(); });
    } else {
      LayoutControl.init();
    }
  }

  window.SovereignControlLayout = LayoutControl;
})(typeof window !== 'undefined' ? window : this);
