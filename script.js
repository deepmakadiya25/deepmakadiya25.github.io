/* =========================================================================
   Deep H. Makadiya — academic site. One script, shared by every page.

   WHAT IS IN HERE, in the order it appears. Each block below carries its
   own note explaining what it does and what (if anything) you must edit
   when you add content.

     1  LAST_UPDATED          the one line you normally change (just below)
     2  Mobile sidebar        the menu button, overlay and Escape key
     3  Section tabs          the scrolling tab row, fades and arrows
     4  Colour picker         sets data-theme on <html>
     5  Appearance panel      opens/closes the four pickers, remembers it
     6  Typeface picker       sets data-font on <html>
     7  Style picker          sets data-style (and data-panel) on <html>
     8  Dark mode switch      sets data-mode on <html>
     9  "Last updated"        writes LAST_UPDATED into every footer
    10  Gallery lightbox      gallery.html
    11  More / Less blocks    Miscellaneous > Some Useful Links
    12  Language bubbles      Miscellaneous, touch screens only
    13  Rotating news cards   home page
    14  Abstract toggles      Research
    15  Scrollspy             marks the tab of the section you are reading

   HOW THE APPEARANCE CONTROLS WORK (blocks 4 to 8). Each picker writes one
   attribute on the <html> element and saves the choice in the visitor's
   browser (localStorage). styles.css does all the actual re-colouring and
   re-shaping from those attributes:

     data-theme="sage"      colour scheme          key "site-theme"
     data-font="bitter"     typeface pair          key "site-font"
     data-style="midnight"  layout style           key "site-style"
     data-mode="dark"       dark mode              key "site-mode"
     data-appearance="open" panel left open        key "site-appearance"

   The four axes are independent — any colour works with any typeface, any
   style, in light or dark. A small script in every page's <head> re-applies
   the saved attributes BEFORE the page paints, so nothing flickers. If you
   ever add a page, copy that <head> script across too or the visitor's
   choices will be ignored on it.

   Nearly every block finds its own elements with querySelectorAll, so
   adding one more publication, photo, link, news card or tab is an HTML
   edit only — this file needs no change.
   ========================================================================= */

/* THE ONE LINE TO CHANGE WHEN YOU UPDATE THE SITE.
   Shown as "Last updated: ..." in the footer of every page. */
var LAST_UPDATED = "24 September 2026";

document.addEventListener("DOMContentLoaded", function () {
  var sidebar = document.getElementById("sidebar");
  var toggle = document.getElementById("menuToggle");
  var overlay = document.getElementById("overlay");

  function openMenu() {
    if (!sidebar) return;
    sidebar.classList.add("open");
    if (overlay) overlay.classList.add("open");
    document.body.classList.add("menu-open");   // stops the page behind scrolling
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    if (!sidebar) return;                       // a page without a sidebar (a blog post)
    sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.classList.remove("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  // Escape closes the slide-in menu, as people expect it to.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  // The button opens the menu and, while it is open, closes it again.
  if (toggle) toggle.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) { closeMenu(); } else { openMenu(); }
  });
  if (overlay) overlay.addEventListener("click", closeMenu);

  // Close the menu automatically if someone taps a page link inside it.
  if (sidebar) {
    var links = sidebar.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", closeMenu);
    }
  }

  // In-page section tabs: one scrollable line, with fade hints and arrows
  // that appear only when the tabs overflow. Runs for every
  // ".page-tabs-wrap" on the page — no edits needed when you add a tab.
  var tabWraps = document.querySelectorAll(".page-tabs-wrap");
  tabWraps.forEach(function (wrap) {
    var tabs = wrap.querySelector(".page-tabs");
    var leftArrow = wrap.querySelector(".tabs-arrow.left");
    var rightArrow = wrap.querySelector(".tabs-arrow.right");
    var leftFade = wrap.querySelector(".tabs-fade.left");
    var rightFade = wrap.querySelector(".tabs-fade.right");
    if (!tabs) return;

    function update() {
      var hasOverflow = tabs.scrollWidth > tabs.clientWidth + 1;
      var atStart = tabs.scrollLeft <= 0;
      var atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 1;

      if (leftArrow) leftArrow.hidden = !hasOverflow || atStart;
      if (rightArrow) rightArrow.hidden = !hasOverflow || atEnd;
      if (leftFade) leftFade.hidden = !hasOverflow || atStart;
      if (rightFade) rightFade.hidden = !hasOverflow || atEnd;
    }

    if (leftArrow) leftArrow.addEventListener("click", function () {
      tabs.scrollBy({ left: -160, behavior: "smooth" });
    });
    if (rightArrow) rightArrow.addEventListener("click", function () {
      tabs.scrollBy({ left: 160, behavior: "smooth" });
    });

    tabs.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    // Measure again once the web font has swapped in: the row is wider in Lora
    // than in the fallback, so a first measurement can miss the overflow and
    // leave the arrows and fades hidden when they are actually needed.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  });

  // COLOUR PICKER (the circles in the sidebar). Clicking one sets
  // data-theme="..." on <html>; styles.css re-states its colour variables
  // per scheme, so the page recolours at once. The choice is saved in the
  // browser and re-applied by the small script in each page's <head>.
  // Works with whatever circles it finds — adding a scheme is HTML + CSS only.
  var STORE_KEY = "site-theme";
  var swatches = document.querySelectorAll("[data-set-theme]");

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "cream";
  }
  function markActive() {
    var now = currentTheme();
    for (var i = 0; i < swatches.length; i++) {
      var on = swatches[i].getAttribute("data-set-theme") === now;
      swatches[i].classList.toggle("active", on);
      swatches[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  for (var s = 0; s < swatches.length; s++) {
    swatches[s].addEventListener("click", function () {
      var picked = this.getAttribute("data-set-theme");
      document.documentElement.setAttribute("data-theme", picked);
      try { localStorage.setItem(STORE_KEY, picked); } catch (e) {}
      markActive();
    });
  }
  markActive();

  // APPEARANCE PANEL. The row in the sidebar opens and closes the four
  // controls beneath it, and the state is remembered: open it once and it
  // stays open as you move around the site and after a refresh. The panel
  // is shown by data-appearance="open" on <html>, which the script in each
  // page's <head> sets before the page paints, so an open panel never
  // flickers shut on load. This code only keeps the button in step and
  // writes the choice down.
  var APPEARANCE_KEY = "site-appearance";
  var appearanceToggle = document.getElementById("appearanceToggle");
  if (appearanceToggle) {
    var setAppearance = function (open) {
      if (open) { document.documentElement.setAttribute("data-appearance", "open"); }
      else { document.documentElement.removeAttribute("data-appearance"); }
      appearanceToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    setAppearance(document.documentElement.getAttribute("data-appearance") === "open");
    appearanceToggle.addEventListener("click", function () {
      var open = this.getAttribute("aria-expanded") !== "true";
      setAppearance(open);
      try { localStorage.setItem(APPEARANCE_KEY, open ? "open" : "shut"); } catch (e) {}
    });
  }

  // TYPEFACE PICKER (the five "A" circles). Clicking one sets
  // data-font="..." on <html>; styles.css names a heading face and a body
  // face per pair, so the whole site re-sets at once. The choice is saved in
  // the browser and re-applied by the small script in each page's <head>.
  // Works with whatever circles it finds — adding a pair is HTML + CSS only.
  var FONT_KEY = "site-font";
  var fontSwatches = document.querySelectorAll("[data-set-font]");

  function currentFont() {
    return document.documentElement.getAttribute("data-font") || "playfair";
  }
  function markFont() {
    var now = currentFont();
    for (var i = 0; i < fontSwatches.length; i++) {
      var on = fontSwatches[i].getAttribute("data-set-font") === now;
      fontSwatches[i].classList.toggle("active", on);
      fontSwatches[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  for (var fz = 0; fz < fontSwatches.length; fz++) {
    fontSwatches[fz].addEventListener("click", function () {
      var picked = this.getAttribute("data-set-font");
      document.documentElement.setAttribute("data-font", picked);
      try { localStorage.setItem(FONT_KEY, picked); } catch (e) {}
      markFont();
    });
  }
  markFont();

  // STYLE PICKER (the "1 2 3 4 5" circles). Clicking one sets data-style on
  // <html>; the STYLES section of styles.css re-shapes the site to match.
  // Classic (circle 2) is the plain site with no [data-style] rules of its
  // own, so nothing breaks if the attribute is missing or holds a name this
  // version of the stylesheet does not know.
  var STYLE_KEY = "site-style";
  var styleSwatches = document.querySelectorAll("[data-set-style]");

  function currentStyle() {
    return document.documentElement.getAttribute("data-style") || "classic";
  }
  function markStyle() {
    var now = currentStyle();
    for (var i = 0; i < styleSwatches.length; i++) {
      var on = styleSwatches[i].getAttribute("data-set-style") === now;
      styleSwatches[i].classList.toggle("active", on);
      styleSwatches[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  // These three put a dark navigation panel against the light page. They
  // share every rule under [data-panel="dark"] in styles.css, so the
  // attribute goes on alongside data-style. Add a style to this list and it
  // inherits the whole dark panel for free.
  var DARK_PANEL_STYLES = ["contrast", "midnight", "grove"];

  function applyStyle(picked) {
    var d = document.documentElement;
    d.setAttribute("data-style", picked);
    var dark = false;
    for (var i = 0; i < DARK_PANEL_STYLES.length; i++) {
      if (DARK_PANEL_STYLES[i] === picked) { dark = true; }
    }
    if (dark) { d.setAttribute("data-panel", "dark"); }
    else { d.removeAttribute("data-panel"); }
  }

  for (var sy = 0; sy < styleSwatches.length; sy++) {
    styleSwatches[sy].addEventListener("click", function () {
      var picked = this.getAttribute("data-set-style");
      applyStyle(picked);
      try { localStorage.setItem(STYLE_KEY, picked); } catch (e) {}
      markStyle();
    });
  }
  markStyle();

  // DARK MODE SWITCH (under the colour circles). It sets data-mode="dark" on
  // <html>; styles.css carries a dark version of every colour scheme, so the
  // whole site flips at once and the chosen colour is kept. The choice is
  // saved in the visitor's browser and re-applied by the small script in
  // each page's <head>. Until they touch the switch the site follows their
  // device's own light/dark setting — and keeps following it even if that
  // setting changes while the page is open. Nothing here needs editing when
  // you add a colour scheme.
  var MODE_KEY = "site-mode";
  var modeToggle = document.getElementById("modeToggle");

  function isDark() {
    return document.documentElement.getAttribute("data-mode") === "dark";
  }
  function applyMode(mode) {
    if (mode === "dark") {
      document.documentElement.setAttribute("data-mode", "dark");
    } else {
      document.documentElement.removeAttribute("data-mode");
    }
    if (modeToggle) {
      modeToggle.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
    }
  }

  // Match the switch to whatever the <head> script already decided.
  applyMode(isDark() ? "dark" : "light");

  if (modeToggle) modeToggle.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    applyMode(next);
    try { localStorage.setItem(MODE_KEY, next); } catch (e) {}
  });

  if (window.matchMedia) {
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    var followSystem = function (e) {
      var chosen = null;
      try { chosen = localStorage.getItem(MODE_KEY); } catch (err) {}
      if (!chosen) applyMode(e.matches ? "dark" : "light");   // only while unset
    };
    if (systemDark.addEventListener) { systemDark.addEventListener("change", followSystem); }
    else if (systemDark.addListener) { systemDark.addListener(followSystem); }   // older Safari
  }

  // "LAST UPDATED" — written into every page's footer from LAST_UPDATED at
  // the top of this file. The line stays hidden if no date is set.
  var stamp = document.getElementById("lastUpdated");
  var stampLine = document.getElementById("lastUpdatedLine");
  if (stamp && stampLine && LAST_UPDATED) {
    stamp.textContent = LAST_UPDATED;
    stampLine.hidden = false;
  }

  // GALLERY LIGHTBOX (gallery.html). Clicking a ".gallery-item" tile opens the
  // photo full size with its figcaption underneath. Clicking anywhere outside
  // the photo, or pressing Escape, closes it again. The markup is built here,
  // so a new photo tile needs nothing beyond its <figure> in the HTML.
  var tiles = document.querySelectorAll(".gallery-item");
  if (tiles.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Photo");
    box.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
      '<div class="lightbox-inner"><img alt=""><p></p></div>';
    document.body.appendChild(box);

    var boxImg = box.querySelector("img");
    var boxText = box.querySelector("p");
    var lastFocused = null;

    function openBox(fig) {
      var img = fig.querySelector("img");
      var cap = fig.querySelector("figcaption");
      if (!img) return;
      lastFocused = document.activeElement;
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt || "";
      boxText.textContent = cap ? cap.textContent.trim() : "";
      boxText.hidden = !boxText.textContent;
      box.hidden = false;
      document.body.classList.add("lightbox-open");   // stops the page behind scrolling
      box.querySelector(".lightbox-close").focus();
    }

    function closeBox() {
      box.hidden = true;
      boxImg.removeAttribute("src");
      document.body.classList.remove("lightbox-open");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    for (var t = 0; t < tiles.length; t++) {
      (function (fig) {
        // Wrap the caption text so styles.css can clamp it to three lines
        // without a fourth bleeding into the padding. Plain text in the HTML;
        // the span is added here.
        var cap = fig.querySelector("figcaption");
        if (cap && !cap.querySelector(".cap-text")) {
          var span = document.createElement("span");
          span.className = "cap-text";
          while (cap.firstChild) span.appendChild(cap.firstChild);  // keeps <em>, <a>, <sub>
          cap.appendChild(span);
        }
        fig.setAttribute("tabindex", "0");
        fig.setAttribute("role", "button");
        fig.addEventListener("click", function () { openBox(fig); });
        fig.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBox(fig); }
        });
      })(tiles[t]);
    }

    // ON TOUCH SCREENS there is no hover, so the caption is shown for whichever
    // tile you have scrolled to — the one nearest the middle of the screen —
    // the way a video list on a tablet plays the item you have scrolled onto.
    // A finger resting on a tile marks that one instead. With a mouse this is
    // all skipped and :hover in styles.css does the work.
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
      var activeTile = null;
      function setActive(fig) {
        if (fig === activeTile) return;
        if (activeTile) activeTile.classList.remove("is-active");
        activeTile = fig;
        if (fig) fig.classList.add("is-active");
      }
      function pickNearest() {
        var middle = window.innerHeight / 2, best = null, bestGap = Infinity;
        for (var i = 0; i < tiles.length; i++) {
          var r = tiles[i].getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) continue;   // off screen
          var gap = Math.abs(r.top + r.height / 2 - middle);
          if (gap < bestGap) { bestGap = gap; best = tiles[i]; }
        }
        setActive(best);
      }
      var queued = false;
      function onScroll() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () { queued = false; pickNearest(); });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      for (var q = 0; q < tiles.length; q++) {
        tiles[q].addEventListener("touchstart", (function (fig) {
          return function () { setActive(fig); };
        })(tiles[q]), { passive: true });
      }
      pickNearest();
    }

    // Anywhere that is not the photo itself closes the lightbox.
    box.addEventListener("click", function (e) {
      if (e.target !== boxImg) closeBox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) closeBox();
    });
  }

  // "MORE / LESS" LINK BLOCKS (Miscellaneous > Some Useful Links).
  // Each ".links-block" shows its first three ".item" links; anything beyond
  // that is hidden behind a "More" button added here, which turns into "Less"
  // once expanded. The arrow is the same glyph in both states, turned down or
  // up by styles.css, so the two can never differ in size. Blocks with three
  // links or fewer get no button at all, so adding a link is just pasting
  // another ".item" into the HTML.
  var VISIBLE_LINKS = 3;
  var linkBlocks = document.querySelectorAll(".links-block");
  for (var b = 0; b < linkBlocks.length; b++) {
    (function (block) {
      var items = block.querySelectorAll(".item");
      if (items.length <= VISIBLE_LINKS) return;

      function setExtras(hide) {
        for (var k = VISIBLE_LINKS; k < items.length; k++) { items[k].hidden = hide; }
      }
      function label(text) {
        btn.innerHTML = text + ' <span class="caret" aria-hidden="true">&#9656;</span>';
      }

      setExtras(true);
      block.classList.add("has-more");          // lets styles.css tighten the gap above
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pub-toggle links-more";
      btn.setAttribute("aria-expanded", "false");
      label("More");
      block.appendChild(btn);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        setExtras(isOpen);
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        label(isOpen ? "More" : "Less");
        // Lay out any maths in the links that were hidden, the first time they
        // are actually shown — measuring it while hidden can come out wrong.
        if (!isOpen && !block.dataset.typeset &&
            window.MathJax && window.MathJax.typesetPromise) {
          block.dataset.typeset = "1";
          window.MathJax.typesetPromise([block]);
        }
      });
    })(linkBlocks[b]);
  }

  // SPOKEN LANGUAGE BUBBLES (Miscellaneous). With a mouse or a keyboard the
  // bubble appears on its own, from CSS. This is only for touch screens,
  // where a tap has to open and close it. Tapping a second chip closes the
  // first, and a tap anywhere else, or Escape, closes whichever is open.
  var langChips = document.querySelectorAll(".lang-chip");
  if (langChips.length) {
    var closeLangs = function (except) {
      for (var i = 0; i < langChips.length; i++) {
        if (langChips[i] !== except) langChips[i].setAttribute("aria-expanded", "false");
      }
    };
    for (var L = 0; L < langChips.length; L++) {
      langChips[L].addEventListener("click", function (e) {
        e.stopPropagation();
        var open = this.getAttribute("aria-expanded") === "true";
        closeLangs(this);
        this.setAttribute("aria-expanded", open ? "false" : "true");
      });
    }
    document.addEventListener("click", function () { closeLangs(null); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLangs(null);
    });
  }

  // ROTATING NEWS CARDS (home page). Any ".carousel" shows one
  // ".carousel-item" at a time and moves to the next every five seconds. The
  // row of dots is built here from however many items are present, so adding
  // or removing an item in the HTML needs no change in this file.
  //   - rotation pauses while the pointer is over the card, or while the
  //     keyboard focus is inside it, and picks up again afterwards;
  //   - clicking a dot stops the rotation for good, on the assumption that
  //     the visitor now wants to read at their own pace;
  //   - a visitor whose system asks for reduced motion never gets rotation at
  //     all, only the dots.
  // Change the 5000 below to speed it up or slow it down (milliseconds).
  var CAROUSEL_MS = 5000;
  var carousels = document.querySelectorAll("[data-carousel]");
  for (var c = 0; c < carousels.length; c++) {
    (function (box) {
      var items = box.querySelectorAll(".carousel-item");
      if (items.length === 0) return;

      var dots = document.createElement("div");
      dots.className = "carousel-dots";
      box.appendChild(dots);

      var index = 0, timer = null, paused = false, stopped = false;
      var buttons = [];

      function show(n) {
        index = (n + items.length) % items.length;
        for (var i = 0; i < items.length; i++) {
          items[i].classList.toggle("is-current", i === index);
          buttons[i].setAttribute("aria-selected", i === index ? "true" : "false");
        }
      }
      function tick() { if (!paused && !stopped) show(index + 1); }
      function start() {
        if (timer || stopped || items.length < 2) return;
        timer = window.setInterval(tick, CAROUSEL_MS);
      }
      function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

      for (var i = 0; i < items.length; i++) {
        (function (n) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "carousel-dot";
          b.setAttribute("aria-label", "Item " + (n + 1) + " of " + items.length);
          b.setAttribute("aria-selected", "false");
          b.addEventListener("click", function () { stopped = true; stop(); show(n); });
          dots.appendChild(b);
          buttons.push(b);
        })(i);
      }

      show(0);

      // Only rotate on its own when the visitor has not asked for less motion.
      var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!calm) {
        box.addEventListener("mouseenter", function () { paused = true; });
        box.addEventListener("mouseleave", function () { paused = false; });
        box.addEventListener("focusin", function () { paused = true; });
        box.addEventListener("focusout", function () { paused = false; });
        start();
      }
    })(carousels[c]);
  }

  // ABSTRACTS — each "Abstract" button opens the panel whose id matches its
  // aria-controls. Works for any number of buttons; no edits when you add a
  // paper.
  // ":not(.links-more)" keeps the Miscellaneous "More" button out of this —
  // it shares the .pub-toggle look but has no abstract panel to open.
  var absButtons = document.querySelectorAll(".pub-toggle:not(.links-more)");
  for (var a = 0; a < absButtons.length; a++) {
    absButtons[a].addEventListener("click", function () {
      var panel = document.getElementById(this.getAttribute("aria-controls"));
      if (!panel) return;
      var isOpen = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", isOpen ? "false" : "true");
      panel.hidden = isOpen;

      // The maths inside an abstract is laid out the first time the panel is
      // actually shown — measuring it while hidden can come out wrong.
      if (!isOpen && !panel.dataset.typeset &&
          window.MathJax && window.MathJax.typesetPromise) {
        panel.dataset.typeset = "1";
        window.MathJax.typesetPromise([panel]);
      }
    });
  }

  // -----------------------------------------------------------------------
  // SECTION HIGHLIGHTING ("scrollspy")
  // As you scroll an inner page, the tab for the section you are currently
  // reading is marked with the "current" class (styled in styles.css). The
  // section a tab points at is found from its own href — so adding, renaming
  // or re-ordering tabs needs no change here. On narrow screens, where the
  // tab row scrolls sideways, the highlighted tab is nudged into view.
  // -----------------------------------------------------------------------
  tabWraps.forEach(function (wrap) {
    var tabs = wrap.querySelector(".page-tabs");
    if (!tabs) return;

    var links = [];
    var anchors = tabs.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
      var target = document.getElementById(anchors[i].getAttribute("href").slice(1));
      if (target) links.push({ link: anchors[i], target: target });
    }
    if (links.length === 0) return;

    var active = null;

    function setCurrent(entry) {
      if (entry === active) return;
      if (active) active.link.classList.remove("current");
      active = entry;
      if (!active) return;
      active.link.classList.add("current");

      // Keep the highlighted tab visible when the row is scrollable. The
      // arrows and the fades sit ON TOP of the row's own left and right
      // padding, so a tab parked any closer than that padding ends up behind
      // one of them. Measuring the padding rather than assuming a number also
      // keeps this right at the widths where styles.css changes it.
      if (tabs.scrollWidth > tabs.clientWidth + 1) {
        var t = active.link;
        var pad = window.getComputedStyle(tabs);
        var padLeft = parseFloat(pad.paddingLeft) || 0;
        var padRight = parseFloat(pad.paddingRight) || 0;
        var left = t.offsetLeft - tabs.offsetLeft;
        var right = left + t.offsetWidth;
        if (left < tabs.scrollLeft + padLeft) {
          tabs.scrollTo({ left: Math.max(0, left - padLeft), behavior: "smooth" });
        } else if (right > tabs.scrollLeft + tabs.clientWidth - padRight) {
          // For the last tab this lands exactly at the end of the row, which
          // is also what hides the right-hand arrow and fade.
          tabs.scrollTo({ left: right - tabs.clientWidth + padRight, behavior: "smooth" });
        }
      }
    }

    function spy() {
      // Where a heading comes to rest when you click its tab — that is its
      // CSS "scroll-margin-top", which already clears the frozen tab bar.
      // Measuring from the same line means a tab lights up the instant you
      // click it, instead of staying one section behind.
      var landing = parseFloat(getComputedStyle(links[0].target).scrollMarginTop);
      if (!landing || isNaN(landing)) landing = wrap.getBoundingClientRect().bottom + 12;
      var line = landing + 6;
      var found = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].target.getBoundingClientRect().top <= line) found = links[i];
      }
      // Above the first heading nothing is marked at all — the highlight
      // only appears once you have actually scrolled into a section. At the
      // very bottom of the page, always mark the last one.
      var atBottom = (window.innerHeight + window.pageYOffset) >=
                     (document.documentElement.scrollHeight - 2);
      if (atBottom) found = links[links.length - 1];
      setCurrent(found);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { spy(); ticking = false; });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    spy();
  });
});
