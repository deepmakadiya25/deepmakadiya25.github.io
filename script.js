/* =========================================================================
   Deep H. Makadiya — academic site. One script, shared by every page.

   The blocks in here, in order:

     1  LAST_UPDATED          the date shown in every footer
     2  Mobile sidebar        menu button, overlay, Escape key
     3  Section tabs          the scrolling tab row, fades and arrows
     4  Colour picker         sets data-theme
     5  Appearance panel      opens the four pickers, remembers it
     6  Typeface picker       sets data-font
     7  Style picker          sets data-style and data-panel
     8  Light / dark mode     sets data-mode
     9  "Last updated"        writes the date into every footer
    10  Gallery lightbox      gallery.html
    11  More / Less blocks    Useful Links
    12  Language bubbles      Biography, touch screens only
    13  Rotating news cards   home page
    14  Abstract toggles      Research
    15  Scrollspy             marks the tab you are reading
    16  Page name in the bar  phones only

   Each picker sets one attribute on <html> and saves the choice in the
   visitor's browser. styles.css does the re-colouring and re-shaping:

     data-theme       colour scheme    key "site-theme"
     data-font        typeface pair    key "site-font"
     data-style       layout style     key "site-style"
     data-mode        dark mode        key "site-mode"
     data-appearance  panel left open  key "site-appearance"

   RULE: every page needs the small script in its <head> that re-applies
   these before the page paints. A new page without it will ignore the
   visitor's choices.

   Blocks find their own elements, so adding a publication, photo, link,
   news card or tab is an HTML edit only.
   ========================================================================= */

/* 1  LAST_UPDATED. Change this on every update. It is shown as
   "Last updated: ..." in the footer of every page. */
var LAST_UPDATED = "27 September 2026";

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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  if (toggle) toggle.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) { closeMenu(); } else { openMenu(); }
  });
  if (overlay) overlay.addEventListener("click", closeMenu);

  // tapping a page link inside the menu closes it
  if (sidebar) {
    var links = sidebar.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", closeMenu);
    }
  }

  // SECTION TABS. One scrolling line per ".page-tabs-wrap", with fades and
  // arrows that show only when the tabs overflow.
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
    // GOTCHA: measure again once the web font loads. The row is wider in Lora
    // than in the fallback, so the first measurement can miss the overflow.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  });

  // COLOUR PICKER (the circles in the sidebar). Clicking one sets data-theme
  // on <html> and saves the choice. Adding a scheme is HTML and CSS only.
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

  // APPEARANCE PANEL. The sidebar row opens and closes the four pickers, and
  // the state is remembered. The <head> script sets data-appearance before
  // the page paints, so an open panel never flickers shut. This only keeps
  // the button in step and saves the choice.
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

  // TYPEFACE PICKER (the five "A" circles). Clicking one sets data-font on
  // <html> and saves the choice. Adding a pair is HTML and CSS only.
  var FONT_KEY = "site-font";
  var fontSwatches = document.querySelectorAll("[data-set-font]");

  function currentFont() {
    return document.documentElement.getAttribute("data-font") || "classic";
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
  // <html>, and styles.css re-shapes the site. Classic has no rules of its
  // own, so a missing or unknown name is harmless.
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
  // RULE: styles named here also get data-panel="dark", which is how they
  // share the dark navigation panel in styles.css. Keep this list in step
  // with the styles that want that panel.
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

  // THEME (Light, Dark, Auto). Dark sets data-mode on <html>;
  // every colour scheme has a dark version, so the chosen colour is kept.
  // Auto is the default and follows the phone or laptop setting, changing
  // with it while the page is open. This one block drives the buttons in the
  // sidebar and the ones in the second set's appearance menu.
  var MODE_KEY = "site-mode";
  var modeButtons = document.querySelectorAll("[data-set-mode]");
  var systemDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function storedMode() {
    var v = null;
    try { v = localStorage.getItem(MODE_KEY); } catch (e) {}
    return (v === "light" || v === "dark") ? v : "auto";
  }
  function paint(choice) {
    var dark = choice === "dark" || (choice === "auto" && systemDark && systemDark.matches);
    if (dark) { document.documentElement.setAttribute("data-mode", "dark"); }
    else { document.documentElement.removeAttribute("data-mode"); }
    for (var i = 0; i < modeButtons.length; i++) {
      var on = modeButtons[i].getAttribute("data-set-mode") === choice;
      modeButtons[i].classList.toggle("active", on);
      modeButtons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  paint(storedMode());

  for (var mb = 0; mb < modeButtons.length; mb++) {
    modeButtons[mb].addEventListener("click", function () {
      var picked = this.getAttribute("data-set-mode");
      paint(picked);
      try { localStorage.setItem(MODE_KEY, picked); } catch (e) {}
    });
  }

  if (systemDark) {
    var followSystem = function () { if (storedMode() === "auto") paint("auto"); };
    if (systemDark.addEventListener) { systemDark.addEventListener("change", followSystem); }
    else if (systemDark.addListener) { systemDark.addListener(followSystem); }   // older Safari
  }

  // THE PAGE NAME IN THE PHONE TOP BAR. Once the in-page tab bar reaches the
  // top, the page's name appears beside the site name. Pages with no tab bar
  // never show it. The name comes from the current menu link.
  var topbar = document.querySelector(".topbar");
  var topbarPage = document.getElementById("topbarPage");
  var tabsWrap = document.querySelector(".page-tabs-wrap");
  if (topbar && topbarPage && tabsWrap) {
    var here = document.querySelector(".sidebar nav a.active");
    topbarPage.textContent = here ? here.textContent.trim() : "";

    var barHeight = function () {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--topbar-h");
      return parseFloat(v) || 52;
    };
    // GOTCHA: ask the element where it comes to rest instead of assuming the
    // top bar's height. The "card" style leaves a gap, and the assumption
    // meant the page name never appeared under that style.
    var restTop = function () {
      var t = parseFloat(getComputedStyle(tabsWrap).top);
      return isNaN(t) ? barHeight() : t;
    };
    var ticking2 = false;
    var checkTabs = function () {
      // one pixel of tolerance: the sticky bar settles exactly on the line
      var stuck = tabsWrap.getBoundingClientRect().top <= restTop() + 1;
      topbar.classList.toggle("with-page", stuck && !!topbarPage.textContent);
      ticking2 = false;
    };
    window.addEventListener("scroll", function () {
      if (ticking2) return;
      ticking2 = true;
      window.requestAnimationFrame(checkTabs);
    }, { passive: true });
    window.addEventListener("resize", checkTabs);
    checkTabs();
  }

  // "LAST UPDATED" in every footer, from LAST_UPDATED at the top of this
  // file. The line stays hidden if no date is set.
  var stamp = document.getElementById("lastUpdated");
  var stampLine = document.getElementById("lastUpdatedLine");
  if (stamp && stampLine && LAST_UPDATED) {
    stamp.textContent = LAST_UPDATED;
    stampLine.hidden = false;
  }

  // GALLERY LIGHTBOX (gallery.html). A ".gallery-item" tile opens the photo
  // full size with its caption. A click outside the photo, or Escape, closes
  // it. A new photo needs only its <figure> in the HTML.
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
        // Wrap the caption text so styles.css can clamp it to three lines.
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

    // On touch screens there is no hover, so the caption is shown for the tile
    // nearest the middle of the screen, or the one being touched. With a mouse
    // this is skipped and :hover in styles.css does the work.
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

    box.addEventListener("click", function (e) {
      if (e.target !== boxImg) closeBox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) closeBox();
    });
  }

  // "MORE / LESS" BLOCKS (useful-links.html, and the past announcements).
  // Each block shows its first three items and hides the rest behind a
  // "More" button added here. A block of three or fewer gets no button, so
  // adding an item is an HTML edit only.
  var VISIBLE_LINKS = 3;
  var linkBlocks = document.querySelectorAll(".links-block, .fold-list");
  for (var b = 0; b < linkBlocks.length; b++) {
    (function (block) {
      // a list folds its own rows; a links block folds the ".item" links in it
      var isList = block.classList.contains("fold-list");
      var items = isList ? block.children : block.querySelectorAll(".item");
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
      // a <button> may not sit inside a <ul>, so a list's button goes after it
      (isList ? block.parentNode : block).appendChild(btn);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        setExtras(isOpen);
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        label(isOpen ? "More" : "Less");
        // Lay out the maths the first time it is really shown: measuring it
        // while hidden comes out wrong.
        if (!isOpen && !block.dataset.typeset &&
            window.MathJax && window.MathJax.typesetPromise) {
          block.dataset.typeset = "1";
          window.MathJax.typesetPromise([block]);
        }
      });
    })(linkBlocks[b]);
  }

  // ROTATING NEWS CARDS (home page). A ".carousel" shows one item at a time
  // and moves on every five seconds. The dots are built from the items found,
  // so adding one is an HTML edit only. Rotation pauses on hover or focus,
  // stops for good once a dot is clicked, and never starts for a visitor who
  // asks for reduced motion. Change CAROUSEL_MS to alter the speed.
  var CAROUSEL_MS = 5000;
  var carousels = document.querySelectorAll("[data-carousel]");
  for (var c = 0; c < carousels.length; c++) {
    (function (box) {
      var items = box.querySelectorAll(".carousel-item");
      if (items.length === 0) return;
      // one item is not a carousel: show it, with no dots and no rotation
      if (items.length === 1) { items[0].classList.add("is-current"); return; }

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

  // ABSTRACTS. Each "Abstract" button opens the panel named in its
  // aria-controls, so adding a paper needs no edit here. ":not(.links-more)"
  // leaves out the Useful Links "More" buttons, which look the same.
  var absButtons = document.querySelectorAll(".pub-toggle:not(.links-more)");
  for (var a = 0; a < absButtons.length; a++) {
    absButtons[a].addEventListener("click", function () {
      var panel = document.getElementById(this.getAttribute("aria-controls"));
      if (!panel) return;
      var isOpen = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", isOpen ? "false" : "true");
      panel.hidden = isOpen;

      // Lay out the maths the first time the panel is really shown: measuring
      // it while hidden comes out wrong.
      if (!isOpen && !panel.dataset.typeset &&
          window.MathJax && window.MathJax.typesetPromise) {
        panel.dataset.typeset = "1";
        window.MathJax.typesetPromise([panel]);
      }
    });
  }

  // -----------------------------------------------------------------------
  // SCROLLSPY. As you scroll, the tab for the section you are reading gets
  // the "current" class. Each tab's section comes from its own href, so
  // adding or renaming tabs needs no change here. On narrow screens the
  // highlighted tab is nudged into view.
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

      // Keep the highlighted tab in view. The arrows and fades sit over the
      // row's padding, so measure that padding and scroll clear of it.
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
          tabs.scrollTo({ left: right - tabs.clientWidth + padRight, behavior: "smooth" });
        }
      }
    }

    function spy() {
      // A heading comes to rest at its CSS "scroll-margin-top", which clears
      // the frozen tab bar. Measuring from that same line makes the tab light
      // up as soon as it is clicked.
      var landing = parseFloat(getComputedStyle(links[0].target).scrollMarginTop);
      if (!landing || isNaN(landing)) landing = wrap.getBoundingClientRect().bottom + 12;
      var line = landing + 6;
      var found = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].target.getBoundingClientRect().top <= line) found = links[i];
      }
      // Nothing is marked above the first heading. At the very bottom of the
      // page, always mark the last one.
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
