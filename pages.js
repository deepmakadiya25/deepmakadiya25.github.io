/* Site search, tag filters, daily quotation and the page-section tools.
   EDIT: New pages go in PAGES below and in sitemap.xml. Existing content is
   indexed from its HTML automatically; papers and news do not need JS entries.
   Navigation and the mobile sidebar are controlled only by simple.js. */
(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1  WHERE AM I. A blog post lives one folder down, so links and fetched
     files need "../" in front of them there.
     -------------------------------------------------------------------- */
  var ROOT = document.querySelector('main[data-page="404"]') ? "" : (/\/blogs\//.test(location.pathname) ? "../" : "");

  /* -----------------------------------------------------------------------
     2  THE THREE MENUS. Each tool button owns the panel named in its
     aria-controls. Opening one closes the others; Escape or a click outside
     closes whatever is open.
     -------------------------------------------------------------------- */
  // the top bar's round buttons, plus the "js-search" buttons on the pages
  // that have a sidebar
  var toolButtons = document.querySelectorAll(".tb-btn[aria-controls], .js-search[aria-controls]");

  function panelOf(btn) { return document.getElementById(btn.getAttribute("aria-controls")); }

  function setOpen(btn, open) {
    var panel = panelOf(btn);
    if (!panel) return;
    var isSearch = panel.classList.contains("pg-search");
    var returnFocus = panel.contains(document.activeElement);
    if (isSearch && open && panel.hidden) {
      panel.dataset.returnScrollX = String(window.scrollX);
      panel.dataset.returnScrollY = String(window.scrollY);
      btn.classList.remove("search-return-focus");
    }
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    // Search restores focus after simple.js has removed the background's inert
    // state. Focusing a hidden/inert owner here can move the page or fail.
    if (!open && returnFocus && !isSearch) btn.focus({ preventScroll: true });
    if (open) {
      var field = panel.querySelector("input");
      if (field) { field.focus({ preventScroll: true }); field.select(); }
    }
  }

  function closeAll(except) {
    for (var i = 0; i < toolButtons.length; i++) {
      if (toolButtons[i] !== except) setOpen(toolButtons[i], false);
    }
  }

  for (var t = 0; t < toolButtons.length; t++) {
    toolButtons[t].addEventListener("pointerdown", function (e) {
      var panel = panelOf(this);
      // Opening search goes straight to its input. Avoid the browser's
      // intervening focus/scroll to the sticky header button itself.
      if (panel && panel.classList.contains("pg-search") && panel.hidden) e.preventDefault();
    });
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
      // GOTCHA: two buttons share the search panel, so ask the button, not the
      // panel, whether it is open; otherwise the second one is never told.
      if (!panel || toolButtons[i].getAttribute("aria-expanded") !== "true") continue;
      if (toolButtons[i].contains(e.target)) continue;
      // The search panel covers the whole window, so "outside" means outside
      // the box in the middle: the dimmed area closes it, the box does not.
      var box = panel.classList.contains("pg-search") ? panel.querySelector(".pg-search-box") : panel;
      if (box && box.contains(e.target)) continue;
      setOpen(toolButtons[i], false);
    }
  });

  // The search sheet: opened from a button where there is one, and from the
  // "/" key everywhere, including pages with no bar of their own.
  var searchPanel = document.getElementById("searchPanel");
  var searchOwner = document.getElementById("searchButton") ||
                    document.getElementById("searchButtonTop");

  function openSearch() {
    if (!searchPanel) return;
    if (searchOwner) { closeAll(searchOwner); setOpen(searchOwner, true); return; }
    closeAll(null);
    searchPanel.hidden = false;
    var box = searchPanel.querySelector("input");
    if (box) { box.focus(); box.select(); }
  }
  function closeSearch() {
    if (!searchPanel) return;
    if (searchOwner) { setOpen(searchOwner, false); return; }
    searchPanel.hidden = true;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAll(null); closeSearch(); }
    // "/" opens the search, as on most sites
    if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test((e.target.tagName || ""))) {
      e.preventDefault();
      openSearch();
    }
  });

  // on a page with no button of its own, a click on the dimmed area closes it
  if (searchPanel && !searchOwner) {
    searchPanel.addEventListener("click", function (e) {
      var box = searchPanel.querySelector(".pg-search-box");
      if (box && !box.contains(e.target)) searchPanel.hidden = true;
    });
  }

  /* -----------------------------------------------------------------------
     4  SEARCH. There is no index file. The first time the box is used, the
     pages below are fetched and read into memory for the rest of the visit.

     WHAT IT KEEPS. Every block of writing becomes one entry: its page, the
     section and sub-section above it, where it sits in the page, what kind
     of thing it is, and the item it belongs to.

     OWN TEXT. An entry holds only its own words, never those of a block
     inside it. A publication keeps its title, journal and year; its abstract
     becomes a separate entry.

     THE ITEM. Entries inside one list item count as one item, so the words
     may be spread across it: "chevalley tbilisi" finds the talk.

     OTHER NAMES. A heading may carry data-also="..." — other names for the
     same thing, searched but never shown. That is how "contact" finds
     "Get in Touch".

     RULE: to add a page to the search, add a line to PAGES. To add a filter
     chip, add a line to SCOPES.
     -------------------------------------------------------------------- */

  // Every block of writing the search looks at. RULE: the finder at the foot
  // of this file walks the SAME list, so keep the two in step.
  var BLOCKS = "h1, h2, h3, p, li, figcaption, td, dt, dd";
  // ...but never these: the footer repeats on every page, and a menu is
  // furniture, not writing.
  var SKIP = "footer, .pg-foot, .skip-link, nav, script, style, template";

  /* EDIT: Add a new page once here (path from the site root and its name).
     Also add its navigation link copies and a sitemap.xml entry. The rest of
     search, including blog-only filters, is derived from these page files. */
  var PAGES = [
    { file: "index.html",                    name: "Home" },
    { file: "academics.html",                name: "Academics" },
    { file: "research.html",                 name: "Research" },
    { file: "teaching.html",                 name: "Teaching" },
    { file: "professional-activities.html",  name: "Professional Activities" },
    { file: "bio.html",                      name: "Biography" },
    { file: "gallery.html",                  name: "Photo Gallery" },
    { file: "news.html",                     name: "News & Updates" },
    { file: "announcements.html",            name: "Important Announcements" },
    { file: "blogs.html",                    name: "Blogs" },
    { file: "useful-links.html",             name: "Useful Links" },
    { file: "site-guide.html",               name: "Site Guide" },
    { file: "blogs/opportunities-in-higher-mathematics-in-india.html", name: "Opportunities in Higher Mathematics in India" },
    { file: "blogs/about-my-name.html",      name: "About My Name" },
    { file: "blogs/how-i-ended-up-in-mathematics.html", name: "How I Ended Up in Mathematics" },
    { file: "blogs/life-beyond-mathematics.html", name: "Life Beyond Mathematics" }
  ];

  // The pages deep enough to show the sub-section in a result's trail.
  // Everywhere else the trail stops at the section.
  var DEEP = ["academics.html", "research.html", "teaching.html", "professional-activities.html"];

  // A new blog post needs only its PAGES entry; derive the post-only scopes.
  var POSTS = PAGES.filter(function (p) { return p.file.indexOf("blogs/") === 0; })
                   .map(function (p) { return p.file; });

  /* WHICH PAGE IS BEING READ, named as the list above names it. A page that
     is not in the list, such as the 404, leaves this empty, and the
     "Only this page" chip is then left out. */
  var HERE = (function () {
    if (document.querySelector('main[data-page="404"]')) return "";
    var path = location.pathname;
    if (/\/$/.test(path)) path += "index.html";
    for (var i = 0; i < PAGES.length; i++) {
      var f = PAGES[i].file;
      if (path === "/" + f || path.slice(-(f.length + 1)) === "/" + f) return f;
    }
    return "";
  }());

  /* THE FILTER CHIPS, in order. Each one is a place to look: some pages, and
     sometimes one section. "section" is matched against the nearest <h2>
     above the line; "self" means whichever page the reader is on. */
  var SCOPES = [
    { id: "here",   label: "Only this page",           self: true },
    { id: "pubs",   label: "Publications & Preprints", pages: ["research.html"], section: "List of Publications" },
    { id: "teach",  label: "Teaching",                 pages: ["teaching.html"] },
    { id: "talks",  label: "Talks",                    pages: ["professional-activities.html"], section: "Talks" },
    { id: "confs",  label: "Conferences",              pages: ["professional-activities.html"], section: "Conference & Workshop Participation" },
    { id: "news",   label: "News",                     pages: ["news.html"] },
    { id: "blogs",  label: "Blogs",                    pages: ["blogs.html"] },
    { id: "posts",  label: "Content of Blogs",         pages: ["blogs.html"].concat(POSTS) },
    { id: "noblog", label: "Everything but the blog",  not: POSTS }
  ];

  var field = document.getElementById("searchField");
  var results = document.getElementById("searchResults");
  var hint = document.getElementById("searchHint");
  var tagRow = document.getElementById("searchTags");
  var loadPromise = null; // Share the pending request with every search caller.
  var corpus = null;      // filled in on first use
  var groups = null;      // the items, so words can match across one
  var chosen = [];        // the chips currently switched on
  var offline = false;    // opened from a folder: nothing could be read
  var IDLE_HINT = "Type a word or two, or pick a filter.";

  /* ---- ONE SPELLING FOR EVERYTHING ------------------------------------
     Accents are dropped, full stops disappear and other marks become spaces:
     "Poincaré" is stored as "poincare" and "Ph.D." as "phd". Whatever is
     typed is folded the same way, so either spelling finds it. */
  function fold(s) {
    s = (s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/[.'’ʼ`]/g, "")
            .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
            .replace(/\s+/g, " ").trim();
  }
  function hasWord(hay, w) { return (" " + hay + " ").indexOf(" " + w + " ") > -1; }
  function hasPart(hay, w) { return hay.indexOf(w) > -1; }

  /* ---- reading one page into entries ---------------------------------- */
  function contentRoot(doc) { return doc.querySelector("main") || doc.body; }

  function blocksIn(root) {
    var all = root.querySelectorAll(BLOCKS), out = [];
    for (var i = 0; i < all.length; i++) { if (!all[i].closest(SKIP)) out.push(all[i]); }
    return out;
  }

  // everything this block holds, MINUS whatever belongs to a block inside it
  function ownText(el, doc) {
    var copy = el.cloneNode(true);
    var inner = copy.querySelectorAll(BLOCKS);
    for (var i = 0; i < inner.length; i++) { inner[i].parentNode.removeChild(inner[i]); }
    var brs = copy.querySelectorAll("br");
    for (var b = 0; b < brs.length; b++) {
      brs[b].parentNode.replaceChild(doc.createTextNode(" "), brs[b]);
    }
    // Preserve the visual separation between dates, prose and category tags.
    var labels = copy.querySelectorAll(".pg-when, .post-tags, .post-tag");
    for (var n = 0; n < labels.length; n++) {
      labels[n].parentNode.insertBefore(doc.createTextNode(" "), labels[n]);
      labels[n].parentNode.insertBefore(doc.createTextNode(" "), labels[n].nextSibling);
    }
    return (copy.textContent || "").replace(/\s+/g, " ").trim();
  }

  function kindOf(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === "h1") return "title";
    if (tag === "h2") return "section";
    if (tag === "h3" || el.classList.contains("subhead")) return "sub";
    if (tag === "li" || tag === "dd" || tag === "dt" || tag === "td" || tag === "figcaption") return "item";
    return "text";
  }

  function linesOf(html, page) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var root = contentRoot(doc);
    if (!root) return [];
    var nodes = blocksIn(root);
    var out = [], seen = {}, section = "", sub = "";
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], kind = kindOf(el), text = ownText(el, doc);

      // headings set the trail a result shows, even when too short to keep
      if (kind === "section") { section = text; sub = ""; }
      else if (kind === "sub") { sub = text; }

      // a heading is worth keeping however short; ordinary writing is not
      var floor = (kind === "text" || kind === "item") ? 12 : 2;
      if (text.length < floor) continue;
      if (kind !== "title" && seen[text]) continue;
      seen[text] = 1;

      // the other names a heading answers to, searched but never shown
      var also = el.getAttribute("data-also") || "";

      // which item this line belongs to: one list item is searched as a whole
      var holder = el.closest("li, dd, figure, tr");
      var group = i;
      if (holder) {
        var hi = nodes.indexOf(holder);
        if (hi > -1) group = hi;
      }

      out.push({
        page: page, at: i, group: group, kind: kind,
        text: text,
        hay: fold(text + " " + also),
        alias: fold(also),
        section: kind === "title" ? "" : section,
        sub: (kind === "title" || kind === "section") ? "" : sub
      });
    }
    return out;
  }

  function load() {
    if (corpus) return Promise.resolve();
    if (loadPromise) return loadPromise;
    if (hint) hint.textContent = "Reading the site…";
    var jobs = PAGES.map(function (p) {
      return fetch(ROOT + p.file)
        .then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (html) { return html ? linesOf(html, p) : []; })
        .catch(function () { return []; });
    });
    loadPromise = Promise.all(jobs).then(function (all) {
      corpus = [];
      var read = 0;
      for (var i = 0; i < all.length; i++) {
        if (all[i].length) read++;
        corpus = corpus.concat(all[i]);
      }
      // the items: one bag of words per list item, and the entry that heads it
      groups = {};
      for (var e = 0; e < corpus.length; e++) {
        var c = corpus[e], key = c.page.file + "#" + c.group;
        var g = groups[key] || (groups[key] = { hay: "", head: e });
        g.hay += " " + c.hay;
        if (c.at === c.group) g.head = e;
      }
      offline = !read;
      if (hint) {
        // Opened straight from a folder, a browser will not let one local file
        // read another, so say so plainly. On the live site this never shows.
        hint.textContent = read ? IDLE_HINT
          : "Search works on the live site. Opened straight from a folder, the browser will not let one page read another.";
      }
    });
    return loadPromise;
  }

  /* ---- the chips ------------------------------------------------------ */
  function drawChips() {
    if (!tagRow) return;
    var html = "";
    for (var i = 0; i < SCOPES.length; i++) {
      if (SCOPES[i].self && !HERE) continue;   // nothing to narrow to
      var on = chosen.indexOf(SCOPES[i].id) > -1;
      html += '<button type="button" class="pg-tag' + (on ? " on" : "") + '" data-tag="' +
              SCOPES[i].id + '" aria-pressed="' + (on ? "true" : "false") + '">' +
              esc(SCOPES[i].label) + "</button>";
    }
    html += '<button type="button" class="pg-tags-fold" hidden aria-expanded="' + (folded ? "false" : "true") +
            '" aria-label="' + (folded ? "Show all filters" : "Show fewer filters") + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
            'stroke-linejoin="round" focusable="false" aria-hidden="true"><path d="M9.5 5.8 15.7 12l-6.2 6.2"/></svg></button>';
    tagRow.innerHTML = html;
    tagRow.hidden = false;
    fitChips();
  }

  /* ---- folding the chips to one line ----------------------------------
     Folded, the row keeps only the chips that fit on its first line, with
     the round button at the end of it; open, it shows them all. How many fit
     depends on the width of the screen, so it is measured, not counted.
     Folding never switches a chip off. */
  var folded = true;
  function fitChips() {
    if (!tagRow) return;
    var chips = tagRow.querySelectorAll(".pg-tag");
    var btn = tagRow.querySelector(".pg-tags-fold");
    if (!chips.length || !btn) return;
    for (var i = 0; i < chips.length; i++) chips[i].hidden = false;
    btn.hidden = true;
    if (!tagRow.offsetParent) return;          // the sheet is shut: nothing to measure
    var top = chips[0].offsetTop;
    if (chips[chips.length - 1].offsetTop === top) return;   // all on one line already
    var size = chips[0].offsetHeight + "px";
    btn.style.width = size; btn.style.height = size;
    btn.hidden = false;
    btn.setAttribute("aria-expanded", folded ? "false" : "true");
    btn.setAttribute("aria-label", folded ? "Show all filters" : "Show fewer filters");
    btn.title = folded ? "Show all filters" : "Show fewer filters";
    btn.classList.remove("on");
    if (!folded) return;
    for (var j = chips.length - 1; j > 0 && btn.offsetTop !== top; j--) chips[j].hidden = true;
    // a chip that is switched on but folded away lights the button instead
    if (tagRow.querySelector(".pg-tag.on[hidden]")) {
      btn.classList.add("on");
      btn.setAttribute("aria-label", "Show all filters (a hidden filter is switched on)");
      btn.title = "Show all filters (a hidden filter is switched on)";
    }
  }
  if (tagRow) {
    window.addEventListener("resize", fitChips);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitChips);
  }
  // the row opens folded every time: fold it again whenever the sheet shuts
  if (tagRow && searchPanel && window.MutationObserver) {
    new MutationObserver(function () {
      if (searchPanel.hidden) folded = true;
      fitChips();
    }).observe(searchPanel, { attributes: true, attributeFilter: ["hidden"] });
  }

  function scopeById(id) {
    for (var i = 0; i < SCOPES.length; i++) { if (SCOPES[i].id === id) return SCOPES[i]; }
    return null;
  }

  function inScope(entry, scope) {
    if (scope.self) return entry.page.file === HERE;
    if (scope.not && scope.not.indexOf(entry.page.file) > -1) return false;
    if (scope.pages && scope.pages.indexOf(entry.page.file) === -1) return false;
    if (scope.section && entry.section !== scope.section) return false;
    return true;
  }

  // with two chips on, a line only has to fall inside ONE of them
  function inAnyChosen(entry) {
    if (!chosen.length) return true;
    for (var i = 0; i < chosen.length; i++) {
      var s = scopeById(chosen[i]);
      if (s && inScope(entry, s)) return true;
    }
    return false;
  }

  function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  /* ---- how good a match is -------------------------------------------- */
  var WEIGHT = { title: 80, section: 60, sub: 45, item: 8, text: 0 };

  function score(entry, words, across) {
    var s = WEIGHT[entry.kind] || 0;
    for (var i = 0; i < words.length; i++) {
      if (hasWord(entry.hay, words[i])) s += 30;
      else if (hasPart(entry.hay, words[i])) s += 12;
      if (entry.alias && hasPart(entry.alias, words[i])) s += 40;
    }
    if (entry.hay.indexOf(words[0]) === 0) s += 10;   // the line opens with it
    if (across) s -= 25;                              // found across the item
    return s;
  }

  // Match in an accent-free projection, retaining offsets into the original text.
  // Both result snippets and landing highlights use this same matcher.
  function matchText(text, word) {
    var plain = "", starts = [], ends = [];
    for (var i = 0; i < text.length;) {
      var ch = String.fromCodePoint(text.codePointAt(i));
      var clean = ch.normalize ? ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : ch;
      if (!clean && ends.length) ends[ends.length - 1] = i + ch.length;
      for (var j = 0; j < clean.length; j++) { starts.push(i); ends.push(i + ch.length); }
      plain += clean;
      i += ch.length;
    }
    var pattern = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                      .split("").join("[.'’ʼ`]*");
    var re = new RegExp(pattern, "ig"), found, ranges = [];
    while ((found = re.exec(plain))) {
      if (!found[0].length) break;
      ranges.push({ start: starts[found.index], end: ends[found.index + found[0].length - 1] });
    }
    return ranges;
  }

  function mark(text, words) {
    var ranges = [];
    words.forEach(function (word) { ranges = ranges.concat(matchText(text, word)); });
    ranges.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var merged = [];
    ranges.forEach(function (range) {
      var last = merged[merged.length - 1];
      if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
      else merged.push({ start: range.start, end: range.end });
    });
    var out = "", offset = 0;
    merged.forEach(function (range) {
      out += esc(text.slice(offset, range.start)) + "<mark>" + esc(text.slice(range.start, range.end)) + "</mark>";
      offset = range.end;
    });
    return out + esc(text.slice(offset));
  }

  /* ---- and the results themselves ------------------------------------- */
  function run() {
    if (!results || !field) return;
    if (!corpus) { load().then(run); return; }

    var words = fold(field.value).split(" ").filter(function (w) { return w.length > 1; });
    drawChips();

    // nothing typed and no chip: the chips alone
    if (!words.length && !chosen.length) {
      results.innerHTML = "";
      selected = -1;
      if (hint) hint.textContent = IDLE_HINT;
      return;
    }

    var hits = [], took = {}, i, e;

    if (!words.length) {
      // a chip on its own lists what is in it, the list items for preference
      var pool = [], anyItem = false;
      for (i = 0; i < corpus.length; i++) {
        if (!inAnyChosen(corpus[i])) continue;
        pool.push(corpus[i]);
        if (corpus[i].kind === "item") anyItem = true;
      }
      for (i = 0; i < pool.length; i++) {
        if (!anyItem || pool[i].kind === "item") hits.push({ e: pool[i], s: 0, across: false });
      }
    } else {
      // every word in one line...
      for (i = 0; i < corpus.length; i++) {
        e = corpus[i];
        if (!inAnyChosen(e)) continue;
        var all = true;
        for (var w = 0; w < words.length; w++) { if (!hasPart(e.hay, words[w])) { all = false; break; } }
        if (!all) continue;
        took[e.page.file + "#" + e.group] = 1;
        hits.push({ e: e, s: score(e, words, false), across: false });
      }
      // ...or spread across one item
      for (var key in groups) {
        if (took[key]) continue;
        var g = groups[key], head = corpus[g.head];
        if (!head || !inAnyChosen(head)) continue;
        var ok = true;
        for (var v = 0; v < words.length; v++) { if (!hasPart(g.hay, words[v])) { ok = false; break; } }
        if (!ok) continue;
        hits.push({ e: head, s: score(head, words, true), across: true });
      }
      hits.sort(function (a, b) { return b.s - a.s; });
    }

    // With a chip on, everything in it is shown. Without one, at most three
    // lines per page, so a long page cannot fill the list.
    var shown = [], perPage = {};
    var cap = chosen.length ? 400 : 30;
    for (i = 0; i < hits.length; i++) {
      var f = hits[i].e.page.file;
      perPage[f] = (perPage[f] || 0) + 1;
      if (!chosen.length && perPage[f] > 3) continue;
      shown.push(hits[i]);
      if (shown.length >= cap) break;
    }

    if (!shown.length) {
      results.innerHTML = '<li class="pg-none">' +
        (offline ? "Search works on the live site. Opened straight from a folder, the browser will not let one page read another."
         : chosen.length && words.length ? "Nothing under those filters carries all of those words."
         : chosen.length ? "Nothing is filed under that."
         : "Nothing on the site carries all of those words.") + "</li>";
      if (hint) hint.textContent = offline ? "" : IDLE_HINT;
      selected = -1;
      return;
    }

    var html = "";
    for (var r = 0; r < shown.length; r++) {
      e = shown[r].e;
      var line = e.text;
      if (line.length > 190) {
        var at = words.length ? line.toLowerCase().indexOf(words[0]) : 0;
        var from = Math.max(0, at - 70);
        line = (from ? "…" : "") + line.slice(from, from + 185) + "…";
      }
      var trail = esc(e.page.name);
      if (e.section) trail += ' <span class="pg-result-arrow">&rsaquo;</span> ' + esc(e.section);
      if (e.sub && DEEP.indexOf(e.page.file) > -1) {
        trail += ' <span class="pg-result-arrow">&rsaquo;</span> ' + esc(e.sub);
      }

      // ?at= is which block to jump to and ?find= the words; the block at the
      // foot of this file does the jumping.
      var href = ROOT + e.page.file + "?at=" + e.at +
                 (words.length ? "&find=" + encodeURIComponent(words.join(" ")) : "");
      html += '<li><a href="' + href + '">' +
              '<span class="pg-result-where">' + trail + "</span>" +
              '<span class="pg-result-text">' + mark(line, words) + "</span></a></li>";
    }
    results.innerHTML = html;
    selected = -1;

    if (hint) {
      hint.textContent = shown.length < hits.length
        ? "Showing " + shown.length + " of " + hits.length
        : shown.length + (shown.length === 1 ? " result" : " results");
    }
  }

  /* ---- picking a chip -------------------------------------------------- */
  if (tagRow) {
    // A pointer press on the fold arrow must not transfer focus away from the
    // input and dismiss a touch keyboard. Keyboard activation keeps the arrow
    // focusable; other empty areas retain their normal behaviour.
    var keepFieldFocus = false;
    tagRow.addEventListener("pointerdown", function (e) {
      keepFieldFocus = !!e.target.closest(".pg-tags-fold") && document.activeElement === field;
      if (keepFieldFocus) e.preventDefault();
    });
    tagRow.addEventListener("pointercancel", function () { keepFieldFocus = false; });
    tagRow.addEventListener("click", function (e) {
      var fold = e.target.closest(".pg-tags-fold");
      if (fold) {
        e.stopPropagation();
        folded = !folded;
        fitChips();
        if (keepFieldFocus) field.focus({ preventScroll: true });
        keepFieldFocus = false;
        return;
      }
      var btn = e.target.closest(".pg-tag");
      if (!btn) return;
      // GOTCHA: the row is redrawn below, taking this button out of the page.
      // Without this, the sheet would read the click as one outside itself
      // and close.
      e.stopPropagation();
      var id = btn.getAttribute("data-tag");
      var i = chosen.indexOf(id);
      if (i > -1) { chosen.splice(i, 1); } else { chosen.push(id); }
      field.focus({ preventScroll: true });
      run();
    });
  }

  /* ---- the keyboard: down, up, enter ----------------------------------- */
  var selected = -1;
  function movePick(step) {
    var links = results ? results.querySelectorAll("a") : [];
    if (!links.length) return;
    if (selected > -1 && links[selected]) links[selected].classList.remove("is-pick");
    selected += step;
    if (selected < 0) selected = links.length - 1;
    if (selected >= links.length) selected = 0;
    links[selected].classList.add("is-pick");
    links[selected].scrollIntoView({ block: "nearest" });
  }
  if (field) {
    field.addEventListener("input", run);
    field.addEventListener("focus", function () { drawChips(); load().then(run); });
    field.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); movePick(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); movePick(-1); }
      else if (e.key === "Enter") {
        e.preventDefault(); // Open only a result explicitly selected with an arrow key.
        var links = results ? results.querySelectorAll("a") : [];
        var go = selected > -1 ? links[selected] : null;
        if (go) go.click();
      }
    });
  }
  drawChips();

  /* -----------------------------------------------------------------------
     4b  ARRIVING FROM A RESULT. The link carries ?at= (which block) and
     ?find= (the words), so the page scrolls to the line the result showed
     and lights up the words in it.
     -------------------------------------------------------------------- */
  (function () {
    var params = new URLSearchParams(location.search);
    if (!params.has("at")) return;
    var at = parseInt(params.get("at"), 10), find = params.get("find") || "";
    // the SAME list the search counted, or the number would point elsewhere
    var root = contentRoot(document);
    if (!root || at === null || isNaN(at)) return;
    var blocks = blocksIn(root);
    var target = blocks[at];
    if (!target) return;

    var lit = null;
    function land() {
      // Reveal the existing content before trying to scroll to it.
      var abstract = target.closest(".pub-abstract");
      if (abstract && abstract.hidden) {
        var owner = document.querySelector('button[aria-controls="' + abstract.id + '"]');
        if (owner) owner.click();
        else abstract.hidden = false;
      }
      var linkBlock = target.closest(".links-block");
      if (linkBlock && target.closest(".item[hidden]")) {
        var more = linkBlock.querySelector('.links-more[aria-expanded="false"]');
        if (more) more.click();
      }
      var photo = target.closest(".gallery-item");
      if (photo) photo.classList.add("is-active");
      var word = fold(find).split(/\s+/)[0] || "";
      if (word) {
        var walk = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null), node;
        while ((node = walk.nextNode())) {
          if (node.parentElement.closest('mjx-container, script, style, [aria-hidden="true"]')) continue;
          var matches = matchText(node.nodeValue, word), match = matches[0];
          if (!match) continue;
          // Never insert markup into source TeX delimiters.
          var math = /\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g;
          var part, insideMath = false;
          while ((part = math.exec(node.nodeValue))) {
            if (match.start >= part.index && match.start < part.index + part[0].length) insideMath = true;
          }
          if (insideMath) continue;
          var after = node.splitText(match.start);
          after.splitText(match.end - match.start);
          lit = document.createElement("mark");
          lit.className = "find-hit";
          lit.appendChild(after.cloneNode(true));
          after.parentNode.replaceChild(lit, after);
          break;
        }
      }
      window.requestAnimationFrame(function () {
        var to = photo || lit || target;
        var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        to.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
        var focusTarget = photo || target;
        if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
        if (lit) { lit.classList.add("lit"); armTheFade(lit); }
      });
    }
    function readyToLand() {
      var waits = [];
      if (document.fonts) waits.push(document.fonts.ready);
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) waits.push(window.MathJax.startup.promise);
      Promise.all(waits).then(land, land);
    }
    // script.js first creates any More/Less controls needed to reveal the match.
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", readyToLand, { once: true });
    else readyToLand();

    // THE HIGHLIGHT DOES NOT STAY. It goes after six seconds, or at once if
    // the reader clicks, taps or presses a key. It fades first, then the
    // <mark> is replaced by the plain words, so nothing of it is left in the
    // writing.
    function armTheFade(hit) {
      var done = false, timer = null;
      function stopListening() {
        document.removeEventListener("click", clear, true);
        document.removeEventListener("keydown", clear, true);
        document.removeEventListener("touchstart", clear, true);
      }
      function clear() {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        stopListening();
        hit.classList.remove("lit");
        hit.classList.add("gone");
        window.setTimeout(function () {
          var parent = hit.parentNode;
          if (!parent) return;
          parent.replaceChild(document.createTextNode(hit.textContent), hit);
          parent.normalize();          // re-joins the split text either side
        }, 600);
      }
      timer = window.setTimeout(clear, 6000);
      document.addEventListener("click", clear, true);
      document.addEventListener("keydown", clear, true);
      document.addEventListener("touchstart", clear, true);
    }

    // leave the address bar clean, so a reload does not jump again
    if (window.history && history.replaceState) {
      history.replaceState(null, "", location.pathname + location.hash);
    }
  })();

  /* -----------------------------------------------------------------------
     6  QUOTE OF THE DAY (the Noticeboard). quotes.js holds one line for each
     day of the year, keyed "MM-DD". The block stays hidden until a quote is
     in it, so nobody sees an empty frame.
     -------------------------------------------------------------------- */
  var quoteCard = document.getElementById("quoteCard");
  if (quoteCard && window.QUOTES) {
    var now = new Date();
    var two = function (n) { return (n < 10 ? "0" : "") + n; };
    var key = two(now.getMonth() + 1) + "-" + two(now.getDate());
    var today = QUOTES[key];
    if (today) {
      document.getElementById("quoteText").textContent = today.q;
      document.getElementById("quoteWho").textContent = today.who;
      var when = document.getElementById("quoteWhen");
      if (when) {
        when.textContent = now.toLocaleDateString(undefined, { day: "numeric", month: "long" });
      }
      quoteCard.hidden = false;
    }
  }

  /* -----------------------------------------------------------------------
     7  TAG FILTERS (the Blogs, News and Announcements pages). Each button carries
     data-filter with one tag or "all"; each item carries data-cats with its
     own tags, space separated. Adding an item, or a tag, is an HTML edit
     only.
     -------------------------------------------------------------------- */
  // any list whose items carry data-cats: the Blogs posts, the News events and
  // the announcements
  var posts = document.querySelectorAll("li[data-cats]");

  // An item with no tags shown gets them drawn from the very words the filter
  // matches, so the two cannot drift apart. The Blogs page writes its own.
  for (var t = 0; t < posts.length; t++) {
    if (posts[t].querySelector(".post-tags")) continue;
    var words = (posts[t].getAttribute("data-cats") || "").split(/\s+/);
    var strip = document.createElement("span");
    strip.className = "post-tags";
    for (var v = 0; v < words.length; v++) {
      if (!words[v]) continue;
      var chip = document.createElement("span");
      chip.className = "post-tag";
      chip.textContent = words[v].charAt(0).toUpperCase() + words[v].slice(1);
      strip.appendChild(chip);
    }
    if (!strip.childNodes.length) continue;
    var body = posts[t].lastElementChild || posts[t];
    body.appendChild(document.createTextNode(" "));
    body.appendChild(strip);
  }
  // Each row of buttons works on the list items in its OWN section: the row
  // on the News and Blogs pages sits above everything, so it works on the
  // whole page; the one under "Past Announcements" sits inside that section,
  // so it leaves the live announcements above it alone.
  var FOLD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
                 'stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">' +
                 '<path d="M9.5 5.8 15.7 12l-6.2 6.2"/></svg>';
  var filterRows = document.querySelectorAll(".blog-filters");
  var rowFits = [];
  for (var fr = 0; fr < filterRows.length; fr++) {
    (function (row) {
      var scope = row.parentNode;
      var items = scope.querySelectorAll("li[data-cats]");
      var buttons = row.querySelectorAll("[data-filter]");
      if (!buttons.length || !items.length) return;
      // EDIT: data-cats on each item drives these existing counts automatically.
      for (var bc = 0; bc < buttons.length; bc++) {
        var category = buttons[bc].getAttribute("data-filter");
        var count = Array.prototype.filter.call(items, function (item) {
          return category === "all" || (" " + item.getAttribute("data-cats") + " ").indexOf(" " + category + " ") > -1;
        }).length;
        var countLabel = buttons[bc].querySelector(".blog-count");
        if (countLabel) countLabel.textContent = "(" + count + ")";
      }

      function show(cat) {
        for (var i = 0; i < items.length; i++) {
          var cats = " " + (items[i].getAttribute("data-cats") || "") + " ";
          items[i].classList.toggle("filtered-out", !(cat === "all" || cats.indexOf(" " + cat + " ") > -1));
        }
        for (var f = 0; f < buttons.length; f++) {
          var on = buttons[f].getAttribute("data-filter") === cat;
          buttons[f].classList.toggle("active", on);
          buttons[f].setAttribute("aria-pressed", on ? "true" : "false");
        }
        fit();
      }

      /* FOLDING THE ROW. Once the buttons need more than two lines, the row
         keeps only what fits on two, with a round button (›) at the end of the
         second line; open, it shows them all and the button turns to ‹. The
         button is lit when the tag switched on is one of those folded away.
         How many fit is measured, so it follows the width of the screen. */
      var folded = true;
      var fold = document.createElement("button");
      fold.type = "button";
      fold.className = "blog-filters-fold";
      fold.innerHTML = FOLD_SVG;
      fold.hidden = true;
      row.appendChild(fold);

      function fit() {
        var i, tops = [];
        for (i = 0; i < buttons.length; i++) buttons[i].hidden = false;
        fold.hidden = true;
        fold.classList.remove("on");
        if (!row.offsetParent) return;
        for (i = 0; i < buttons.length; i++) {
          if (tops.indexOf(buttons[i].offsetTop) === -1) tops.push(buttons[i].offsetTop);
        }
        if (tops.length <= 2) return;               // two lines or fewer: nothing to fold
        var size = buttons[0].offsetHeight + "px";
        fold.style.width = size; fold.style.height = size;
        fold.hidden = false;
        var label = folded ? "Show all tags" : "Show fewer tags";
        fold.setAttribute("aria-expanded", folded ? "false" : "true");
        if (!folded) { fold.setAttribute("aria-label", label); fold.title = label; return; }
        var second = tops.sort(function (a, b) { return a - b; })[1];
        for (i = buttons.length - 1; i > 0 && fold.offsetTop > second; i--) buttons[i].hidden = true;
        if (row.querySelector("[data-filter].active[hidden]")) {
          fold.classList.add("on");
          label = "Show all tags (the one switched on is folded away)";
        }
        fold.setAttribute("aria-label", label); fold.title = label;
      }

      fold.addEventListener("click", function () { folded = !folded; fit(); });
      for (var fb = 0; fb < buttons.length; fb++) {
        buttons[fb].addEventListener("click", function () { show(this.getAttribute("data-filter")); });
      }
      rowFits.push(fit);
      show("all");
    })(filterRows[fr]);
  }
  if (rowFits.length) {
    var refitRows = function () { for (var r = 0; r < rowFits.length; r++) rowFits[r](); };
    window.addEventListener("resize", refitRows);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitRows);
  }

  /* EDIT: Blog Last Page buttons are optional return controls, not a fixed
     destination. Keep their hidden attributes in the HTML. Show them only
     when a previous page is known and browser Back can return there. */
  (function () {
    var buttons = document.querySelectorAll("button[data-last-page]");
    if (!buttons.length) return;
    var separators = document.querySelectorAll("[data-last-page-separator]");
    var available = false;

    function previousUrl() {
      // Where supported, the navigation history gives the actual preceding
      // entry, including after reload or Back/Forward restoration.
      var navigation = window.navigation;
      if (navigation && navigation.currentEntry && typeof navigation.entries === "function") {
        var entries = navigation.entries();
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].key === navigation.currentEntry.key) {
            if (i === 0) return "";
            if (entries[i - 1].url) return entries[i - 1].url;
            break;
          }
        }
      }
      // With no readable history, use a genuine navigation referrer only.
      // A reload/Back restoration can have a stale referrer, so hide then.
      var timing = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
      if (history.length <= 1 || (timing && timing.type !== "navigate")) return "";
      return document.referrer;
    }

    function pagePath(url) {
      return url.pathname.replace(/index\.html$/, "").replace(/\/$/, "");
    }

    function refreshReturn() {
      available = false;
      try {
        var previous = previousUrl();
        if (previous && history.length > 1) {
          var from = new URL(previous, location.href);
          var home = new URL(ROOT + "index.html", document.baseURI);
          var blogs = new URL(ROOT + "blogs.html", document.baseURI);
          var current = new URL(location.href);
          var excluded = from.origin === home.origin &&
            (pagePath(from) === pagePath(home) || pagePath(from) === pagePath(blogs) || pagePath(from) === pagePath(current));
          available = /^(https?:|file:)$/.test(from.protocol) && !excluded;
        }
      } catch (e) { /* An unavailable or invalid origin simply hides the option. */ }
      for (var i = 0; i < buttons.length; i++) buttons[i].hidden = !available;
      for (var j = 0; j < separators.length; j++) separators[j].hidden = !available;
    }

    for (var i = 0; i < buttons.length; i++) buttons[i].addEventListener("click", function () {
      refreshReturn();
      if (available) history.back();
    });
    window.addEventListener("pageshow", refreshReturn);
    window.addEventListener("popstate", refreshReturn);
    window.addEventListener("hashchange", refreshReturn);
    if (window.navigation) window.navigation.addEventListener("currententrychange", refreshReturn);
    refreshReturn();
  }());

  /* -----------------------------------------------------------------------
     8  PAGE TOOLS (shared by regular pages and blog posts), in <div class="post-tools">
     at the foot of each post. The first returns to the top and appears once
     the reader is 500px down. The second opens the contents: it is an
     ordinary .tb-btn with aria-controls, so block 2 above already opens and
     closes it. This block only builds the list inside, from the piece's own
     headings, and acts on the line picked. A piece with no headings says so
     rather than opening an empty panel.
     -------------------------------------------------------------------- */
  (function () {
    var tools = document.querySelector("[data-post-tools]");
    if (!tools) return;                       // pages without the shared dock

    function scrollBehavior() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    }

    /* ---- back to the top ---- */
    var up = document.getElementById("postTop");
    if (up) {
      var look = function () {
        var visible = window.scrollY > 500;
        up.classList.toggle("is-on", visible);
        if (tools.classList.contains("scroll-tools")) tools.hidden = !visible;
      };
      window.addEventListener("scroll", look, { passive: true });
      look();
      up.addEventListener("click", function () {
        try { window.scrollTo({ top: 0, behavior: scrollBehavior() }); }
        catch (e) { window.scrollTo(0, 0); }  // an older browser: no gliding
        var main = document.getElementById("main");
        if (main) main.focus({ preventScroll: true });
      });
    }

    /* ---- the contents ---- */
    var btn = document.getElementById("postTocBtn");
    var panel = document.getElementById("postTocPanel");
    var body = document.querySelector(".post-body") || document.querySelector("main");
    if (!btn || !panel) return;

    var list = panel.querySelector(".post-toc-list");
    var isPost = body && body.classList.contains("post-body");
    // The regular-page menu follows its visible title automatically.
    // Home uses its navigation name; individual pieces retain "Contents".
    if (!isPost) {
      var label = panel.querySelector(".theme-picker-label");
      var title = document.querySelector("main h1");
      if (label && title) {
        label.textContent = document.querySelector(".home-main") ? "Home" : title.textContent.trim();
        label.classList.add("post-toc-title");
      }
    }
    var heads = body ? body.querySelectorAll("h2, h3") : [];

    if (!heads.length) {
      if (list) list.parentNode.removeChild(list);
      var none = document.createElement("p");
      none.className = "post-toc-none";
      none.textContent = body && body.classList.contains("post-body") ? "This piece has no sections yet." : "This page has no separate sections.";
      panel.appendChild(none);
      return;
    }

    var tocEntries = [];
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i], text = (h.textContent || "").trim();
      if (!h.id) {
        var slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "part";
        while (document.getElementById(slug)) { slug += "-x"; }
        h.id = slug;
      }
      // Preserve subsection IDs for existing links, but list only main
      // sections on regular pages. Blog contents retain both levels.
      if (!isPost && h.tagName !== "H2") continue;
      var li = document.createElement("li");
      if (h.tagName === "H3") li.className = "is-sub";
      var a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = text;
      li.appendChild(a);
      list.appendChild(li);
      tocEntries.push({ heading: h, link: a });
    }

    // Mark the section at the reading position without changing the address.
    // Regular pages track main headings; blog posts also track subsections.
    function markCurrentSection() {
      if (!tocEntries.length) return;
      var bar = document.querySelector("header.tb");
      var readingLine = (bar ? bar.getBoundingClientRect().bottom : 0) + 24;
      var visible = tocEntries.filter(function (entry) { return entry.heading.getClientRects().length; });
      if (!visible.length) return;
      var current = visible[0];
      for (var j = 0; j < visible.length; j++) {
        if (visible[j].heading.getBoundingClientRect().top <= readingLine) current = visible[j];
      }
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = visible[visible.length - 1];
      tocEntries.forEach(function (entry) {
        if (entry === current) entry.link.setAttribute("aria-current", "location");
        else entry.link.removeAttribute("aria-current");
      });
    }
    var tocFrame = 0;
    function scheduleCurrentSection() {
      if (tocFrame) return;
      tocFrame = requestAnimationFrame(function () { tocFrame = 0; markCurrentSection(); });
    }
    window.addEventListener("scroll", scheduleCurrentSection, { passive: true });
    window.addEventListener("resize", scheduleCurrentSection);
    if (window.ResizeObserver && body) new ResizeObserver(scheduleCurrentSection).observe(body);
    if (document.fonts) document.fonts.ready.then(scheduleCurrentSection);
    markCurrentSection();

    // picking a line closes the panel and goes to that heading
    list.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      e.preventDefault();
      var target = document.getElementById(a.getAttribute("href").slice(1));
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (!target) return;
      try { target.scrollIntoView({ behavior: scrollBehavior(), block: "start" }); }
      catch (e2) { target.scrollIntoView(); }
      // the address now points at that section, so the reader can copy a link
      // Keep the missing URL on 404 pages, whose <base> points at the root.
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + a.getAttribute("href"));
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }());

})();
