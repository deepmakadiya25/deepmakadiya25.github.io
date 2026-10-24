/* Shared content helpers. Navigation, light/dark mode and the compact header
   live in simple.js. Search, filters and page tools live in pages.js.
   Only features used by the current pages are initialized here. */

/* EDIT: Change this date after every update, using day Month year.
   It fills every footer. Also update edited pages' lastmod dates in sitemap.xml. */
var LAST_UPDATED = "25 October 2026";

document.addEventListener("DOMContentLoaded", function () {
  // Wait for MathJax startup, and mark a panel complete only after success.
  // This leaves a failed or interrupted layout eligible for another attempt.
  function renderMath(panel) {
    if (panel.dataset.typeset || !window.MathJax || !window.MathJax.typesetPromise) return;
    panel.dataset.typeset = "pending";
    var ready = window.MathJax.startup && window.MathJax.startup.promise;
    Promise.resolve(ready).then(function () {
      return window.MathJax.typesetPromise([panel]);
    }).then(function () {
      panel.dataset.typeset = "1";
    }).catch(function (error) {
      delete panel.dataset.typeset;
      console.warn("Mathematical notation could not be laid out.", error);
    });
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
      // The modal observer must clear background inertness before focus returns.
      window.requestAnimationFrame(function () {
        if (lastFocused && lastFocused.isConnected && lastFocused.focus) lastFocused.focus();
      });
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
      // Tiles side by side share a row, so each is given its own slice of the
      // row's height, left to right: as a row rises past the middle of the
      // screen the caption moves from the left tile to the right one, and then
      // on to the next row. With one tile per row this is simply its middle.
      // Near the very top and bottom of the page the line the captions follow
      // slides up or down from the middle, so the first and last photos, which
      // can never be scrolled to the middle, still get their turn.
      function pickNearest() {
        var middle = window.innerHeight / 2, best = null, bestGap = Infinity;
        var scrolled = window.pageYOffset || 0;
        var left = document.documentElement.scrollHeight - window.innerHeight - scrolled;
        if (scrolled < middle) middle = scrolled;
        else if (left < middle) middle = window.innerHeight - left;
        var rects = [], i, j;
        for (i = 0; i < tiles.length; i++) rects.push(tiles[i].getBoundingClientRect());
        for (i = 0; i < tiles.length; i++) {
          var r = rects[i];
          if (r.bottom < 0 || r.top > window.innerHeight) continue;   // off screen
          var col = 0, cols = 0;
          for (j = 0; j < tiles.length; j++) {
            if (tiles[j].parentNode !== tiles[i].parentNode || Math.abs(rects[j].top - r.top) > 2) continue;
            cols++;
            if (rects[j].left < r.left) col++;
          }
          var gap = Math.abs(r.top + r.height * (col + 0.5) / cols - middle);
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

  // "MORE / LESS" BLOCKS (useful-links.html). Each block shows its first three
  // links and hides the rest behind a "More" button added here. A block of
  // three or fewer gets no button, so adding a link is an HTML edit only.
  // EDIT: Useful Links shows this many .item entries before More; the button is automatic.
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
        // Lay out the maths the first time it is really shown: measuring it
        // while hidden comes out wrong.
        if (!isOpen) renderMath(block);
      });
    })(linkBlocks[b]);
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
      if (!isOpen) renderMath(panel);
    });
  }

});
