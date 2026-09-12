/**
 * Repairs icon-only glyphs that were corrupted to question marks by an
 * encoding pass. Uses inline SVG so the fix is not dependent on emoji fonts.
 */
(function () {
  var ICONS = {
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 4.3 2.8 17.1A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.9L13.7 4.3a2 2 0 0 0-3.4 0Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    family: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2"/><path d="M3 21v-2a6 6 0 0 1 12 0v2"/><path d="M15 14a4 4 0 0 1 6 3.5V21"/></svg>',
    file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-7h6v7"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v6"/><path d="M12 16v6"/><path d="m4.9 4.9 4.2 4.2"/><path d="m14.9 14.9 4.2 4.2"/><path d="M2 12h6"/><path d="M16 12h6"/><path d="m4.9 19.1 4.2-4.2"/><path d="m14.9 9.1 4.2-4.2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>',
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>'
  };

  function icon(name) {
    return '<span class="cp-repaired-icon cp-repaired-icon--' + name + '">' + (ICONS[name] || ICONS.spark) + '</span>';
  }

  function text(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function setIcon(el, name) {
    if (!el || el.dataset.cpIconRepaired === '1') return;
    el.innerHTML = icon(name);
    el.dataset.cpIconRepaired = '1';
  }

  function chooseFromText(value) {
    var t = String(value || '').toLowerCase();
    if (/avo|violence|risk|urgent|crisis|warning|danger|required/.test(t)) return 'alert';
    if (/parent|children|family|team|kids/.test(t)) return 'family';
    if (/property|financial|support|pay|billing|settlement/.test(t)) return 'home';
    if (/calendar|deadline|date|event|timeline|hearing/.test(t)) return 'calendar';
    if (/glossary|legislation|plain english|forms|document|affidavit|notice|application/.test(t)) return 'book';
    if (/assistant|ask|chat|question|message/.test(t)) return 'chat';
    if (/health|wellbeing|psychologist|support network/.test(t)) return 'heart';
    if (/secure|encrypt|vault|access|privacy/.test(t)) return 'lock';
    if (/phone/.test(t)) return 'phone';
    if (/email|mail/.test(t)) return 'mail';
    if (/download/.test(t)) return 'download';
    return 'spark';
  }

  function repairIconOnlySlots(root) {
    var selectors = [
      '.search-icon', '.cat-icon', '.feat-emoji', '.ref-icon', '.case-type-icon',
      '.cr-tab-icon', '.cr-topic-card-icon', '.file-icon-col', '.review-check',
      '.vvr-lock', '.sc-opt-icon', '.mh-resource-icon', '.mh-tile > span:first-child',
      '.mh-tip > span:first-child', '.cr-topic-label', '.review-card-head > span:first-child'
    ].join(',');
    root.querySelectorAll(selectors).forEach(function (el) {
      var cls = el.className || '';
      var nearby = text(el.parentElement || el);
      if (cls.indexOf('search-icon') !== -1) return setIcon(el, 'search');
      if (cls.indexOf('file-icon-col') !== -1 || cls.indexOf('vvr-lock') !== -1) return setIcon(el, 'lock');
      if (cls.indexOf('review-check') !== -1) return setIcon(el, 'check');
      if (cls.indexOf('cr-tab-icon') !== -1) return setIcon(el, nearby.indexOf('Suggested') !== -1 ? 'book' : nearby.indexOf('Topics') !== -1 ? 'spark' : 'chat');
      if (/^\?+$/.test(text(el)) || text(el).indexOf('??') === 0) setIcon(el, chooseFromText(nearby));
    });
    root.querySelectorAll('span, div').forEach(function (el) {
      if (el.children.length !== 0) return;
      if (!/^\?{2,}$/.test(text(el))) return;
      setIcon(el, chooseFromText(text(el.parentElement || el)));
    });
  }

  function repairLeadingMarkers(root) {
    root.querySelectorAll('button, a, strong, p, div, span').forEach(function (el) {
      var value = text(el);
      var html = el.innerHTML || '';
      if (el.dataset.cpLeadRepaired === '1' && !/^\?{2,}\s*/.test(html.trim())) return;
      if (!/^\?{2,}\s+\S/.test(value) || !/^\?{2,}\s*/.test(html.trim())) return;
      var raw = html.trimStart();
      el.innerHTML = raw.replace(/^\?{2,}\s*/, icon(chooseFromText(value)) + ' ');
      el.dataset.cpLeadRepaired = '1';
    });
  }

  function repairControls(root) {
    root.querySelectorAll('button, .modal-close, .tm-delete, .event-remove, .po-child-remove').forEach(function (el) {
      var label = text(el);
      var on = (el.getAttribute('onclick') || '').toLowerCase();
      var aria = (el.getAttribute('aria-label') || '').toLowerCase();
      if (/^\?+$/.test(label)) {
        if (/close/.test(on + aria) || el.classList.contains('modal-close')) return setIcon(el, 'close');
        if (/delete|remove/.test(on + aria) || /delete|remove/.test(el.className || '')) return setIcon(el, 'trash');
        if (/send/.test(on + aria)) return setIcon(el, 'send');
        return setIcon(el, 'chevron');
      }
      if (/^\?{2,}\s*pay/i.test(label)) {
        el.innerHTML = el.innerHTML.replace(/^\?{2,}\s*/, icon('lock') + ' ');
      }
      if (/^\?{2,}\s*download/i.test(label)) {
        el.innerHTML = el.innerHTML.replace(/^\?{2,}\s*/, icon('download') + ' ');
      }
    });
  }

  function repairDynamicGlobals() {
    if (window.CAL_TYPE_ICONS) {
      window.CAL_TYPE_ICONS = { court: 'Court', deadline: 'Due', mediation: 'FDR', lawyer: 'Law', other: 'Note' };
    }
  }

  function injectCss() {
    if (document.getElementById('casepath-icon-repair-css')) return;
    var style = document.createElement('style');
    style.id = 'casepath-icon-repair-css';
    style.textContent =
      '.cp-repaired-icon{display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;vertical-align:-0.14em;line-height:1;color:currentColor;flex:0 0 auto}' +
      '.cp-repaired-icon svg{width:1em;height:1em;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '.search-icon .cp-repaired-icon,.cat-icon .cp-repaired-icon,.feat-emoji .cp-repaired-icon,.ref-icon .cp-repaired-icon,.case-type-icon .cp-repaired-icon,.cr-topic-card-icon .cp-repaired-icon{width:1.15em;height:1.15em}' +
      '.cr-tab-icon .cp-repaired-icon,.review-check .cp-repaired-icon,.file-icon-col .cp-repaired-icon,.vvr-lock .cp-repaired-icon{width:1em;height:1em}' +
      'button .cp-repaired-icon,a .cp-repaired-icon,strong .cp-repaired-icon,p .cp-repaired-icon,div .cp-repaired-icon{margin-right:.35em}' +
      '.search-icon .cp-repaired-icon,.cat-icon .cp-repaired-icon,.feat-emoji .cp-repaired-icon,.ref-icon .cp-repaired-icon,.case-type-icon .cp-repaired-icon,.cr-tab-icon .cp-repaired-icon,.cr-topic-card-icon .cp-repaired-icon,.file-icon-col .cp-repaired-icon,.review-check .cp-repaired-icon,.vvr-lock .cp-repaired-icon{margin-right:0}';
    document.head.appendChild(style);
  }

  function repair(root) {
    root = root || document;
    injectCss();
    repairIconOnlySlots(root);
    repairLeadingMarkers(root);
    repairControls(root);
    repairDynamicGlobals();
  }

  function start() {
    repair(document);
    var timer;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () { repair(document); }, 50);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
