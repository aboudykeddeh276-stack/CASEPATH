/**

 * Desktop category dropdowns (Learn / Prepare / Your Case) + mobile flyout support.

 */

(function () {

  "use strict";



  var DROPDOWNS = [

    { toggle: "nav-howitworks-toggle", menu: "nav-howitworks-menu" },

    { toggle: "nav-learn-toggle", menu: "nav-learn-menu" },

    { toggle: "nav-prepare-toggle", menu: "nav-prepare-menu" },

    { toggle: "nav-yourcase-toggle", menu: "nav-yourcase-menu" },

  ];



  function wireDesktopDropdowns() {

    var mq = window.matchMedia("(min-width: 1025px)");

    var openMenu = null;



    function closeAll() {

      DROPDOWNS.forEach(function (cfg) {

        var toggle = document.getElementById(cfg.toggle);

        var menu = document.getElementById(cfg.menu);

        if (!toggle || !menu) return;

        toggle.setAttribute("aria-expanded", "false");

        menu.hidden = true;

      });

      openMenu = null;

    }



    function open(cfg) {

      closeAll();

      var toggle = document.getElementById(cfg.toggle);

      var menu = document.getElementById(cfg.menu);

      if (!toggle || !menu) return;

      toggle.setAttribute("aria-expanded", "true");

      menu.hidden = false;

      openMenu = cfg;

    }



    DROPDOWNS.forEach(function (cfg) {

      var toggle = document.getElementById(cfg.toggle);

      var menu = document.getElementById(cfg.menu);

      if (!toggle || !menu) return;



      toggle.addEventListener("click", function (e) {

        if (!mq.matches) return;

        e.preventDefault();

        e.stopPropagation();

        if (openMenu === cfg) closeAll();

        else open(cfg);

      });



      menu.querySelectorAll("a").forEach(function (link) {

        link.addEventListener("click", function () {

          closeAll();

        });

      });

    });



    document.addEventListener("click", function (e) {

      if (!mq.matches || !openMenu) return;

      var toggle = document.getElementById(openMenu.toggle);

      var menu = document.getElementById(openMenu.menu);

      if (toggle && menu && !toggle.contains(e.target) && !menu.contains(e.target)) {

        closeAll();

      }

    });



    document.addEventListener("keydown", function (e) {

      if (e.key === "Escape") closeAll();

    });



    mq.addEventListener("change", function () {

      closeAll();

    });

  }



  function wireMobileFlyout() {
    if (window.__CASEPATH_MOBILE_NAV_WIRED__) return;
    window.__CASEPATH_MOBILE_NAV_WIRED__ = true;

    var mq = window.matchMedia("(max-width: 1025px)");

    var btn = document.getElementById("nav-mobile-toggle");

    var wrap = document.querySelector(".nav-site-links");

    var menu = document.getElementById("nav-main-grid");

    if (!btn || !wrap || !menu) return;



    var scrim = document.getElementById("nav-mobile-scrim");

    if (!scrim) {

      scrim = document.createElement("div");

      scrim.id = "nav-mobile-scrim";

      scrim.className = "nav-mobile-scrim";

      scrim.setAttribute("aria-hidden", "true");

      document.body.appendChild(scrim);

    }



    function syncDropdownTop() {

      var hdr = document.querySelector("header.header");

      var y = hdr ? hdr.getBoundingClientRect().bottom : 100;

      document.documentElement.style.setProperty("--mobile-nav-dropdown-top", y + "px");

    }



    function closeMenu() {

      wrap.classList.remove("nav-mobile-open");

      document.body.classList.remove("nav-mobile-menu-open");

      btn.setAttribute("aria-expanded", "false");

    }



    function openMenu() {

      syncDropdownTop();

      wrap.classList.add("nav-mobile-open");

      document.body.classList.add("nav-mobile-menu-open");

      btn.setAttribute("aria-expanded", "true");

    }



    scrim.addEventListener("click", function () {

      if (mq.matches) closeMenu();

    });



    btn.addEventListener("click", function (e) {

      e.preventDefault();

      e.stopPropagation();

      if (!mq.matches) return;

      if (wrap.classList.contains("nav-mobile-open")) closeMenu();

      else openMenu();

    });



    document.addEventListener("click", function (e) {

      if (!mq.matches || !wrap.classList.contains("nav-mobile-open")) return;

      if (!wrap.contains(e.target)) closeMenu();

    });



    menu.querySelectorAll("a").forEach(function (a) {

      a.addEventListener("click", function () {

        if (mq.matches) closeMenu();

      });

    });



    document.addEventListener("keydown", function (e) {

      if (e.key === "Escape") closeMenu();

    });



    window.addEventListener(

      "resize",

      function () {

        if (!mq.matches) closeMenu();

        else if (wrap.classList.contains("nav-mobile-open")) syncDropdownTop();

      },

      { passive: true }

    );



    mq.addEventListener("change", function () {

      if (!mq.matches) closeMenu();

    });

  }



  function boot() {

    wireDesktopDropdowns();

    wireMobileFlyout();

  }



  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", boot);

  } else {

    boot();

  }

})();

