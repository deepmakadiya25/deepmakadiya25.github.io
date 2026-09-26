/* =========================================================================
   Deep H. Makadiya — behaviour of the SECOND SET of pages
   (Noticeboard, Bio, Photos, News & Updates, Blogs and every blog post).

   These pages also load script.js, which already carries the colour,
   typeface and light/dark pickers and the "last updated" line. This file
   adds only what the top bar needs:

     1  WHERE AM I           works out the path back to the site root
     2  THE THREE MENUS      links, appearance, search — one open at a time
     3  THE PAGE MENU        the six links on a phone
     4  SEARCH               reads the other pages, tags what it finds, and
                          jumps back to the exact line you picked
     5  THE PAGE NAME        it fills the phone bar as the title scrolls away
     6  QUOTE OF THE DAY     the Noticeboard's line for today, from quotes.js
     7  TAG FILTERS          the tag buttons on the Blogs and News pages

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
  // The round buttons in the second set's top bar — and, on the pages
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

  // The search sheet, opened from a button where there is one and from the
  // "/" key everywhere — including the pages that carry no bar of their own.
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
    if (e.key === "Escape") { closeAll(null); closeSearch(); closeMenu(); }
    // "/" anywhere on the page opens the search, the way most sites do
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
     3  THE PAGE MENU. On a phone the six page links are hidden until the
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
     4  SEARCH. There is no index file to keep up to date: the first time the
     box is used, the pages below are fetched and read into memory for the
     rest of the visit.

     Every line the search keeps knows four things: which page it came from,
     which section and sub-section it sits under, where it sits in the page
     (so a result can jump back to the exact line), and a handful of TAGS.

     TAGS come from three places, and nothing needs editing here for them:
       - the page itself, from the list below;
       - the nearest <section data-tags="..."> around the line, in the page's
         own HTML — that is where publication, talk, news and the rest come
         from, and adding one to a new section is enough;
       - what kind of line it is: a page title, a heading, or plain text.

     TO ADD A PAGE TO THE SEARCH, add one line to PAGES.
     -------------------------------------------------------------------- */

  // Every block of text the search looks at. The finder at the end of this
  // block walks the SAME list, so a result's position is a position both
  // sides agree on. Keep the two in step.
  var BLOCKS = "h1, h2, h3, p, li, figcaption, td, dt, dd";

  var PAGES = [
    { file: "index.html",                    name: "Home",                     tags: ["home"] },
    { file: "academics.html",                name: "Academics",                tags: ["academics"] },
    { file: "research.html",                 name: "Research",                 tags: ["research"] },
    { file: "teaching.html",                 name: "Teaching",                 tags: ["teaching"] },
    { file: "professional-activities.html",  name: "Professional Activities",  tags: ["professional"] },
    { file: "noticeboard.html",              name: "Noticeboard",              tags: ["noticeboard"] },
    { file: "bio.html",                      name: "Biography",                tags: ["biography"] },
    { file: "gallery.html",                  name: "Photos",                   tags: ["photo"] },
    { file: "news.html",                     name: "News & Updates",           tags: ["news"] },
    { file: "announcements.html",            name: "Important Announcements",  tags: ["announcement"] },
    { file: "blogs.html",                    name: "Blogs",                    tags: ["blog"] },
    { file: "useful-links.html",             name: "Useful Links",             tags: ["link"] },
    { file: "navigation.html",               name: "Site Map",                 tags: ["site map"] },
    { file: "blogs/opportunities-in-higher-mathematics-in-india.html", name: "Opportunities in Higher Mathematics in India", tags: ["blog"] },
    { file: "blogs/about-my-name.html",      name: "About My Name",            tags: ["blog"] },
    { file: "blogs/how-i-ended-up-in-mathematics.html", name: "How I Ended Up in Mathematics", tags: ["blog"] },
    { file: "blogs/life-beyond-mathematics.html", name: "Life Beyond Mathematics", tags: ["blog"] }
  ];

  var field = document.getElementById("searchField");
  var results = document.getElementById("searchResults");
  var hint = document.getElementById("searchHint");
  var tagRow = document.getElementById("searchTags");
  var corpus = null;      // filled in on first use
  var loading = false;
  var chosen = [];        // the tags currently switched on

  /* ---- reading one page into lines ---------------------------------- */
  function linesOf(html, page) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var main = doc.querySelector("main") || doc.body;
    if (!main) return [];
    var nodes = main.querySelectorAll(BLOCKS);
    var out = [], seen = {}, section = "", sub = "";
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var tag = el.tagName.toLowerCase();

      // a line break is a space once the markup is gone, or the words on
      // either side of it run together in the result
      var copy = el.cloneNode(true), brs = copy.querySelectorAll("br");
      for (var r = 0; r < brs.length; r++) {
        brs[r].parentNode.replaceChild(doc.createTextNode(" "), brs[r]);
      }
      var text = (copy.textContent || "").replace(/\s+/g, " ").trim();

      // headings set the trail the results show: Page > Section > Sub-section
      if (tag === "h2") { section = text; sub = ""; }
      else if (tag === "h3") { sub = text; }
      else if (el.classList.contains("subhead")) { sub = text; }

      // a list item holding paragraphs is only their container: taking both
      // would list the same passage twice, once for the item and once for the
      // paragraph inside it. The innermost block is the one that is kept.
      if (el.querySelector(BLOCKS)) continue;
      if (text.length < 12 || seen[text]) continue;
      seen[text] = 1;

      // the tags on the nearest section around this line
      var kinds = page.tags.slice();
      var holder = el.closest("[data-tags]");
      if (holder) {
        var extra = holder.getAttribute("data-tags").split(/\s*,\s*/);
        for (var k = 0; k < extra.length; k++) {
          if (extra[k] && kinds.indexOf(extra[k]) === -1) kinds.push(extra[k]);
        }
      }
      kinds.push(tag === "h1" ? "page" : (tag === "h2" || tag === "h3") ? "section" : "text");

      out.push({
        page: page, text: text, at: i,
        section: tag === "h1" ? "" : section,
        sub: (tag === "h2" || tag === "h1") ? "" : sub,
        tags: kinds
      });
    }
    return out;
  }

  function load() {
    if (corpus || loading) return Promise.resolve();
    loading = true;
    if (hint) hint.textContent = "Reading the site…";
    var jobs = PAGES.map(function (p) {
      return fetch(ROOT + p.file)
        .then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (html) { return html ? linesOf(html, p) : []; })
        .catch(function () { return []; });
    });
    return Promise.all(jobs).then(function (all) {
      corpus = [];
      var read = 0;
      for (var i = 0; i < all.length; i++) {
        if (all[i].length) read++;
        corpus = corpus.concat(all[i]);
      }
      loading = false;
      if (hint) {
        // Opened straight from a folder, a browser refuses to let one local
        // file read another, so there is nothing to search. Say so plainly
        // rather than looking broken; on the live site this never shows.
        hint.textContent = read
          ? "Type a word or two. Press # to pick a tag."
          : "Search works on the live site. Opened straight from a folder, the browser will not let one page read another.";
      }
    });
  }

  /* ---- the words typed, and the tag being typed after a # ------------ */
  function parse() {
    var raw = (field.value || "");
    var hashAt = raw.lastIndexOf("#");
    var hashWord = null;
    if (hashAt > -1 && !/\s/.test(raw.slice(hashAt + 1))) {
      hashWord = raw.slice(hashAt + 1).toLowerCase();
      raw = raw.slice(0, hashAt);
    }
    var words = raw.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
    return { words: words, hashWord: hashWord };
  }

  function carries(entry, tags) {
    for (var i = 0; i < tags.length; i++) {
      if (entry.tags.indexOf(tags[i]) > -1) return true;   // any one is enough
    }
    return false;
  }

  function matches(entry, words) {
    var low = entry.text.toLowerCase();
    for (var w = 0; w < words.length; w++) { if (low.indexOf(words[w]) === -1) return false; }
    return true;
  }

  /* ---- the row of tags under the box --------------------------------- */
  function drawTags(pool, hashWord) {
    if (!tagRow) return;
    var count = {};
    for (var i = 0; i < pool.length; i++) {
      for (var t = 0; t < pool[i].tags.length; t++) {
        count[pool[i].tags[t]] = (count[pool[i].tags[t]] || 0) + 1;
      }
    }
    var names = Object.keys(count);
    // the tags already chosen stay on the row even when nothing matches
    for (var c = 0; c < chosen.length; c++) { if (names.indexOf(chosen[c]) === -1) names.push(chosen[c]); }
    if (hashWord) {
      names = names.filter(function (n) { return n.indexOf(hashWord) > -1; });
    }
    // "text", "section" and "page" sit on nearly every line, so they are of
    // little use as a filter: they go to the end of the row rather than the
    // front, where the tags that say what a thing IS belong.
    var PLAIN = ["text", "section", "page"];
    names.sort(function (a, b) {
      var an = chosen.indexOf(a) > -1, bn = chosen.indexOf(b) > -1;
      if (an !== bn) return an ? -1 : 1;                    // chosen ones first
      var ap = PLAIN.indexOf(a) > -1, bp = PLAIN.indexOf(b) > -1;
      if (ap !== bp) return ap ? 1 : -1;
      if ((count[b] || 0) !== (count[a] || 0)) return (count[b] || 0) - (count[a] || 0);
      return a < b ? -1 : 1;
    });
    if (!hashWord) names = names.slice(0, 12);

    var html = "";
    for (var n = 0; n < names.length; n++) {
      var on = chosen.indexOf(names[n]) > -1;
      html += '<button type="button" class="pg-tag' + (on ? " on" : "") + '" data-tag="' +
              esc(names[n]) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
              esc(names[n]) + "</button>";
    }
    tagRow.innerHTML = html;
    tagRow.hidden = !html;
  }

  function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

  function mark(text, words) {
    var out = text;
    for (var i = 0; i < words.length; i++) {
      var safe = words[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp("(" + safe + ")", "ig"), "\u0001$1\u0002");
    }
    return esc(out).replace(/\u0001/g, "<mark>").replace(/\u0002/g, "</mark>");
  }

  /* ---- and the results themselves ------------------------------------ */
  function run() {
    if (!results || !field) return;
    if (!corpus) { load().then(run); return; }

    var q = parse();
    // with nothing typed and no tag chosen, offer the tags and stop there
    if (!q.words.length && !chosen.length && q.hashWord === null) {
      results.innerHTML = "";
      drawTags(corpus, null);
      return;
    }

    var hits = [];
    for (var i = 0; i < corpus.length; i++) {
      var e = corpus[i];
      if (chosen.length && !carries(e, chosen)) continue;
      if (q.words.length && !matches(e, q.words)) continue;
      hits.push(e);
    }
    drawTags(hits.length || chosen.length ? hits : corpus, q.hashWord);

    // at most three lines from any one page, so one long page cannot fill it
    var perPage = {}, shown = [];
    for (var h = 0; h < hits.length; h++) {
      var f = hits[h].page.file;
      perPage[f] = (perPage[f] || 0) + 1;
      if (perPage[f] <= 3) shown.push(hits[h]);
      if (shown.length >= 30) break;
    }

    if (!shown.length) {
      results.innerHTML = '<li class="pg-none">' +
        (chosen.length && q.words.length ? "Nothing under those tags carries all of those words."
         : chosen.length ? "Nothing is filed under that."
         : "No page carries all of those words.") + "</li>";
      return;
    }

    var html = "";
    for (var r = 0; r < shown.length; r++) {
      var e = shown[r], line = e.text;
      if (line.length > 190) {
        var at = q.words.length ? line.toLowerCase().indexOf(q.words[0]) : 0;
        var from = Math.max(0, at - 70);
        line = (from ? "…" : "") + line.slice(from, from + 185) + "…";
      }
      var trail = e.page.name;
      if (e.section) trail += ' <span class="pg-result-arrow">&rsaquo;</span> ' + esc(e.section);
      if (e.sub) trail += ' <span class="pg-result-arrow">&rsaquo;</span> ' + esc(e.sub);

      // ?find= is the line to jump to, ?at= where it sits; the block at the
      // foot of this file does the jumping when the page opens.
      var href = ROOT + e.page.file + "?at=" + e.at +
                 (q.words.length ? "&find=" + encodeURIComponent(q.words.join(" ")) : "");
      html += '<li><a href="' + href + '">' +
              '<span class="pg-result-where">' + trail + "</span>" +
              '<span class="pg-result-text">' + mark(line, q.words) + "</span></a></li>";
    }
    results.innerHTML = html;
  }

  if (tagRow) {
    tagRow.addEventListener("click", function (e) {
      var btn = e.target.closest(".pg-tag");
      if (!btn) return;
      // the row is drawn again below, which takes this button out of the page.
      // Without this line the click would then look to the sheet like a click
      // outside itself, and the sheet would close.
      e.stopPropagation();
      var name = btn.getAttribute("data-tag");
      var i = chosen.indexOf(name);
      if (i > -1) { chosen.splice(i, 1); } else { chosen.push(name); }
      // picking a tag while typing #… clears the half-typed tag name
      var raw = field.value || "";
      var hashAt = raw.lastIndexOf("#");
      if (hashAt > -1 && !/\s/.test(raw.slice(hashAt + 1))) field.value = raw.slice(0, hashAt).replace(/\s+$/, "");
      field.focus();
      run();
    });
  }

  if (field) {
    field.addEventListener("input", run);
    field.addEventListener("focus", function () { load().then(run); });
  }

  /* -----------------------------------------------------------------------
     4b  ARRIVING FROM A RESULT. The link carries ?at= (which block) and
     ?find= (the words), so the page can scroll to the very line the result
     showed and light up the words in it. Nothing to edit.
     -------------------------------------------------------------------- */
  (function () {
    var qs = location.search;
    if (!qs || qs.indexOf("at=") === -1) return;
    var at = null, find = "";
    qs.replace(/^\?/, "").split("&").forEach(function (bit) {
      var kv = bit.split("=");
      if (kv[0] === "at") at = parseInt(decodeURIComponent(kv[1] || ""), 10);
      if (kv[0] === "find") find = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
    });
    var main = document.querySelector("main");
    if (!main || at === null || isNaN(at)) return;
    var blocks = main.querySelectorAll(BLOCKS);
    var target = blocks[at];
    if (!target) return;

    // light up the first of the words inside that line
    var word = (find.split(/\s+/)[0] || "").toLowerCase();
    var lit = null;
    if (word) {
      var walk = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walk.nextNode())) {
        var i = node.nodeValue.toLowerCase().indexOf(word);
        if (i === -1) continue;
        var after = node.splitText(i);
        after.splitText(word.length);
        lit = document.createElement("mark");
        lit.className = "find-hit";
        lit.appendChild(after.cloneNode(true));
        after.parentNode.replaceChild(lit, after);
        break;
      }
    }
    var to = lit || target;
    // let the page settle (fonts, sticky bars) before scrolling to it
    window.setTimeout(function () {
      to.scrollIntoView({ block: "center", behavior: "smooth" });
      if (lit) {
        lit.classList.add("lit");
        window.setTimeout(function () { lit.classList.remove("lit"); }, 2200);
      }
    }, 120);

    // leave the address bar clean, so a reload does not jump again
    if (window.history && history.replaceState) {
      history.replaceState(null, "", location.pathname + location.hash);
    }
  })();

  /* -----------------------------------------------------------------------
     6  QUOTE OF THE DAY (the Noticeboard). quotes.js holds one line for each
     day of the year, keyed "MM-DD"; this picks out today's. The block starts
     hidden and is only shown once a quote is in it, so a visitor without
     JavaScript sees no empty frame.
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
     7  TAG FILTERS (the Blogs page and the News page). Each button carries
     data-filter with one tag, or "all"; each item in the list carries
     data-cats with its own tags, space separated, and an item may hold
     several. Adding an item, or a tag, is an HTML edit only.
     -------------------------------------------------------------------- */
  var filters = document.querySelectorAll("[data-filter]");
  // any list whose items carry data-cats — the posts on the Blogs page and the
  // events on the News page both use this
  var posts = document.querySelectorAll("li[data-cats]");

  // An item that does not already show its tags gets them drawn here, from the
  // very words the filter matches on, so the two can never drift apart. (The
  // Blogs page writes its own, so it is left alone.)
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
