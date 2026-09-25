/* =========================================================================
   Deep H. Makadiya — behaviour of the SECOND SET of pages
   (Noticeboard, Bio, Photos, News & Updates, Blogs and every blog post).

   These pages also load script.js, which already carries the colour,
   typeface and light/dark pickers and the "last updated" line. This file
   adds only what the top bar needs:

     1  WHERE AM I           works out the path back to the site root
     2  THE THREE MENUS      links, appearance, search — one open at a time
     3  THE PAGE MENU        the five links on a phone
     4  SEARCH               reads the other pages and looks through them
     5  BLOG FILTERS         the category buttons on the Blogs page

   Nothing here needs editing when a page gains content. The one list to
   keep in step is PAGES, at the top of the search block: it names the pages
   the search reads.
   ========================================================================= */
(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1  WHERE AM I. A blog post lives one folder down, so every link and
     every file the search fetches needs "../" in front of it there.
     -------------------------------------------------------------------- */
  var ROOT = /\/blogs\//.test(location.pathname) ? "../" : "";

  /* -----------------------------------------------------------------------
     2  THE THREE MENUS. Each tool button owns the panel named in its
     aria-controls. Opening one closes the others; Escape and a click
     outside close whatever is open.
     -------------------------------------------------------------------- */
  // The three round buttons in the second set's top bar — and, on the pages
  // with a sidebar, the two search buttons, which carry "js-search".
  var toolButtons = document.querySelectorAll(".tb-btn[aria-controls], .js-search[aria-controls]");

  function panelOf(btn) { return document.getElementById(btn.getAttribute("aria-controls")); }

  function setOpen(btn, open) {
    var panel = panelOf(btn);
    if (!panel) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    if (open) {
      var field = panel.querySelector("input");
      if (field) { field.focus(); field.select(); }
    }
  }

  function closeAll(except) {
    for (var i = 0; i < toolButtons.length; i++) {
      if (toolButtons[i] !== except) setOpen(toolButtons[i], false);
    }
  }

  for (var t = 0; t < toolButtons.length; t++) {
    toolButtons[t].addEventListener("click", function (e) {
      e.stopPropagation();
      var open = this.getAttribute("aria-expanded") !== "true";
      closeAll(this);
      setOpen(this, open);
    });
  }

  document.addEventListener("click", function (e) {
    for (var i = 0; i < toolButtons.length; i++) {
      var panel = panelOf(toolButtons[i]);
      if (!panel || panel.hidden) continue;
      if (toolButtons[i].contains(e.target)) continue;
      // The search panel is a sheet across the whole window, so "outside it"
      // means outside the white box in the middle rather than outside the
      // panel: a click on the dimmed area around the box closes it, a click
      // inside the box does not.
      var box = panel.classList.contains("pg-search") ? panel.querySelector(".pg-search-box") : panel;
      if (box && box.contains(e.target)) continue;
      setOpen(toolButtons[i], false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAll(null); closeMenu(); }
    // "/" anywhere on the page opens the search, the way most sites do
    if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test((e.target.tagName || ""))) {
      var sb = document.getElementById("searchButton");
      if (sb) { e.preventDefault(); closeAll(sb); setOpen(sb, true); }
    }
  });

  /* -----------------------------------------------------------------------
     3  THE PAGE MENU. On a phone the five page links are hidden until the
     menu button is pressed.
     -------------------------------------------------------------------- */
  var menuButton = document.getElementById("pageMenuButton");
  var pageNav = document.getElementById("pageNav");

  function closeMenu() {
    if (menuButton && pageNav) { pageNav.classList.remove("open"); menuButton.setAttribute("aria-expanded", "false"); }
  }
  if (menuButton && pageNav) {
    menuButton.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !pageNav.classList.contains("open");
      pageNav.classList.toggle("open", open);
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* -----------------------------------------------------------------------
     4  SEARCH. There is no index file to keep up to date: the first time
     the box is used, the pages below are fetched, stripped of their markup
     and kept in memory for the rest of the visit. Every word typed must
     appear somewhere in a paragraph for it to be shown.

     TO ADD A PAGE TO THE SEARCH, add one line here.
     -------------------------------------------------------------------- */
  var PAGES = [
    { file: "index.html",                    name: "Home" },
    { file: "academics.html",                name: "Academics" },
    { file: "research.html",                 name: "Research" },
    { file: "teaching.html",                 name: "Teaching" },
    { file: "professional-activities.html",  name: "Professional Activities" },
    { file: "noticeboard.html",                name: "Noticeboard" },
    { file: "bio.html",                      name: "Biography" },
    { file: "gallery.html",                  name: "Photos" },
    { file: "news.html",                     name: "News & Updates" },
    { file: "blogs.html",                    name: "Blogs" },
    { file: "useful-links.html",             name: "Useful Links" },
    { file: "announcements.html",            name: "Important Announcements" },
    { file: "navigation.html",               name: "Site Map" },
    { file: "blogs/opportunities-in-higher-mathematics-in-india.html", name: "Blog — Opportunities in Higher Mathematics in India" },
    { file: "blogs/about-my-name.html",      name: "Blog — About My Name" },
    { file: "blogs/how-i-ended-up-in-mathematics.html", name: "Blog — How I Ended Up in Mathematics" },
    { file: "blogs/life-beyond-mathematics.html", name: "Blog — Life Beyond Mathematics" }
  ];

  var field = document.getElementById("searchField");
  var results = document.getElementById("searchResults");
  var hint = document.getElementById("searchHint");
  var corpus = null;      // filled in on first use
  var loading = false;

  function textOf(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var main = doc.querySelector("main") || doc.body;
    if (!main) return [];
    var bits = [];
    var nodes = main.querySelectorAll("h1, h2, h3, p, li, figcaption, td");
    for (var i = 0; i < nodes.length; i++) {
      var s = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (s.length > 12 && bits.indexOf(s) === -1) bits.push(s);
    }
    return bits;
  }

  function load() {
    if (corpus || loading) return Promise.resolve();
    loading = true;
    if (hint) hint.textContent = "Reading the site…";
    var jobs = PAGES.map(function (p) {
      return fetch(ROOT + p.file)
        .then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (html) { return { page: p, bits: html ? textOf(html) : [] }; })
        .catch(function () { return { page: p, bits: [] }; });
    });
    return Promise.all(jobs).then(function (all) {
      corpus = all;
      loading = false;
      var read = 0;
      for (var i = 0; i < all.length; i++) { if (all[i].bits.length) read++; }
      if (hint) {
        // Opened straight from a folder, a browser refuses to let one local
        // file read another, so there is nothing to search. Say so plainly
        // rather than looking broken; on the live site this never shows.
        hint.textContent = read
          ? "Type a word or two. Every page of the site is searched."
          : "Search works on the live site. Opened straight from a folder, the browser will not let one page read another.";
      }
    });
  }

  function mark(text, words) {
    var out = text;
    for (var i = 0; i < words.length; i++) {
      var safe = words[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp("(" + safe + ")", "ig"), "\u0001$1\u0002");
    }
    var esc = document.createElement("div");
    esc.textContent = out;
    return esc.innerHTML.replace(/\u0001/g, "<mark>").replace(/\u0002/g, "</mark>");
  }

  function run() {
    if (!results) return;
    var q = (field.value || "").trim().toLowerCase();
    results.innerHTML = "";
    if (q.length < 2) { return; }
    if (!corpus) { load().then(run); return; }

    var words = q.split(/\s+/);
    var hits = [];
    for (var i = 0; i < corpus.length; i++) {
      var entry = corpus[i];
      for (var j = 0; j < entry.bits.length; j++) {
        var line = entry.bits[j], low = line.toLowerCase(), all = true;
        for (var w = 0; w < words.length; w++) { if (low.indexOf(words[w]) === -1) { all = false; break; } }
        if (all) {
          hits.push({ page: entry.page, line: line });
          break;                       // at most two lines from one page
        }
      }
      // a second line from the same page, if there is one
      var second = 0;
      for (var k = 0; k < entry.bits.length && second < 1; k++) {
        var l2 = entry.bits[k], lo2 = l2.toLowerCase(), ok = true;
        for (var w2 = 0; w2 < words.length; w2++) { if (lo2.indexOf(words[w2]) === -1) { ok = false; break; } }
        if (ok && (!hits.length || hits[hits.length - 1].line !== l2)) {
          if (hits.length && hits[hits.length - 1].page === entry.page) { hits.push({ page: entry.page, line: l2 }); second++; }
        }
      }
    }

    if (!hits.length) {
      results.innerHTML = '<li><a href="#" aria-disabled="true"><span class="pg-result-where">Nothing found</span>' +
        '<span class="pg-result-text">No page carries all of those words.</span></a></li>';
      return;
    }

    var html = "";
    for (var h = 0; h < hits.length && h < 24; h++) {
      var line = hits[h].line;
      if (line.length > 190) {
        var at = line.toLowerCase().indexOf(words[0]);
        var from = Math.max(0, at - 70);
        line = (from ? "…" : "") + line.slice(from, from + 185) + "…";
      }
      html += '<li><a href="' + ROOT + hits[h].page.file + '">' +
              '<span class="pg-result-where">' + hits[h].page.name + "</span>" +
              '<span class="pg-result-text">' + mark(line, words) + "</span></a></li>";
    }
    results.innerHTML = html;
  }

  if (field) {
    field.addEventListener("input", run);
    field.addEventListener("focus", load);
  }

  /* -----------------------------------------------------------------------
     5  BLOG FILTERS. Each button carries data-filter with a category, or
     "all". Each post carries data-cats with its categories, space
     separated. Adding a post or a category is an HTML edit only.
     -------------------------------------------------------------------- */
  var filters = document.querySelectorAll("[data-filter]");
  var posts = document.querySelectorAll(".post-list li[data-cats]");
  if (filters.length && posts.length) {
    var show = function (cat) {
      for (var i = 0; i < posts.length; i++) {
        var cats = " " + (posts[i].getAttribute("data-cats") || "") + " ";
        posts[i].hidden = !(cat === "all" || cats.indexOf(" " + cat + " ") > -1);
      }
      for (var f = 0; f < filters.length; f++) {
        var on = filters[f].getAttribute("data-filter") === cat;
        filters[f].classList.toggle("active", on);
        filters[f].setAttribute("aria-pressed", on ? "true" : "false");
      }
    };
    for (var fb = 0; fb < filters.length; fb++) {
      filters[fb].addEventListener("click", function () { show(this.getAttribute("data-filter")); });
    }
    show("all");
  }
})();
