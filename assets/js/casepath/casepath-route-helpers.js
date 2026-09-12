/**
 * Stable route helpers for checklist, timeline, evidence, chronology, and workflow links.
 */
(function (w) {
  "use strict";
  if (!w) return;
  if (w.CasePathRouteHelpers && w.CasePathRouteHelpers.__ready) return;

  function enc(value) {
    return encodeURIComponent(String(value || "").trim());
  }

  function withHash(path, hash) {
    if (!hash) return path;
    return path + "#" + String(hash).replace(/^#/, "");
  }

  function checklist(slug, section) {
    if (!slug) return "/checklists.html";
    return withHash("/checklists/" + enc(slug) + ".html", section ? "section-" + enc(section) : "");
  }

  function workspaceFocus(focus, params) {
    var query = new URLSearchParams();
    if (focus) query.set("focus", String(focus));
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value != null && value !== "") query.set(key, String(value));
    });
    var qs = query.toString();
    return "/app/workspace/index.html" + (qs ? "?" + qs : "");
  }

  function evidenceUpload(context) {
    return workspaceFocus("evidence-upload", context || {});
  }

  function chronologyEntry(id) {
    return workspaceFocus("chronology", id ? { entry: id } : {});
  }

  function mediationStage(stage) {
    return "/app/mediation/index.html" + (stage ? "?stage=" + enc(stage) : "");
  }

  function parentingDraft(draft) {
    return "/parenting-orders.html" + (draft ? "?draft=" + enc(draft) : "");
  }

  function glossary(term) {
    if (!term) return "/glossary.html";
    var slug = term;
    if (w.CasePathGlossarySlug && typeof w.CasePathGlossarySlug.normalizeTermSlug === "function") {
      slug = w.CasePathGlossarySlug.normalizeTermSlug(term);
      if (!slug && typeof w.CasePathGlossarySlug.slugify === "function") {
        slug = w.CasePathGlossarySlug.slugify(term);
      }
    } else {
      slug = String(term || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
    }
    if (!slug) return "/glossary.html";
    return "/glossary.html?term=" + enc(slug);
  }

  function askQuestion() {
    try {
      if (w.CasePathRoutes && typeof w.CasePathRoutes.askQuestionHref === "function") {
        return w.CasePathRoutes.askQuestionHref();
      }
      if (w.CasePathRoutes && typeof w.CasePathRoutes.url === "function") {
        return w.CasePathRoutes.url("qa") || w.CasePathRoutes.url("askQuestion");
      }
    } catch (eAsk) {}
    return "/index.html?goto=qa";
  }

  function fromLinkSpec(spec) {
    if (!spec) return null;
    if (typeof spec === "string") return spec;
    if (spec.href) return spec.href;
    if (spec.kind === "checklist") return checklist(spec.slug, spec.section);
    if (spec.kind === "evidence") return evidenceUpload(spec.params);
    if (spec.kind === "chronology") return chronologyEntry(spec.id);
    if (spec.kind === "mediation") return mediationStage(spec.stage);
    if (spec.kind === "parenting") return parentingDraft(spec.draft);
    if (spec.kind === "glossary") return glossary(spec.term);
    return null;
  }

  w.CasePathRouteHelpers = {
    __ready: true,
    checklist: checklist,
    workspaceFocus: workspaceFocus,
    evidenceUpload: evidenceUpload,
    chronologyEntry: chronologyEntry,
    mediationStage: mediationStage,
    parentingDraft: parentingDraft,
    glossary: glossary,
    askQuestion: askQuestion,
    fromLinkSpec: fromLinkSpec,
  };
})(typeof window !== "undefined" ? window : this);
