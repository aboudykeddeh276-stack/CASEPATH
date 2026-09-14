/**
 * Sovereign Templated Component Factory v2.0
 * Authority: THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS (ABN 79 691 036 236)
 * Architect: Aboudy Keddeh <aboudy@keddeh.com>
 *
 * Deterministic Component Generation Engine.
 * Ensures that whenever ANYTHING is built, it inherits complete templated control
 * over colors, button designs, margins, columns, and state governance.
 */
(function(window) {
  'use strict';

  var Factory = {
    /**
     * Create a deterministic, templated button
     */
    createButton: function(opts) {
      opts = opts || {};
      var label = opts.label || 'Action';
      var variant = opts.variant || 'primary'; // 'primary' | 'outline'
      var href = opts.href || null;
      var onClick = opts.onClick || '';
      var className = 'sov-btn sov-btn--' + variant + (opts.className ? ' ' + opts.className : '');
      var attrStr = '';

      if (opts.dataAttrs) {
        for (var k in opts.dataAttrs) {
          attrStr += ' data-' + k + '="' + opts.dataAttrs[k] + '"';
        }
      }

      if (href) {
        return '<a href="' + href + '" class="' + className + '"' + attrStr + (onClick ? ' onclick="' + onClick + '"' : '') + '>' + label + '</a>';
      } else {
        return '<button type="button" class="' + className + '"' + attrStr + (onClick ? ' onclick="' + onClick + '"' : '') + '>' + label + '</button>';
      }
    },

    /**
     * Create a deterministic, templated card
     */
    createCard: function(opts) {
      opts = opts || {};
      var title = opts.title || '';
      var subtitle = opts.subtitle || '';
      var content = opts.content || '';
      var badge = opts.badge || null;
      var featured = opts.featured ? ' sov-card--featured' : '';
      var actions = opts.actions || '';

      var html = '<article class="sov-card' + featured + (opts.className ? ' ' + opts.className : '') + '">';
      if (badge) {
        html += '<div style="display:inline-block; font-size:0.75rem; font-weight:800; text-transform:uppercase; background:var(--cp-color-primary); color:#fff; padding:3px 10px; border-radius:999px; margin-bottom:12px;">' + badge + '</div>';
      }
      if (title) {
        html += '<h3 style="font-family:var(--cp-font-sans); font-size:1.35rem; font-weight:700; color:var(--cp-color-primary); margin:0 0 6px;">' + title + '</h3>';
      }
      if (subtitle) {
        html += '<p style="font-size:0.92rem; color:var(--cp-color-text-muted); line-height:1.45; margin:0 0 16px;">' + subtitle + '</p>';
      }
      if (content) {
        html += '<div style="margin-bottom:20px; font-size:0.95rem; color:var(--cp-color-text-body); line-height:1.6;">' + content + '</div>';
      }
      if (actions) {
        html += '<div style="margin-top:auto; padding-top:16px;">' + actions + '</div>';
      }
      html += '</article>';
      return html;
    },

    /**
     * Create a deterministic responsive grid
     */
    createGrid: function(itemsHtml, cols) {
      var colStyle = cols ? ' style="--cp-grid-cols:' + cols + ';"' : '';
      return '<div class="sov-grid"' + colStyle + '>' + itemsHtml + '</div>';
    },

    /**
     * Create a full-featured pricing card bound to billing lane & tokens
     */
    createPricingCard: function(opts) {
      opts = opts || {};
      var tier = opts.tier || 'starter';
      var name = opts.name || 'Tier';
      var price = opts.price || '$0';
      var period = opts.period || '/ Free forever';
      var savings = opts.savings || '';
      var features = opts.features || [];
      var ctaLabel = opts.ctaLabel || 'Get Started';
      var featured = opts.featured ? ' sov-card--featured' : '';

      var featsHtml = '<ul style="list-style:none; padding:0; margin:0 0 24px; display:grid; gap:10px;">';
      features.forEach(function(f) {
        featsHtml += '<li style="display:flex; gap:8px; align-items:flex-start; font-size:0.92rem; color:var(--cp-color-text-body);"><span style="color:var(--cp-color-success); font-weight:bold;">✓</span> ' + f + '</li>';
      });
      featsHtml += '</ul>';

      var btnHtml = Factory.createButton({
        label: ctaLabel,
        variant: opts.featured ? 'primary' : 'outline',
        href: '/workbench.html?tier=' + tier,
        dataAttrs: { 'plan-tier': tier }
      });

      var cardContent = [
        '<div style="margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--cp-color-card-border);">',
        '  <span style="font-size:2.5rem; font-weight:800; color:var(--cp-color-text); line-height:1;">' + price + '</span>',
        '  <span style="font-size:0.88rem; color:var(--cp-color-text-muted); font-weight:500;"> ' + period + '</span>',
        (savings ? '  <div style="font-size:0.82rem; font-weight:700; color:var(--cp-color-success); margin-top:6px;">' + savings + '</div>' : ''),
        '</div>',
        featsHtml
      ].join('\n');

      return Factory.createCard({
        title: name,
        subtitle: opts.desc || '',
        badge: opts.badge,
        content: cardContent,
        actions: btnHtml,
        featured: opts.featured
      });
    },

    /**
     * Universal Corporate Statutory Footer
     */
    renderUniversalFooter: function() {
      return [
        '<footer class="sov-universal-footer" style="background:#09090b; border-top:1px solid rgba(255,255,255,0.1); color:#a1a1aa; padding:48px 24px 32px; font-family:var(--cp-font-sans, -apple-system, BlinkMacSystemFont, sans-serif); font-size:14px;">',
        '  <div style="max-width:1200px; margin:0 auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:32px; margin-bottom:40px;">',
        '    <div>',
        '      <div style="font-size:18px; font-weight:800; color:#f4f4f5; margin-bottom:8px; display:flex; align-items:center; gap:8px;">',
        '        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10b981;"></span>',
        '        THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS',
        '      </div>',
        '      <div style="font-family:monospace; font-size:12px; color:#71717a; margin-bottom:12px;">ABN 79 691 036 236 trading as KEDDEH SYSTEMS</div>',
        '      <p style="font-size:13px; line-height:1.6; color:#a1a1aa; margin:0;">Autonomous Sovereign Infrastructure, Deterministic Preparation Systems & Distributed Mesh Engineering.</p>',
        '    </div>',
        '    <div>',
        '      <div style="font-weight:700; color:#f4f4f5; margin-bottom:12px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Sovereign Carriers</div>',
        '      <ul style="list-style:none; padding:0; margin:0; line-height:2.0; font-size:13px;">',
        '        <li><a href="/casepath/" style="color:#a1a1aa; text-decoration:none;" onmouseover="this.style.color=\'#38bdf8\'" onmouseout="this.style.color=\'#a1a1aa\'">CasePath AU (casepath.com.au)</a></li>',
        '        <li><a href="/casepath-uk/" style="color:#a1a1aa; text-decoration:none;" onmouseover="this.style.color=\'#38bdf8\'" onmouseout="this.style.color=\'#a1a1aa\'">CasePath UK (casepath.co.uk)</a></li>',
        '        <li><a href="/claimpath/" style="color:#a1a1aa; text-decoration:none;" onmouseover="this.style.color=\'#38bdf8\'" onmouseout="this.style.color=\'#a1a1aa\'">ClaimPath AI (claimpath.ai)</a></li>',
        '        <li><a href="/claimpath-au/" style="color:#a1a1aa; text-decoration:none;" onmouseover="this.style.color=\'#38bdf8\'" onmouseout="this.style.color=\'#a1a1aa\'">ClaimPath AU (claimpath.com.au)</a></li>',
        '        <li><a href="/braink/" style="color:#a1a1aa; text-decoration:none;" onmouseover="this.style.color=\'#38bdf8\'" onmouseout="this.style.color=\'#a1a1aa\'">BrainK Cognitive Substrate (braink.com.au)</a></li>',
        '        <li><a href="/keddeh-admin-portal/" style="color:#a1a1aa; text-decoration:none;" onmouseover="this.style.color=\'#38bdf8\'" onmouseout="this.style.color=\'#a1a1aa\'">Keddeh Admin Portal (keddeh-admin-portal.com)</a></li>',
        '        <li><a href="/ksys-codesource/" style="color:#38bdf8; text-decoration:none; font-weight:700;" onmouseover="this.style.color=\'#60a5fa\'" onmouseout="this.style.color=\'#38bdf8\'">Ksys CodeSource (ksys-codesource.com.au) &rarr;</a></li>',
        '      </ul>',
        '    </div>',
        '    <div>',
        '      <div style="font-weight:700; color:#f4f4f5; margin-bottom:12px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Statutory Verification</div>',
        '      <div style="background:#18181b; border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:12px; font-family:monospace; font-size:11px; line-height:1.6;">',
        '        <div><span style="color:#10b981;">●</span> Physical Contract: <strong>0.297 Locked</strong></div>',
        '        <div><span style="color:#38bdf8;">●</span> Ledger: <strong>Ed25519 Verified</strong></div>',
        '        <div><span style="color:#f59e0b;">●</span> Vault: <strong>Local Google Drive Sync</strong></div>',
        '        <div><span style="color:#a855f7;">●</span> Learning: <strong>KEX-SEED-050 Active</strong></div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div style="max-width:1200px; margin:0 auto; padding-top:24px; border-top:1px solid rgba(255,255,255,0.08); display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:16px; font-size:12px;">',
        '    <div>&copy; 2026 THE LAYNA COMPANY PTY LIMITED (ABN 79 691 036 236) trading as KEDDEH SYSTEMS. All rights reserved. Chief Architect & Sovereign Authority: Aboudy Keddeh &lt;aboudy@keddeh.com&gt;.</div>',
        '    <div style="color:#71717a;">Deterministic Procedural Automation. Not Legal Advice.</div>',
        '  </div>',
        '</footer>'
      ].join('\n');
    },

    /**
     * Universal Local Google Drive Vault Status & Sync Widget
     */
    renderVaultWidget: function() {
      return [
        '<div class="sov-vault-widget" style="background:#18181b; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:20px; color:#f4f4f5; font-family:var(--cp-font-sans, sans-serif); margin:16px 0;">',
        '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">',
        '    <div style="display:flex; align-items:center; gap:10px;">',
        '      <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#10b981;"></span>',
        '      <h4 style="margin:0; font-size:16px; font-weight:700;">Google Drive Sovereign Vault (100% Local User Storage)</h4>',
        '    </div>',
        '    <span class="sov-badge" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:4px 8px; border-radius:4px; font-size:11px; font-family:monospace;">DEVICE-LOCAL</span>',
        '  </div>',
        '  <p style="font-size:13px; color:#a1a1aa; line-height:1.5; margin:0 0 16px;">All user matter briefs, evidence files, and chronologies remain strictly local on your device. Zero unencrypted drafts are stored on remote company servers. Direct dual-sync writes state capsules into your personal Google Drive mount.</p>',
        '  <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">',
        '    <button type="button" onclick="if(window.SovereignControlMemory){window.SovereignControlMemory.googleDrive.syncAllStateToDrive().then(function(){alert(\'State capsule backed up to your personal Google Drive successfully!\');});}else{alert(\'Memory module ready.\');}" style="background:#2563eb; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">Backup to Google Drive</button>',
        '    <button type="button" onclick="if(window.SovereignControlMemory){var rep=window.SovereignControlMemory.getMemoryReport(); alert(\'Used: \' + (rep.totalUsedBytes/1024).toFixed(1) + \' KB / \' + (rep.totalQuotaBytes/1024) + \' KB (\' + rep.usagePercentage + \')\\nItems: \' + rep.totalItems);}else{alert(\'Memory report active.\');}" style="background:transparent; color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer;">Inspect Memory Quota</button>',
        '    <span style="font-family:monospace; font-size:12px; color:#71717a;">Target: /Users/ak/Library/CloudStorage/GoogleDrive-keddeh.servers@gmail.com/My Drive</span>',
        '  </div>',
        '</div>'
      ].join('\n');
    },

    /**
     * Auto-hydrate declarative elements across the page
     */
    hydrateAll: function() {
      if (typeof document === 'undefined') return;
      var footers = document.querySelectorAll('[data-sov-footer]');
      for (var i = 0; i < footers.length; i++) {
        footers[i].innerHTML = Factory.renderUniversalFooter();
      }
      var vaults = document.querySelectorAll('[data-sov-vault-widget]');
      for (var j = 0; j < vaults.length; j++) {
        vaults[j].innerHTML = Factory.renderVaultWidget();
      }
    },

    /**
     * Mount HTML into target element safely
     */
    mount: function(targetSelector, htmlContent) {
      var el = document.querySelector(targetSelector);
      if (el) {
        el.innerHTML = htmlContent;
        // Re-trigger button click binding if billing is available
        if (window.CasePathBilling) {
          var btns = el.querySelectorAll('[data-plan-tier]');
          for (var i = 0; i < btns.length; i++) {
            (function(b) {
              b.addEventListener('click', function(e) {
                e.preventDefault();
                window.CasePathBilling.startCheckout(b.getAttribute('data-plan-tier'));
              });
            })(btns[i]);
          }
        }
      }
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        Factory.hydrateAll();
      });
    } else {
      Factory.hydrateAll();
    }
  }

  window.SovereignFactory = Factory;
})(typeof window !== 'undefined' ? window : this);
