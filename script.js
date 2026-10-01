// Mark JS as available so reveal animations only hide content when they can run
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('nav-menu');
  const links = document.querySelectorAll('.nav__link');

  // ---------- Header background on scroll ----------
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Mobile menu ----------
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', window.i18n.t(open ? 'ui.menuClose' : 'ui.menuOpen'));
  };

  setMenu(false);
  document.addEventListener('langchange', () => setMenu(menu.classList.contains('is-open')));
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  links.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // ---------- Profile picture fallback ----------
  const avatar = document.querySelector('.avatar');
  const avatarImg = document.querySelector('.avatar__img');
  if (avatar && avatarImg) {
    const showPlaceholder = () => avatar.classList.add('is-placeholder');
    avatarImg.addEventListener('error', showPlaceholder);
    if (avatarImg.complete && avatarImg.naturalWidth === 0) showPlaceholder();
  }

  // ---------- Project screenshots ----------
  // A missing image shows the placeholder if the frame defines one, otherwise the frame is removed.
  document.querySelectorAll('.project-card__media').forEach((figure) => {
    const img = figure.querySelector('img');
    if (!img) return;
    const onMissing = () => {
      if (figure.dataset.placeholder) figure.classList.add('is-placeholder');
      else figure.remove();
    };
    img.addEventListener('error', onMissing);
    if (img.complete && img.naturalWidth === 0) onMissing();
  });

  // ---------- Links to files that may not be uploaded yet (e.g. the CV) ----------
  // Hidden on the live site until the file exists. Skipped on file://, where fetch is blocked.
  if (location.protocol.startsWith('http')) {
    document.querySelectorAll('[data-requires-file]').forEach((link) => {
      fetch(link.href, { method: 'HEAD' })
        .then((res) => { if (!res.ok) link.hidden = true; })
        .catch(() => { link.hidden = true; });
    });
  }

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ---------- Active nav link ----------
  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) =>
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  // ---------- Footer year ----------
  document.getElementById('year').textContent = new Date().getFullYear();
});
