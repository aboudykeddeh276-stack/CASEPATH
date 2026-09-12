/**
 * Stable glossary term slugs and deep-link URLs.
 * Used by glossary-renderer, route helpers, and Ask a Question links.
 */
(function (global) {
  "use strict";

  var GLOSSARY_PATH = "/glossary.html";

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[''"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeTermSlug(raw) {
    var slug = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/^#/, "");
    if (slug.indexOf("gterm-") === 0) slug = slug.slice("gterm-".length);
    if (slug.indexOf("term-") === 0) slug = slug.slice("term-".length);
    return slug;
  }

  function anchorIdForSlug(slug) {
    var normalized = normalizeTermSlug(slug);
    return normalized ? "gterm-" + normalized : "";
  }

  function glossaryPath() {
    var cfg = global.CasePathGlossaryConfig;
    if (cfg && cfg.basePath) return cfg.basePath;
    return GLOSSARY_PATH;
  }

  function buildTermUrl(slug) {
    var normalized = normalizeTermSlug(slug);
    var base = glossaryPath();
    if (!normalized) return base;
    return base + "?term=" + encodeURIComponent(normalized);
  }

  function slugFromEntry(entry) {
    if (!entry) return "";
    if (entry.slug) return normalizeTermSlug(entry.slug);
    if (entry.id) return normalizeTermSlug(entry.id);
    var label = entry.term || entry.name || "";
    if (!label) return "";

    var lc = String(label).toLowerCase().trim();
    if (global.GLOSSARY && global.GLOSSARY.length) {
      for (var i = 0; i < global.GLOSSARY.length; i++) {
        var g = global.GLOSSARY[i];
        if ((g.term || "").toLowerCase().trim() === lc) {
          return normalizeTermSlug(g.slug || slugify(g.term));
        }
      }
    }

    if (global.CasePathGlossary && typeof global.CasePathGlossary.getTermBySlug === "function") {
      var bySlug = global.CasePathGlossary.getTermBySlug(slugify(label));
      if (bySlug && bySlug.slug) return normalizeTermSlug(bySlug.slug);
    }

    return slugify(label);
  }

  var api = {
    GLOSSARY_PATH: GLOSSARY_PATH,
    glossaryPath: glossaryPath,
    slugify: slugify,
    normalizeTermSlug: normalizeTermSlug,
    anchorIdForSlug: anchorIdForSlug,
    buildTermUrl: buildTermUrl,
    slugFromEntry: slugFromEntry,
  };

  global.CasePathGlossarySlug = api;

  if (global.CasePathGlossary && !global.CasePathGlossary.slugify) {
    global.CasePathGlossary.slugify = slugify;
  }
})(typeof window !== "undefined" ? window : this);
