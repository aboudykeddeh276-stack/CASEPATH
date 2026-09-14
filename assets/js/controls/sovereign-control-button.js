/**
 * Sovereign Button Control Module v2.0
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Centralizes button design conventions, geometry, padding, and elevations.
 * Calling SovereignControlButton.setPreset('sharp' | 'pill' | 'rounded' | 'glass')
 * instantly recalibrates all button interfaces across the platform.
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'sovereign_control_button_preset';

  var PRESETS = {
    'rounded': {
      name: 'Executive Rounded (Default)',
      radius: '10px',
      paddingY: '14px',
      paddingX: '22px',
      fontSize: '1rem',
      fontWeight: '700',
      shadow: '0 4px 14px rgba(23, 63, 58, 0.12)',
      shadowHover: '0 8px 22px rgba(23, 63, 58, 0.2)',
      borderWidth: '1px'
    },
    'sharp': {
      name: 'High-Precision Sharp (Technical / Legal)',
      radius: '0px',
      paddingY: '13px',
      paddingX: '20px',
      fontSize: '0.95rem',
      fontWeight: '800',
      shadow: 'none',
      shadowHover: '0 4px 12px rgba(0,0,0,0.15)',
      borderWidth: '2px'
    },
    'pill': {
      name: 'Ergonomic Pill (Consumer Flow)',
      radius: '999px',
      paddingY: '14px',
      paddingX: '26px',
      fontSize: '1rem',
      fontWeight: '700',
      shadow: '0 6px 18px rgba(0,0,0,0.08)',
      shadowHover: '0 10px 24px rgba(0,0,0,0.14)',
      borderWidth: '1px'
    },
    'glass': {
      name: 'Frosted Glass Substrate',
      radius: '14px',
      paddingY: '15px',
      paddingX: '24px',
      fontSize: '1rem',
      fontWeight: '600',
      shadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
      shadowHover: '0 12px 40px rgba(31, 38, 135, 0.25)',
      borderWidth: '1px'
    }
  };

  function applyButtonTokens(preset) {
    if (!preset) return;
    var root = document.documentElement;

    root.style.setProperty('--cp-btn-radius', preset.radius);
    root.style.setProperty('--cp-btn-padding-y', preset.paddingY);
    root.style.setProperty('--cp-btn-padding-x', preset.paddingX);
    root.style.setProperty('--cp-btn-font-size', preset.fontSize);
    root.style.setProperty('--cp-btn-font-weight', preset.fontWeight);
    root.style.setProperty('--cp-btn-shadow', preset.shadow);
    root.style.setProperty('--cp-btn-shadow-hover', preset.shadowHover);
    root.style.setProperty('--cp-btn-border-width', preset.borderWidth);
  }

  var ButtonControl = {
    presets: PRESETS,

    setPreset: function(presetKey, options) {
      presetKey = (presetKey || '').toLowerCase();
      var preset = PRESETS[presetKey];
      if (!preset) {
        presetKey = 'rounded';
        preset = PRESETS.rounded;
      }

      applyButtonTokens(preset);

      var persist = (options && options.persist !== undefined) ? options.persist : true;
      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, presetKey);
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('sovereign:button:changed', {
        detail: { key: presetKey, preset: preset }
      }));

      console.log('[ButtonControl] Preset switched to: ' + preset.name);
      return preset;
    },

    getCurrentPresetKey: function() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && PRESETS[saved]) return saved;
      } catch (e) {}
      return 'rounded';
    },

    getCurrentPreset: function() {
      return PRESETS[this.getCurrentPresetKey()];
    },

    init: function() {
      var currentKey = this.getCurrentPresetKey();
      this.setPreset(currentKey, { persist: false });
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { ButtonControl.init(); });
    } else {
      ButtonControl.init();
    }
  }

  window.SovereignControlButton = ButtonControl;
})(typeof window !== 'undefined' ? window : this);
