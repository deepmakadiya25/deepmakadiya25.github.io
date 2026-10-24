/* Navigation, modal focus and the compact mobile brand.
   EDIT: Light/dark uses the saved site-mode value; each HTML head restores it.
   Keep the mobile breakpoint below in step with simple.css. */
document.addEventListener('DOMContentLoaded', () => {
  const more = document.querySelector('.nav-more');
  const nav = document.getElementById('pageNav');
  const menu = document.getElementById('pageMenuButton');
  const mode = document.getElementById('modeToggle');
  const search = document.getElementById('searchPanel');
  const searchButton = document.getElementById('searchButton');
  const header = document.querySelector('header.tb');
  const backdrop = document.getElementById('navBackdrop');
  const mobile = window.matchMedia('(max-width:1100px)');
  const lightbox = document.querySelector('.lightbox');
  const pageParts = document.querySelectorAll('main, footer.pg-foot, .post-tools');
  const drawerOpen = () => mobile.matches && nav.classList.contains('open');

  const refreshInert = () => {
    const modal = !search.hidden || !!(lightbox && !lightbox.hidden);
    header.inert = modal;
    pageParts.forEach(el => el.inert = modal || drawerOpen());
  };
  const refreshNav = () => {
    const open = drawerOpen();
    backdrop.hidden = !open;
    document.body.classList.toggle('nav-open', open);
    menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.inert = mobile.matches && !open;
    refreshInert();
  };
  const closeNav = (restoreFocus = false) => {
    nav.classList.remove('open');
    more.open = false;
    refreshNav();
    if (restoreFocus && mobile.matches) menu.focus();
  };
  // This is the only mobile-menu controller; keep its ARIA state and backdrop together.
  menu.addEventListener('click', e => {
    e.stopPropagation();
    const open = !drawerOpen();
    nav.classList.toggle('open', open);
    if (open) {
      document.querySelectorAll('.tb-btn[aria-controls]').forEach(button => {
        const panel = document.getElementById(button.getAttribute('aria-controls'));
        if (panel) { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); }
      });
    }
    refreshNav();
  });
  backdrop.addEventListener('click', () => closeNav(true));
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) closeNav();
  });
  document.addEventListener('click', e => {
    if (!more.contains(e.target)) more.open = false;
    if (!nav.contains(e.target) && !menu.contains(e.target)) closeNav();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawerOpen()) closeNav(true);
    else if (e.key === 'Escape' && more.open) {
      more.open = false;
      more.querySelector('summary').focus();
    }
  }, true);
  mobile.addEventListener('change', () => { closeNav(); updateBrand(); });
  refreshNav();

  const markMode = () => mode.setAttribute('aria-label', document.documentElement.getAttribute('data-mode') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  markMode();
  mode.addEventListener('click', () => {
    closeNav();
    const next = document.documentElement.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-mode', next);
    try { localStorage.setItem('site-mode', next); } catch(e) {}
    markMode();
  });
  const sectionsButton = document.getElementById('postTocBtn');
  if (sectionsButton) sectionsButton.addEventListener('click', () => closeNav());

  // Condense only after the complete title block reaches the bar's bottom rule.
  const brand = document.querySelector('.tb-name');
  const heading = document.querySelector('.pg-head, .post-head');
  const updateBrand = () => {
    const compact = mobile.matches && !!heading && heading.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom;
    brand.classList.toggle('is-compact', compact);
    const full = brand.querySelector('.tb-brand-full');
    const short = brand.querySelector('.tb-brand-short');
    const page = brand.querySelector('.tb-brand-page');
    full.setAttribute('aria-hidden', compact ? 'true' : 'false');
    short.setAttribute('aria-hidden', compact ? 'false' : 'true');
    page.setAttribute('aria-hidden', compact ? 'false' : 'true');
  };
  let brandFrame = 0;
  const scheduleBrand = () => {
    if (!brandFrame) brandFrame = requestAnimationFrame(() => { brandFrame = 0; updateBrand(); });
  };
  window.addEventListener('scroll', scheduleBrand, {passive:true});
  window.addEventListener('resize', scheduleBrand);
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--topbar-h', header.getBoundingClientRect().height + 'px');
    scheduleBrand();
  }).observe(header);
  if (heading) new ResizeObserver(scheduleBrand).observe(heading);
  if (document.fonts) document.fonts.ready.then(scheduleBrand);
  updateBrand();

  // Keep the error page's skip link on its document despite its root-relative base.
  const errorMain = document.querySelector('main[data-page="404"]');
  if (errorMain) document.querySelector('.skip-link').addEventListener('click', e => {
    e.preventDefault();
    errorMain.scrollIntoView({block:'start'});
    errorMain.focus({preventScroll:true});
  });
  let searchWasOpen = !search.hidden;
  new MutationObserver(() => {
    const searchIsOpen = !search.hidden;
    if (searchIsOpen === searchWasOpen) return;
    searchWasOpen = searchIsOpen;
    if (searchIsOpen) closeNav();
    refreshInert();
    if (search.hidden) searchButton.focus();
  }).observe(search, {attributes:true, attributeFilter:['hidden']});
  if (lightbox) new MutationObserver(() => {
    if (!lightbox.hidden) closeNav();
    refreshInert();
  }).observe(lightbox, {attributes:true, attributeFilter:['hidden']});
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const panel = document.querySelector('.lightbox:not([hidden]), .pg-search:not([hidden])') || (drawerOpen() ? header : null);
    if (!panel) return;
    const focusable = [...panel.querySelectorAll('a, button, input, summary, [tabindex="0"]')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.disabled && !el.closest('[inert]'));
    const first = focusable[0], last = focusable.at(-1);
    if (!first) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
});
