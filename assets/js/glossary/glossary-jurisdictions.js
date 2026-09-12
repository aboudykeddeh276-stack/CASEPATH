/**
 * AU glossary jurisdiction codes. Consumes CasePathJurisdiction when present.
 * Empty term jurisdictions mean AU_ALL within the AU pack — not all legal systems.
 */
(function (global) {
  "use strict";

  var CODES = [
    { code: "national", label: "National", short: "National" },
    { code: "federal", label: "Federal", short: "Federal" },
    { code: "nsw", label: "New South Wales", short: "NSW" },
    { code: "vic", label: "Victoria", short: "VIC" },
    { code: "qld", label: "Queensland", short: "QLD" },
    { code: "wa", label: "Western Australia", short: "WA" },
    { code: "sa", label: "South Australia", short: "SA" },
    { code: "tas", label: "Tasmania", short: "TAS" },
    { code: "act", label: "Australian Capital Territory", short: "ACT" },
    { code: "nt", label: "Northern Territory", short: "NT" },
    { code: "all", label: "All jurisdictions", short: "All" },
  ];

  var CODE_SET = Object.create(null);
  for (var i = 0; i < CODES.length; i++) {
    CODE_SET[CODES[i].code] = CODES[i];
  }

  function normalizeCode(value) {
    var J = global.CasePathJurisdiction;
    var raw = String(value || "").trim();
    if (!raw) return "";
    var lower = raw.toLowerCase();
    if (lower === "commonwealth" || lower === "cth") return CODE_SET.federal ? "federal" : "";
    if (lower === "national" || lower === "federal" || lower === "all") return CODE_SET[lower] ? lower : "";
    if (J && typeof J.parseSubJurisdiction === "function") {
      var parsed = J.parseSubJurisdiction(raw);
      if (parsed.ok) return parsed.code;
      return "";
    }
    if (codeAlias(lower)) lower = codeAlias(lower);
    return CODE_SET[lower] ? lower : "";
  }

  function codeAlias(code) {
    if (code === "new south wales") return "nsw";
    if (code === "victoria") return "vic";
    if (code === "queensland") return "qld";
    if (code === "western australia") return "wa";
    if (code === "south australia") return "sa";
    if (code === "tasmania") return "tas";
    if (code === "australian capital territory") return "act";
    if (code === "northern territory") return "nt";
    return code;
  }

  function normalizeList(raw) {
    if (!raw) return [];
    var arr = Array.isArray(raw) ? raw : [raw];
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < arr.length; i++) {
      var code = normalizeCode(arr[i]);
      if (!code || seen[code]) continue;
      seen[code] = 1;
      out.push(code);
    }
    return out;
  }

  function matchesFilter(termJurisdictions, activeCode) {
    return matchesFilters(termJurisdictions, activeCode ? [activeCode] : []);
  }

  /**
   * Multi-select OR filter. National-tagged and unscoped AU-pack terms always pass.
   * Empty term jurisdictions are AU_ALL for this AU glossary, not an unknown
   * international wildcard.
   */
  function matchesFilters(termJurisdictions, activeCodes) {
    var list = normalizeList(termJurisdictions);
    if (!list.length || list.indexOf("all") !== -1 || list.indexOf("national") !== -1) return true;

    var active = normalizeList(activeCodes);
    if (!active.length) return false;

    for (var i = 0; i < active.length; i++) {
      var code = active[i];
      if (code === "national") {
        if (list.indexOf("national") !== -1) return true;
        continue;
      }
      if (code === "federal") {
        if (list.indexOf("federal") !== -1) return true;
        continue;
      }
      if (list.indexOf(code) !== -1) return true;
    }
    return false;
  }

  var FILTER_CODES = CODES.filter(function (item) {
    return item.code !== "all";
  });

  var DEFAULT_FILTER_CODES = ["national", "federal"];

  function filterChipsHtml() {
    var html = "";
    for (var i = 0; i < FILTER_CODES.length; i++) {
      var item = FILTER_CODES[i];
      var locked = item.code === "national";
      html +=
        '<button type="button" class="alpha-cat-chip glossary-jurisdiction-chip' +
        (DEFAULT_FILTER_CODES.indexOf(item.code) !== -1 ? " is-active" : "") +
        (locked ? " is-locked" : "") +
        '" data-jurisdiction-code="' +
        item.code +
        '"' +
        (locked ? ' aria-disabled="true" title="National terms always visible"' : "") +
        ">" +
        item.short +
        "</button>";
    }
    return html;
  }

  function badgeLabel(code) {
    var item = CODE_SET[normalizeCode(code)];
    return item ? item.short : String(code || "").toUpperCase();
  }

  function renderBadgesHtml(jurisdictions, options) {
    options = options || {};
    var list = normalizeList(jurisdictions);
    if (!list.length) return "";
    var max = options.max == null ? 4 : options.max;
    var html = '<span class="glossary-jurisdiction-badges" aria-label="Jurisdictions">';
    for (var i = 0; i < list.length && i < max; i++) {
      html +=
        '<span class="glossary-jurisdiction-badge glossary-jurisdiction-badge--' +
        list[i] +
        '">[' +
        badgeLabel(list[i]) +
        "]</span>";
    }
    html += "</span>";
    return html;
  }

  function selectOptionsHtml(includeAll) {
    var html = includeAll !== false ? '<option value="">All jurisdictions</option>' : "";
    for (var i = 0; i < CODES.length; i++) {
      var item = CODES[i];
      if (item.code === "all") continue;
      html +=
        '<option value="' +
        item.code +
        '">' +
        item.short +
        (item.short !== item.label ? " — " + item.label : "") +
        "</option>";
    }
    return html;
  }

  global.CasePathGlossaryJurisdictions = {
    PACK: { legalSystem: "AU", id: "AU", scopeDefault: "AU_ALL" },
    CODES: CODES,
    CODE_SET: CODE_SET,
    FILTER_CODES: FILTER_CODES,
    DEFAULT_FILTER_CODES: DEFAULT_FILTER_CODES,
    normalizeCode: normalizeCode,
    normalizeList: normalizeList,
    matchesFilter: matchesFilter,
    matchesFilters: matchesFilters,
    selectOptionsHtml: selectOptionsHtml,
    filterChipsHtml: filterChipsHtml,
    badgeLabel: badgeLabel,
    renderBadgesHtml: renderBadgesHtml,
  };
})(typeof window !== "undefined" ? window : this);
