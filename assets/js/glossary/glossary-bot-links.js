/**

 * Ask a Question — glossary match deep links (View in Glossary).

 */

(function (global) {

  "use strict";



  function slugApi() {

    return global.CasePathGlossarySlug || null;

  }



  function aliasApi() {

    return global.CasePathGlossaryAliasNormalize || null;

  }



  function escapeHtml(text) {

    if (typeof global.escapeHtmlUnsafeText === "function") {

      return global.escapeHtmlUnsafeText(text);

    }

    return String(text || "")

      .replace(/&/g, "&amp;")

      .replace(/</g, "&lt;")

      .replace(/>/g, "&gt;")

      .replace(/"/g, "&quot;");

  }



  function normalizeSlug(raw) {

    var api = slugApi();

    if (api && typeof api.normalizeTermSlug === "function") {

      return api.normalizeTermSlug(raw);

    }

    return String(raw || "")

      .trim()

      .toLowerCase()

      .replace(/^#/, "")

      .replace(/^gterm-/, "")

      .replace(/^term-/, "");

  }



  function slugifyLabel(label) {

    var aliases = aliasApi();

    if (aliases && typeof aliases.casepathSlugifyLabel === "function") {

      return aliases.casepathSlugifyLabel(label);

    }

    var api = slugApi();

    if (api && typeof api.slugify === "function") {

      return api.slugify(label);

    }

    return String(label || "")

      .trim()

      .toLowerCase()

      .replace(/[''"]/g, "")

      .replace(/[^a-z0-9]+/g, "-")

      .replace(/^-+|-+$/g, "");

  }



  function prioritySlug(slug) {

    var aliases = aliasApi();

    if (aliases && typeof aliases.casepathResolvePrioritySlug === "function") {

      return aliases.casepathResolvePrioritySlug(slug);

    }

    return normalizeSlug(slug);

  }



  function glossaryTermBySlug(slug) {

    var normalized = prioritySlug(normalizeSlug(slug));

    if (!normalized) return null;

    var G = global.CasePathGlossary;

    if (G && typeof G.getTermBySlug === "function") {

      var term = G.getTermBySlug(normalized);

      if (term && typeof G.resolveCanonicalTerm === "function") {

        term = G.resolveCanonicalTerm(term) || term;

      }

      if (term && term.slug) return term;

    }

    if (global.GLOSSARY && global.GLOSSARY.length) {

      for (var i = 0; i < global.GLOSSARY.length; i++) {

        var g = global.GLOSSARY[i];

        if (!g || !g.slug) continue;

        if (normalizeSlug(g.slug) === normalized) return g;

      }

    }

    return null;

  }



  function glossaryTermByLabel(label) {

    var lc = String(label || "")

      .trim()

      .toLowerCase();

    if (!lc) return null;



    if (global.GLOSSARY && global.GLOSSARY.length) {

      for (var i = 0; i < global.GLOSSARY.length; i++) {

        var g = global.GLOSSARY[i];

        if ((g.term || "").toLowerCase().trim() === lc) return g;

      }

    }



    var G = global.CasePathGlossary;

    if (G && typeof G.getAllTerms === "function") {

      var all = G.getAllTerms();

      for (var j = 0; j < all.length; j++) {

        var t = all[j];

        if ((t.term || "").toLowerCase().trim() === lc) return t;

      }

    }



    var guessed = glossaryTermBySlug(slugifyLabel(label));

    return guessed;

  }



  function slugFromEntry(entry) {

    if (!entry) return "";



    if (typeof entry === "string") {

      var asString = normalizeSlug(entry);

      var byString = glossaryTermBySlug(asString);

      if (byString && byString.slug) return prioritySlug(byString.slug);

      var byLabel = glossaryTermByLabel(entry);

      if (byLabel && byLabel.slug) return prioritySlug(byLabel.slug);

      return prioritySlug(slugifyLabel(entry) || asString);

    }



    if (entry.canonical_slug) {

      var canon = glossaryTermBySlug(entry.canonical_slug);

      if (canon && canon.slug) return prioritySlug(canon.slug);

    }



    if (entry.slug) {

      var fromSlug = glossaryTermBySlug(entry.slug);

      if (fromSlug && fromSlug.slug) return prioritySlug(fromSlug.slug);

      return prioritySlug(entry.slug);

    }



    if (entry.id) {

      var fromId = glossaryTermBySlug(entry.id);

      if (fromId && fromId.slug) return prioritySlug(fromId.slug);

    }



    var label = entry.term || entry.name || "";

    if (label) {

      var fromLabel = glossaryTermByLabel(label);

      if (fromLabel && fromLabel.slug) return prioritySlug(fromLabel.slug);

      return prioritySlug(slugifyLabel(label));

    }



    var api = slugApi();

    if (api && typeof api.slugFromEntry === "function") {

      return prioritySlug(api.slugFromEntry(entry));

    }



    return "";

  }



  function buildTermHref(slug) {

    var normalized = prioritySlug(normalizeSlug(slug));

    var api = slugApi();

    if (api && typeof api.buildTermUrl === "function") {

      return api.buildTermUrl(normalized);

    }

    if (global.CasePathRouteHelpers && typeof global.CasePathRouteHelpers.glossary === "function") {

      return global.CasePathRouteHelpers.glossary(normalized);

    }

    if (!normalized) return "/glossary.html";

    return "/glossary.html?term=" + encodeURIComponent(normalized);

  }



  function termHref(slugOrEntry) {

    if (typeof slugOrEntry === "object") {

      return buildTermHref(slugFromEntry(slugOrEntry));

    }

    return buildTermHref(slugFromEntry(slugOrEntry));

  }



  function resolveGlossaryLinkTarget(entry) {

    var matchedSlug = slugFromEntry(entry);

    var resolved = matchedSlug ? glossaryTermBySlug(matchedSlug) : null;

    var displayedTerm =

      (resolved && resolved.term) ||

      (entry && (entry.term || entry.name)) ||

      matchedSlug ||

      "";

    var generatedHref = buildTermHref(matchedSlug);

    return {

      matchedSlug: matchedSlug,

      matchedTerm: entry && entry.term ? entry.term : displayedTerm,

      displayedTerm: displayedTerm,

      generatedHref: generatedHref,

      resolvedTerm: resolved && resolved.term ? resolved.term : displayedTerm,

    };

  }



  function logMatchLinks(matches, context) {

    if (!matches || !matches.length) return;

    var rows = [];

    for (var i = 0; i < matches.length; i++) {

      rows.push(resolveGlossaryLinkTarget(matches[i]));

    }

    try {

      console.log("[Ask a Question glossary links]" + (context ? " " + context : ""), rows);

    } catch (eLog) {}

    return rows;

  }



  function jurisdictionBadgesHtml(entry) {

    var J = global.CasePathGlossaryJurisdictions;

    if (!J || typeof J.renderBadgesHtml !== "function") return "";

    var list = entry && entry.jurisdictions;

    if (!list) {

      var resolved = glossaryTermBySlug(slugFromEntry(entry));

      list = resolved && resolved.jurisdictions;

    }

    return J.renderBadgesHtml(list, { max: 3 });

  }



  function renderMatchLinksHtml(matches, options) {

    options = options || {};

    if (!matches || !matches.length) return "";



    logMatchLinks(matches, options.logContext || "renderMatchLinksHtml");



    var title = options.title || "View in Glossary";

    var max = options.max == null ? 5 : options.max;

    var html =

      '<div class="bot-answer-glossary" aria-label="Glossary entries">' +

      '<div class="bot-answer-section-title">' +

      escapeHtml(title) +

      "</div>" +

      '<ul class="bot-answer-resources-list">';



    var seen = Object.create(null);

    var count = 0;



    for (var i = 0; i < matches.length && count < max; i++) {

      var entry = matches[i];

      var target = resolveGlossaryLinkTarget(entry);

      var slug = target.matchedSlug;

      if (!slug || seen[slug]) continue;

      seen[slug] = 1;

      count++;

      var label = target.displayedTerm || slug;

      var badges = jurisdictionBadgesHtml(entry);

      html +=

        '<li><a class="bot-resource-link bot-glossary-term-link" href="' +

        escapeHtml(target.generatedHref) +

        '" data-glossary-slug="' +

        escapeHtml(slug) +

        '">' +

        escapeHtml(label) +

        (badges ? " " + badges : "") +

        " →</a></li>";

    }



    html += "</ul></div>";

    return count ? html : "";

  }



  function glossaryResourceItem(matches, fallbackHref) {

    var href = fallbackHref || "/glossary.html";

    var label = "Glossary";

    if (matches && matches.length) {

      var target = resolveGlossaryLinkTarget(matches[0]);

      if (target.matchedSlug) {

        href = target.generatedHref;

        label = "Go to Glossary: " + (target.displayedTerm || target.matchedSlug);

      }

    }

    return { label: label, href: href, key: "glossary" };

  }



  global.CasePathGlossaryBotLinks = {

    termHref: termHref,

    slugFromEntry: slugFromEntry,

    resolveGlossaryLinkTarget: resolveGlossaryLinkTarget,

    logMatchLinks: logMatchLinks,

    jurisdictionBadgesHtml: jurisdictionBadgesHtml,

    renderMatchLinksHtml: renderMatchLinksHtml,

    glossaryResourceItem: glossaryResourceItem,

  };

})(typeof window !== "undefined" ? window : this);


