(function () {
  "use strict";

  var syncing = false;

  function syncGroup(source) {
    if (!source || !source.hasAttribute("data-mh-sync-group") || syncing) return;
    var group = source.getAttribute("data-mh-sync-group");
    if (!group) return;
    var peers = document.querySelectorAll('details[data-mh-sync-group="' + group + '"]');
    if (peers.length < 2) return;

    syncing = true;
    peers.forEach(function (panel) {
      if (panel !== source) panel.open = source.open;
    });
    syncing = false;
  }

  document.addEventListener(
    "toggle",
    function (event) {
      if (event.target && event.target.tagName === "DETAILS") {
        syncGroup(event.target);
      }
    },
    true
  );
})();
