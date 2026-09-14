/**
 * Sovereign Master Control Hub v2.0
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Coordinates Color, Button, Layout, and Memory control modules.
 * Injects a live interactive Control HUD (toggleable via Ctrl+Shift+C or Sovereign.toggleHUD())
 * for immediate runtime governance across all active carrier surfaces.
 */
(function(window) {
  'use strict';

  var Sovereign = {
    get Color() { return window.SovereignControlColor; },
    get Button() { return window.SovereignControlButton; },
    get Layout() { return window.SovereignControlLayout; },
    get Memory() { return window.SovereignControlMemory; },
    get Factory() { return window.SovereignFactory; },

    toggleHUD: function() {
      var hud = document.getElementById('sov-master-hud');
      if (!hud) {
        this.injectHUD();
      } else {
        hud.style.display = (hud.style.display === 'none' ? 'block' : 'none');
      }
    },

    injectHUD: function() {
      if (document.getElementById('sov-master-hud')) return;

      var hud = document.createElement('aside');
      hud.id = 'sov-master-hud';
      hud.setAttribute('aria-label', 'Sovereign Control Module HUD');
      hud.style.cssText = [
        'position: fixed',
        'bottom: 20px',
        'right: 20px',
        'width: 320px',
        'background: #0f172a',
        'color: #f8fafc',
        'border: 1px solid #334155',
        'border-radius: 12px',
        'box-shadow: 0 20px 50px rgba(0,0,0,0.5)',
        'padding: 16px',
        'z-index: 999999',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'font-size: 12px',
        'line-height: 1.5'
      ].join(';');

      hud.innerHTML = [
        '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1e293b; padding-bottom:8px; margin-bottom:12px;">',
        '  <strong style="color:#38bdf8; font-size:13px; text-transform:uppercase; letter-spacing:0.05em;">Sovereign Control HUD</strong>',
        '  <button id="sov-hud-close" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">&times;</button>',
        '</div>',
        '<div style="margin-bottom:10px;">',
        '  <label style="display:block; color:#94a3b8; font-weight:700; margin-bottom:4px;">1. COLOR SCHEME CONTROL</label>',
        '  <select id="sov-hud-color" style="width:100%; padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; font-size:12px;">',
        '    <option value="emerald">Sovereign Emerald (AU)</option>',
        '    <option value="blue">Royal Cobalt (AI)</option>',
        '    <option value="slate">Sovereign Slate (UK)</option>',
        '    <option value="navy">Midnight Navy (Stealth)</option>',
        '    <option value="high-contrast">High Contrast (AAA)</option>',
        '  </select>',
        '</div>',
        '<div style="margin-bottom:10px;">',
        '  <label style="display:block; color:#94a3b8; font-weight:700; margin-bottom:4px;">2. BUTTON GEOMETRY CONTROL</label>',
        '  <select id="sov-hud-button" style="width:100%; padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; font-size:12px;">',
        '    <option value="rounded">Executive Rounded (10px)</option>',
        '    <option value="sharp">High-Precision Sharp (0px)</option>',
        '    <option value="pill">Ergonomic Pill (999px)</option>',
        '    <option value="glass">Frosted Glass (14px)</option>',
        '  </select>',
        '</div>',
        '<div style="margin-bottom:10px;">',
        '  <label style="display:block; color:#94a3b8; font-weight:700; margin-bottom:4px;">3. LAYOUT &amp; MARGINS DENSITY</label>',
        '  <select id="sov-hud-layout" style="width:100%; padding:6px; background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; font-size:12px;">',
        '    <option value="standard">Standard Editorial</option>',
        '    <option value="compact">Compact High-Density</option>',
        '    <option value="spacious">Spacious Executive</option>',
        '  </select>',
        '</div>',
        '<div style="margin-bottom:12px; background:#020617; padding:8px 10px; border-radius:6px; border:1px solid #1e293b;">',
        '  <div style="display:flex; justify-content:space-between; color:#94a3b8;">',
        '    <span>MEMORY QUOTA:</span>',
        '    <strong id="sov-hud-mem-val" style="color:#34d399;">--</strong>',
        '  </div>',
        '</div>',
        '<div style="display:flex; gap:8px;">',
        '  <button id="sov-hud-export-capsule" style="flex:1; background:#2563eb; color:#fff; border:none; padding:6px; border-radius:4px; font-weight:700; cursor:pointer;">Export Capsule</button>',
        '  <button id="sov-hud-reset" style="background:#dc2626; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-weight:700; cursor:pointer;">Reset</button>',
        '</div>',
        '<div style="margin-top:10px; font-size:10px; color:#64748b; text-align:center;">Toggle HUD: Ctrl + Shift + C</div>'
      ].join('\n');

      document.body.appendChild(hud);

      // Wire HUD elements
      var colorSel = document.getElementById('sov-hud-color');
      var btnSel = document.getElementById('sov-hud-button');
      var laySel = document.getElementById('sov-hud-layout');
      var memVal = document.getElementById('sov-hud-mem-val');

      if (Sovereign.Color) colorSel.value = Sovereign.Color.getCurrentPaletteKey();
      if (Sovereign.Button) btnSel.value = Sovereign.Button.getCurrentPresetKey();
      if (Sovereign.Layout) laySel.value = Sovereign.Layout.getCurrentDensityKey();
      if (Sovereign.Memory) {
        var rep = Sovereign.Memory.getMemoryReport();
        memVal.innerText = rep.totalUsedBytes + ' B (' + rep.usagePercentage + ')';
      }

      colorSel.addEventListener('change', function(e) {
        if (Sovereign.Color) Sovereign.Color.setPalette(e.target.value);
      });
      btnSel.addEventListener('change', function(e) {
        if (Sovereign.Button) Sovereign.Button.setPreset(e.target.value);
      });
      laySel.addEventListener('change', function(e) {
        if (Sovereign.Layout) Sovereign.Layout.setDensity(e.target.value);
      });

      document.getElementById('sov-hud-close').addEventListener('click', function() {
        hud.style.display = 'none';
      });

      document.getElementById('sov-hud-export-capsule').addEventListener('click', function() {
        if (!Sovereign.Memory) return;
        var cap = Sovereign.Memory.exportStateCapsule();
        var blob = new Blob([JSON.stringify(cap, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'sovereign_state_capsule_' + Date.now() + '.json';
        a.click();
        URL.revokeObjectURL(url);
      });

      document.getElementById('sov-hud-reset').addEventListener('click', function() {
        if (confirm('Reset all sovereign layout, color, and button controls to defaults?')) {
          localStorage.removeItem('sovereign_control_color_palette');
          localStorage.removeItem('sovereign_control_button_preset');
          localStorage.removeItem('sovereign_control_layout_density');
          if (Sovereign.Color) Sovereign.Color.setPalette('emerald');
          if (Sovereign.Button) Sovereign.Button.setPreset('rounded');
          if (Sovereign.Layout) Sovereign.Layout.setDensity('standard');
          colorSel.value = 'emerald';
          btnSel.value = 'rounded';
          laySel.value = 'standard';
        }
      });
    }
  };

  // Keyboard shortcut listener: Ctrl + Shift + C
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      Sovereign.toggleHUD();
    }
  });

  window.Sovereign = Sovereign;
})(typeof window !== 'undefined' ? window : this);
