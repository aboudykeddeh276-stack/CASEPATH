/**
 * Sovereign Color Control Module v2.0
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Provides a single centralized control tie-in for all website/service color schemas.
 * Calling SovereignControlColor.setPalette('blue') dynamically cascades across
 * all CSS Custom Properties and HTML components deterministically.
 */
(function(window) {
  'use strict';

  var STORAGE_KEY = 'sovereign_control_color_palette';

  var PALETTES = {
    'emerald': {
      name: 'Sovereign Emerald (CasePath AU Standard)',
      primary: '#173f3a',
      primaryDark: '#0f2b27',
      primaryLight: '#235c55',
      secondary: '#2e6f65',
      accent: '#3a887c',
      gold: '#b58d3d',
      bgAlt: '#f8f6f0',
      cardBorder: '#e2ddd3',
      cardBorderHover: '#173f3a',
      text: '#172321',
      textBody: '#3b4644',
      textMuted: '#667571'
    },
    'blue': {
      name: 'Royal Cobalt (ClaimPath AI Standard)',
      primary: '#1e3a8a',
      primaryDark: '#0f172a',
      primaryLight: '#2563eb',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      gold: '#f59e0b',
      bgAlt: '#f0f4f8',
      cardBorder: '#cbd5e1',
      cardBorderHover: '#2563eb',
      text: '#0f172a',
      textBody: '#334155',
      textMuted: '#64748b'
    },
    'slate': {
      name: 'UK Sovereign Slate (CasePath UK Standard)',
      primary: '#1e293b',
      primaryDark: '#0f172a',
      primaryLight: '#334155',
      secondary: '#475569',
      accent: '#64748b',
      gold: '#b58d3d',
      bgAlt: '#f1f5f9',
      cardBorder: '#e2e8f0',
      cardBorderHover: '#1e293b',
      text: '#0f172a',
      textBody: '#334155',
      textMuted: '#64748b'
    },
    'navy': {
      name: 'Midnight Deep Ocean (Enterprise Stealth)',
      primary: '#0a192f',
      primaryDark: '#020c1b',
      primaryLight: '#172a45',
      secondary: '#203a43',
      accent: '#00b4d8',
      gold: '#e0a96d',
      bgAlt: '#edf2f7',
      cardBorder: '#d0d7de',
      cardBorderHover: '#0a192f',
      text: '#091e3a',
      textBody: '#2c3e50',
      textMuted: '#5a6b7c'
    },
    'high-contrast': {
      name: 'High Contrast (ISO 9241 / WCAG 2.2 AAA)',
      primary: '#000000',
      primaryDark: '#000000',
      primaryLight: '#111111',
      secondary: '#222222',
      accent: '#0044cc',
      gold: '#aa7700',
      bgAlt: '#f8f8f8',
      cardBorder: '#000000',
      cardBorderHover: '#000000',
      text: '#000000',
      textBody: '#111111',
      textMuted: '#333333'
    }
  };

  function applyPaletteTokens(palette) {
    if (!palette) return;
    var root = document.documentElement;

    root.style.setProperty('--cp-color-primary', palette.primary);
    root.style.setProperty('--cp-color-primary-dark', palette.primaryDark);
    root.style.setProperty('--cp-color-primary-light', palette.primaryLight);
    root.style.setProperty('--cp-color-secondary', palette.secondary);
    root.style.setProperty('--cp-color-accent', palette.accent);
    root.style.setProperty('--cp-color-gold', palette.gold);
    root.style.setProperty('--cp-color-bg-alt', palette.bgAlt);
    root.style.setProperty('--cp-color-card-border', palette.cardBorder);
    root.style.setProperty('--cp-color-card-border-hover', palette.cardBorderHover);
    root.style.setProperty('--cp-color-text', palette.text);
    root.style.setProperty('--cp-color-text-body', palette.textBody);
    root.style.setProperty('--cp-color-text-muted', palette.textMuted);

    // Also cascade to legacy aliases for complete backward compatibility
    root.style.setProperty('--cp-brand', palette.primary);
    root.style.setProperty('--cp-brand-dark', palette.primaryDark);
    root.style.setProperty('--cp-brand-accent', palette.secondary);
    root.style.setProperty('--cp-warm-bg', palette.bgAlt);
    root.style.setProperty('--cp-card-border', palette.cardBorder);
  }

  var ColorControl = {
    palettes: PALETTES,

    setPalette: function(paletteKey, options) {
      paletteKey = (paletteKey || '').toLowerCase();
      var palette = PALETTES[paletteKey];
      if (!palette) {
        console.warn('[ColorControl] Unknown palette "' + paletteKey + '", defaulting to emerald');
        paletteKey = 'emerald';
        palette = PALETTES.emerald;
      }

      applyPaletteTokens(palette);

      var persist = (options && options.persist !== undefined) ? options.persist : true;
      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, paletteKey);
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('sovereign:color:changed', {
        detail: { key: paletteKey, palette: palette }
      }));

      console.log('[ColorControl] Palette switched to: ' + palette.name);
      return palette;
    },

    getCurrentPaletteKey: function() {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && PALETTES[saved]) return saved;
      } catch (e) {}
      return 'emerald';
    },

    getCurrentPalette: function() {
      return PALETTES[this.getCurrentPaletteKey()];
    },

    setCustomToken: function(tokenName, hexValue) {
      if (!tokenName.startsWith('--')) tokenName = '--' + tokenName;
      document.documentElement.style.setProperty(tokenName, hexValue);
    },

    init: function() {
      var currentKey = this.getCurrentPaletteKey();
      this.setPalette(currentKey, { persist: false });
    }
  };

  // Auto-initialize on script execution
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { ColorControl.init(); });
    } else {
      ColorControl.init();
    }
  }

  window.SovereignControlColor = ColorControl;
})(typeof window !== 'undefined' ? window : this);
