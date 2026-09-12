/**
 * CasePath Global Smart Search — desktop primary nav (≥1026px).
 * Matches desktop category-row floor (hidden ≤1025px). Lazy-loads index.
 */
(function (w, d) {
  "use strict";

  if (w.__CASEPATH_SMART_SEARCH_WIRED__) return;
  w.__CASEPATH_SMART_SEARCH_WIRED__ = true;

  var DESKTOP_MQ = "(min-width: 1026px)";
  var INDEX_URL = "/assets/js/data/casepath-smart-search-index.json";
  var DEBOUNCE_MS = 200;
  var MIN_CHARS = 2;
  var MAX_RESULTS = 10;

  /* Lower number = higher priority (interactive workflows first). */
  var KIND_PRIORITY = {
    assistant: 1,
    guide: 2,
    checklist: 3,
    form: 4,
    prepare: 5,
    glossary: 6,
    workspace: 7,
    support: 8,
  };

  var KIND_ORDER = [
    "assistant",
    "guide",
    "checklist",
    "form",
    "prepare",
    "glossary",
    "workspace",
    "support",
  ];

  var KIND_LABEL = {
    assistant: "Court Document Assistant",
    guide: "Guide",
    checklist: "Checklist",
    form: "Form",
    prepare: "Prepare resource",
    glossary: "Glossary",
    workspace: "Workspace",
    support: "Support",
  };

  var KIND_ICON = {
    assistant: "🤖",
    guide: "📘",
    checklist: "✅",
    form: "📄",
    prepare: "🧭",
    glossary: "📚",
    workspace: "🗂",
    support: "🛟",
  };

  var root = null;
  var input = null;
  var listbox = null;
  var statusEl = null;
  var kbdHint = null;
  var mq = w.matchMedia(DESKTOP_MQ);

  var indexData = null;
  var indexPromise = null;
  var flatResults = [];
  var activeIndex = -1;
  var debounceTimer = null;
  var open = false;

  function isDesktop() {
    return mq.matches;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeHref(href) {
    var raw = String(href || "").trim();
    if (!raw) return "";
    try {
      var a = d.createElement("a");
      a.href = raw;
      var pathPart = (a.pathname || "").replace(/\/+$/, "") || "/";
      var params = new URLSearchParams(a.search || "");
      var term = params.get("term");
      if (term) return pathPart + "?term=" + encodeURIComponent(term);
      var gotoParam = params.get("goto");
      if (gotoParam) return pathPart + "?goto=" + encodeURIComponent(gotoParam);
      return pathPart + (a.hash || "");
    } catch (_e) {
      return raw.split("#")[0];
    }
  }

  function itemKind(item) {
    if (item && item.kind && KIND_PRIORITY[item.kind]) return item.kind;
    var cat = String((item && item.category) || "");
    if (cat === "Court Document Assistants") return "assistant";
    if (cat === "Glossary") return "glossary";
    if (cat === "Your Case") return "workspace";
    if (cat === "Learn") return "guide";
    if (cat === "Prepare") return "prepare";
    return "support";
  }

  function kindPriority(item) {
    if (item && typeof item.kindPriority === "number") return item.kindPriority;
    return KIND_PRIORITY[itemKind(item)] || 99;
  }

  function loadIndex() {
    if (indexData) return Promise.resolve(indexData);
    if (indexPromise) return indexPromise;
    indexPromise = fetch(INDEX_URL, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("Smart search index HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        indexData = data;
        return data;
      })
      .catch(function (err) {
        indexPromise = null;
        console.warn("[CasePath Smart Search] index load failed", err);
        throw err;
      });
    return indexPromise;
  }

  function scoreItem(item, q, aliasBoostIds) {
    var title = normalize(item.title);
    var desc = normalize(item.description);
    var aliases = (item.aliases || []).map(normalize);
    var keywords = (item.keywords || []).map(normalize);
    var score = 0;

    if (title === q) score += 100;
    else if (title.indexOf(q) === 0) score += 80;
    else if (title.indexOf(q) !== -1) score += 60;

    for (var i = 0; i < aliases.length; i++) {
      if (aliases[i] === q) score += 90;
      else if (aliases[i].indexOf(q) === 0) score += 70;
      else if (aliases[i].indexOf(q) !== -1) score += 50;
    }

    for (var k = 0; k < keywords.length; k++) {
      if (keywords[k].indexOf(q) !== -1) score += 25;
    }

    if (desc.indexOf(q) !== -1) score += 15;

    if (aliasBoostIds && aliasBoostIds[item.id]) score += 40;

    return score;
  }

  function resolveAliasBoosts(q, data) {
    var boost = Object.create(null);
    var aliases = (data && data.aliases) || [];
    for (var i = 0; i < aliases.length; i++) {
      var a = aliases[i];
      var aliasNorm = normalize(a.alias);
      var expandNorm = normalize(a.expand);
      if (aliasNorm === q || expandNorm === q || aliasNorm.indexOf(q) === 0 || q.indexOf(aliasNorm) === 0) {
        if (a.targetId) boost[a.targetId] = true;
      }
    }
    return boost;
  }

  function search(query) {
    var q = normalize(query);
    if (!indexData || q.length < MIN_CHARS) return [];

    var boost = resolveAliasBoosts(q, indexData);
    var scored = [];
    var items = indexData.items || [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var s = scoreItem(item, q, boost);
      if (s > 0) scored.push({ item: item, score: s });
    }

    scored.sort(function (a, b) {
      /* Relevance first, then interactive kinds over static pages. */
      if (b.score !== a.score) return b.score - a.score;
      var ka = kindPriority(a.item);
      var kb = kindPriority(b.item);
      if (ka !== kb) return ka - kb;
      return String(a.item.title).localeCompare(String(b.item.title));
    });

    var out = [];
    var seenId = Object.create(null);
    var seenHref = Object.create(null);
    for (var j = 0; j < scored.length && out.length < MAX_RESULTS; j++) {
      var candidate = scored[j].item;
      var id = candidate.id;
      var hrefKey = normalizeHref(candidate.href);
      if (seenId[id]) continue;
      if (hrefKey && seenHref[hrefKey]) continue;
      seenId[id] = true;
      if (hrefKey) seenHref[hrefKey] = true;
      out.push(candidate);
    }
    return out;
  }

  function groupByKind(results) {
    var groups = Object.create(null);
    for (var i = 0; i < results.length; i++) {
      var kind = itemKind(results[i]);
      if (!groups[kind]) groups[kind] = [];
      groups[kind].push(results[i]);
    }
    var ordered = [];
    for (var c = 0; c < KIND_ORDER.length; c++) {
      var key = KIND_ORDER[c];
      if (groups[key] && groups[key].length) {
        ordered.push({ kind: key, label: KIND_LABEL[key] || key, items: groups[key] });
      }
    }
    Object.keys(groups).forEach(function (key) {
      if (KIND_ORDER.indexOf(key) === -1 && groups[key].length) {
        ordered.push({ kind: key, label: KIND_LABEL[key] || key, items: groups[key] });
      }
    });
    return ordered;
  }

  function highlight(text, query) {
    var raw = String(text || "");
    var q = String(query || "").trim();
    if (!q) return escapeHtml(raw);
    var lower = raw.toLowerCase();
    var qLower = q.toLowerCase();
    var idx = lower.indexOf(qLower);
    if (idx === -1) return escapeHtml(raw);
    return (
      escapeHtml(raw.slice(0, idx)) +
      '<mark class="cp-smart-search-mark">' +
      escapeHtml(raw.slice(idx, idx + q.length)) +
      "</mark>" +
      escapeHtml(raw.slice(idx + q.length))
    );
  }

  function announce(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
  }

  function closeResults() {
    open = false;
    activeIndex = -1;
    flatResults = [];
    if (listbox) {
      listbox.hidden = true;
      listbox.innerHTML = "";
    }
    if (input) input.setAttribute("aria-expanded", "false");
    if (root) root.classList.remove("cp-smart-search--open");
  }

  function openSelected() {
    if (activeIndex < 0 || activeIndex >= flatResults.length) return;
    var item = flatResults[activeIndex];
    if (!item || !item.href) return;
    closeResults();
    w.location.href = item.href;
  }

  function setActive(idx) {
    if (!listbox) return;
    var options = listbox.querySelectorAll('[role="option"]');
    if (!options.length) {
      activeIndex = -1;
      return;
    }
    if (idx < 0) idx = options.length - 1;
    if (idx >= options.length) idx = 0;
    activeIndex = idx;
    for (var i = 0; i < options.length; i++) {
      var on = i === activeIndex;
      options[i].setAttribute("aria-selected", on ? "true" : "false");
      options[i].classList.toggle("is-active", on);
    }
    var active = options[activeIndex];
    if (active) {
      input.setAttribute("aria-activedescendant", active.id);
      if (typeof active.scrollIntoView === "function") {
        active.scrollIntoView({ block: "nearest" });
      }
    }
  }

  function renderResults(query, results) {
    if (!listbox) return;
    flatResults = [];
    activeIndex = -1;
    input.removeAttribute("aria-activedescendant");

    if (!results.length) {
      listbox.innerHTML =
        '<div class="cp-smart-search-empty" role="presentation">' +
        '<p class="cp-smart-search-empty__title">No matching resources found.</p>' +
        '<p class="cp-smart-search-empty__hint">Try browsing:</p>' +
        '<ul class="cp-smart-search-empty__links">' +
        '<li><a href="/mission.html">Browse Learn</a></li>' +
        '<li><a href="/prepare.html">Browse Prepare</a></li>' +
        '<li><a href="/glossary.html">Browse Glossary</a></li>' +
        "</ul></div>";
      listbox.hidden = false;
      open = true;
      root.classList.add("cp-smart-search--open");
      input.setAttribute("aria-expanded", "true");
      announce("No matching resources found.");
      return;
    }

    var groups = groupByKind(results);
    var html = "";
    var optionIndex = 0;

    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var icon = KIND_ICON[group.kind] || "•";
      html +=
        '<div class="cp-smart-search-group" role="presentation">' +
        '<div class="cp-smart-search-group__label" id="cp-ss-cat-' +
        g +
        '">' +
        '<span aria-hidden="true">' +
        icon +
        "</span> " +
        escapeHtml(group.label) +
        "</div>";

      for (var i = 0; i < group.items.length; i++) {
        var item = group.items[i];
        flatResults.push(item);
        var kind = itemKind(item);
        var itemIcon = KIND_ICON[kind] || icon;
        var optId = "cp-ss-opt-" + optionIndex;
        html +=
          '<a class="cp-smart-search-option" role="option" id="' +
          optId +
          '" href="' +
          escapeHtml(item.href) +
          '" data-index="' +
          optionIndex +
          '" data-kind="' +
          escapeHtml(kind) +
          '" aria-selected="false">' +
          '<span class="cp-smart-search-option__icon" aria-hidden="true">' +
          itemIcon +
          "</span>" +
          '<span class="cp-smart-search-option__body">' +
          '<span class="cp-smart-search-option__title">' +
          highlight(item.title, query) +
          "</span>" +
          '<span class="cp-smart-search-option__desc">' +
          highlight(item.description, query) +
          "</span>" +
          "</span></a>";
        optionIndex++;
      }
      html += "</div>";
    }

    listbox.innerHTML = html;
    listbox.hidden = false;
    open = true;
    root.classList.add("cp-smart-search--open");
    input.setAttribute("aria-expanded", "true");
    announce(results.length + " result" + (results.length === 1 ? "" : "s") + " available.");
    setActive(0);
  }

  function runSearch() {
    if (!isDesktop()) {
      closeResults();
      return;
    }
    var q = String(input.value || "").trim();
    if (q.length < MIN_CHARS) {
      closeResults();
      announce("");
      return;
    }
    loadIndex()
      .then(function () {
        renderResults(q, search(q));
      })
      .catch(function () {
        listbox.innerHTML =
          '<div class="cp-smart-search-empty"><p>Search is temporarily unavailable.</p></div>';
        listbox.hidden = false;
        open = true;
        announce("Search is temporarily unavailable.");
      });
  }

  function scheduleSearch() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, DEBOUNCE_MS);
  }

  function focusInput() {
    if (!isDesktop() || !input) return;
    input.focus();
    loadIndex();
  }

  function onDocumentKeydown(e) {
    var key = e.key;
    var isModK = (e.ctrlKey || e.metaKey) && !e.altKey && String(key).toLowerCase() === "k";
    if (isModK) {
      if (!isDesktop()) return;
      e.preventDefault();
      focusInput();
      return;
    }

    if (!open || !isDesktop()) return;

    if (key === "Escape") {
      e.preventDefault();
      closeResults();
      input.blur();
      return;
    }

    if (key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex + 1);
      return;
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex - 1);
      return;
    }
    if (key === "Enter" && activeIndex >= 0 && d.activeElement === input) {
      e.preventDefault();
      openSelected();
    }
  }

  function buildMarkup() {
    root = d.createElement("div");
    root.id = "cp-smart-search";
    root.className = "cp-smart-search";
    root.setAttribute("role", "search");
    root.setAttribute("aria-label", "Search CasePath");

    root.innerHTML =
      '<label class="cp-smart-search__label visually-hidden" for="cp-smart-search-input">Search CasePath</label>' +
      '<div class="cp-smart-search__field">' +
      '<span class="cp-smart-search__icon" aria-hidden="true">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      "</svg></span>" +
      '<input type="search" id="cp-smart-search-input" class="cp-smart-search__input" ' +
      'placeholder="Search CasePath..." autocomplete="off" spellcheck="false" ' +
      'aria-autocomplete="list" aria-controls="cp-smart-search-listbox" aria-expanded="false" ' +
      'aria-haspopup="listbox" />' +
      '<kbd class="cp-smart-search__kbd" aria-hidden="true">Ctrl + K</kbd>' +
      "</div>" +
      '<div id="cp-smart-search-listbox" class="cp-smart-search__listbox" role="listbox" hidden></div>' +
      '<div id="cp-smart-search-status" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>';

    input = root.querySelector("#cp-smart-search-input");
    listbox = root.querySelector("#cp-smart-search-listbox");
    statusEl = root.querySelector("#cp-smart-search-status");
    kbdHint = root.querySelector(".cp-smart-search__kbd");

    if (kbdHint && /Mac|iPhone|iPad|iPod/.test(w.navigator.platform || "")) {
      kbdHint.textContent = "⌘ K";
    }

    return root;
  }

  function mount() {
    var host = d.getElementById("cp-smart-search-slot");
    if (!host) {
      var account = d.querySelector(".header-account-zone");
      var topRow = d.querySelector(".nav-top-row.header-inner");
      if (topRow && account) {
        var zone = d.createElement("div");
        zone.className = "header-search-zone";
        zone.setAttribute("aria-label", "Site search");
        host = d.createElement("div");
        host.id = "cp-smart-search-slot";
        host.className = "cp-smart-search-slot";
        zone.appendChild(host);
        topRow.insertBefore(zone, account);
      } else {
        var lang = d.getElementById("lang-selector-wrap");
        if (lang && lang.parentNode) {
          host = d.createElement("div");
          host.id = "cp-smart-search-slot";
          host.className = "cp-smart-search-slot";
          lang.parentNode.insertBefore(host, lang);
        }
      }
    }
    if (!host || host.querySelector("#cp-smart-search")) return;

    buildMarkup();
    host.appendChild(root);

    input.addEventListener("input", function () {
      scheduleSearch();
    });
    input.addEventListener("focus", function () {
      root.classList.add("cp-smart-search--focused");
      loadIndex();
      var q = String(input.value || "").trim();
      if (q.length >= MIN_CHARS) runSearch();
    });
    input.addEventListener("blur", function () {
      root.classList.remove("cp-smart-search--focused");
    });

    listbox.addEventListener("mousedown", function (e) {
      var opt = e.target.closest('[role="option"]');
      if (!opt) return;
      e.preventDefault();
      var idx = Number(opt.getAttribute("data-index"));
      if (!isNaN(idx)) {
        activeIndex = idx;
        openSelected();
      }
    });

    d.addEventListener("click", function (e) {
      if (!open) return;
      if (root && !root.contains(e.target)) closeResults();
    });

    d.addEventListener("keydown", onDocumentKeydown);

    function syncVisibility() {
      if (!isDesktop()) closeResults();
    }
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", syncVisibility);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(syncVisibility);
    }
  }

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  w.CasePathSmartSearch = {
    focus: focusInput,
    close: closeResults,
    loadIndex: loadIndex,
  };
})(typeof window !== "undefined" ? window : this, document);
