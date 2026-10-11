// The inline script in <head> adds the "js" class, so reveal animations only hide content when they can run.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('nav-menu');
  const links = [...document.querySelectorAll('.nav__link')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const t = (key) => (window.i18n ? window.i18n.t(key) : '');

  // ---------- Header rule once the page scrolls ----------
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Mobile menu ----------
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', t(open ? 'ui.menuClose' : 'ui.menuOpen'));
  };
  setMenu(false);
  document.addEventListener('langchange', () => setMenu(menu.classList.contains('is-open')));
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  links.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });

  // ---------- Links to files that may not be uploaded yet (the CVs) ----------
  // Hidden on the live site until the file exists; re-checked when the language (and so the file) changes.
  // Skipped on file://, where fetch is blocked.
  const checkFiles = () => {
    if (!location.protocol.startsWith('http')) return;
    document.querySelectorAll('[data-requires-file]').forEach((link) => {
      fetch(link.href, { method: 'HEAD' })
        .then((res) => { link.hidden = !res.ok; })
        .catch(() => { link.hidden = true; });
    });
  };
  checkFiles();
  document.addEventListener('langchange', checkFiles);

  // ---------- KPI count-up: once, on first view; tabular digits so nothing shifts ----------
  const format = (value, dec) =>
    value.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const countUp = (el) => {
    if (reduceMotion.matches) return;
    const end = parseFloat(el.dataset.count);
    const dec = Number(el.dataset.dec) || 0;
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + format(end * eased, dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---------- Scroll reveals ----------
  // Observe wrappers, never the clipped image itself: a fully clipped element never counts as visible.
  const targets = document.querySelectorAll('.reveal, .reveal-img, .kpis');
  const show = (el) => {
    el.classList.add('is-in');
    if (el.matches('.kpis')) el.querySelectorAll('[data-count]').forEach(countUp);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((el) => observer.observe(el));
  } else {
    targets.forEach(show);
  }

  // ---------- Active nav link ----------
  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  // ---------- Footer year ----------
  document.getElementById('year').textContent = new Date().getFullYear();

  root.classList.add('is-ready');
});
