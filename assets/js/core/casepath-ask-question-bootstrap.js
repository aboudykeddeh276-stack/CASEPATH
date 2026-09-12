/**
 * Ask a Question resilience bootstrap.
 *
 * The bot bundle (floating-bot.js) is lazy-loaded, but the "Ask a Question"
 * trigger and the suggestion cards use inline onclick="toggleBot()/botAsk(...)".
 * Before the bundle loads those globals are undefined, so the buttons did
 * nothing (dead controls). This bootstrap guarantees every entry point works:
 *
 *  1. Defines ordered, queueing stubs for the bot globals. A click made before
 *     the bundle is ready is queued and replayed (in order) once it loads.
 *  2. Eagerly warms the bot bundle on any surface that exposes an Ask a Question
 *     entry point, so the buttons are live well before the user clicks.
 *  3. Honours window.CASEPATH_AI_DISABLED: when true it shows an honest notice
 *     instead of a non-functional button.
 */
(function (w, doc) {
  "use strict";
  if (!w || !doc) return;
  if (w.__CASEPATH_ASK_BOOTSTRAP__) return;
  w.__CASEPATH_ASK_BOOTSTRAP__ = true;

  var AI_UNAVAILABLE_MSG =
    "Ask a Question is not currently available. Please use the Glossary or Support.";
  var BOT_FNS = [
    "toggleBot",
    "botSend",
    "botAsk",
    "askSug",
    "switchBotTab",
    "clearBotChat",
    "botTabAsk",
    "botTabAsk2",
  ];

  var queue = [];
  var assetsRequested = false;
  var pollTimer = null;

  function aiDisabled() {
    try {
      return w.CASEPATH_AI_DISABLED === true;
    } catch (e) {
      return false;
    }
  }

  function isStub(fn) {
    return typeof fn === "function" && fn.__cpAskStub === true;
  }

  function bundleReady() {
    return typeof w.toggleBot === "function" && !isStub(w.toggleBot);
  }

  function showUnavailableNotice() {
    var html =
      '<strong style="display:block;margin-bottom:0.35rem;">Ask a Question is not currently available</strong>' +
      'Please use the <a href="/glossary.html" style="color:#9a3412;font-weight:700;">Glossary</a> or ' +
      '<a href="/contact.html" style="color:#9a3412;font-weight:700;">Support</a>.';
    var panel = doc.getElementById("cr-bot-panel");
    var msgs = doc.getElementById("cr-bot-messages");
    if (panel && msgs) {
      var trigger = doc.getElementById("cr-bot-trigger");
      panel.style.display = "flex";
      panel.classList.add("open");
      if (trigger) trigger.classList.add("open");
      if (!doc.getElementById("cp-ai-unavailable-msg")) {
        var d = doc.createElement("div");
        d.id = "cp-ai-unavailable-msg";
        d.className = "bot-msg";
        d.innerHTML =
          '<div class="cp-monogram" role="img" aria-label="CasePath">CP</div>' +
          '<div class="bot-msg-bubble" role="alert">' +
          html +
          "</div>";
        msgs.appendChild(d);
      }
      var input = doc.getElementById("cr-bot-input");
      var send = doc.getElementById("cr-bot-send");
      if (input) {
        input.disabled = true;
        input.placeholder = AI_UNAVAILABLE_MSG;
      }
      if (send) send.disabled = true;
      return;
    }
    var qa = doc.getElementById("page-qa");
    if (qa && !doc.getElementById("cp-ai-unavailable-msg")) {
      var n = doc.createElement("div");
      n.id = "cp-ai-unavailable-msg";
      n.setAttribute("role", "alert");
      n.style.cssText =
        "max-width:520px;margin:1rem auto;background:#fff7ed;border:1px solid #f59e0b;" +
        "border-radius:12px;padding:1rem 1.1rem;color:#7c2d12;line-height:1.55;text-align:left;";
      n.innerHTML = html;
      qa.insertBefore(n, qa.firstChild);
      return;
    }
    try {
      w.alert(AI_UNAVAILABLE_MSG);
    } catch (e) {}
  }

  function inject(src) {
    try {
      var s = doc.createElement("script");
      s.src = src;
      s.async = false;
      (doc.body || doc.head || doc.documentElement).appendChild(s);
    } catch (e) {}
  }

  function ensureBotAssets() {
    if (assetsRequested) return;
    assetsRequested = true;
    try {
      if (typeof w.loadBotAssets === "function") {
        w.loadBotAssets();
        return;
      }
    } catch (e) {}
    var v =
      (typeof w.__CASEPATH_ASSET_VERSION__ === "string" && w.__CASEPATH_ASSET_VERSION__.trim()) ||
      "20260607mobile1";
    inject("/assets/js/core/casepath-external-ai-privacy.js?v=" + v);
    inject("/assets/js/assistant/ask-question-response.js?v=" + v);
    inject("/assets/js/assistant/ask-question-guided.js?v=" + v);
    inject("/assets/js/floating-bot.js?v=" + v);
  }

  function flush() {
    while (queue.length) {
      var item = queue.shift();
      var fn = w[item.name];
      if (typeof fn === "function" && !isStub(fn)) {
        try {
          fn.apply(null, item.args);
        } catch (e) {}
      }
    }
  }

  function startPoll() {
    if (pollTimer) return;
    var tries = 0;
    pollTimer = w.setInterval(function () {
      tries += 1;
      if (bundleReady()) {
        w.clearInterval(pollTimer);
        pollTimer = null;
        flush();
        return;
      }
      if (tries > 200) {
        w.clearInterval(pollTimer);
        pollTimer = null;
      }
    }, 100);
  }

  function makeStub(name) {
    function stub() {
      if (aiDisabled()) {
        showUnavailableNotice();
        return;
      }
      var fn = w[name];
      if (typeof fn === "function" && !isStub(fn)) {
        return fn.apply(this, arguments);
      }
      queue.push({ name: name, args: Array.prototype.slice.call(arguments) });
      ensureBotAssets();
      startPoll();
    }
    stub.__cpAskStub = true;
    // Prevent casepath-floating-ask.js from wrapping the stub (would recurse).
    stub.__cpFloatingWrapped = true;
    return stub;
  }

  BOT_FNS.forEach(function (name) {
    if (typeof w[name] !== "function") {
      w[name] = makeStub(name);
    }
  });

  function warm() {
    if (aiDisabled()) return;
    if (doc.getElementById("cr-bot-trigger") || doc.getElementById("page-qa")) {
      ensureBotAssets();
      startPoll();
    }
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", warm, { once: true });
  } else {
    warm();
  }
})(typeof window !== "undefined" ? window : this, typeof document !== "undefined" ? document : null);
