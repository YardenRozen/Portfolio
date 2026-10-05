// ==========================================================
// Hebrew / English language switch
// Hebrew is the source text in index.html; English lives in the dictionary below.
//   data-i18n="key"                  -> translates the element's content (HTML allowed)
//   data-i18n-attr="alt:key; ..."    -> translates attributes
// A key with no English entry keeps its Hebrew text, so a new card never breaks.
// The choice is saved in localStorage; the inline script in <head> applies it before first paint.
// ==========================================================
(() => {
  const STORAGE_KEY = 'lang';
  const DIRECTION = { he: 'rtl', en: 'ltr' };

  const translations = {
    // Hebrew strings used only by JavaScript (everything else is read from the page)
    he: {
      'ui.menuOpen': 'פתח תפריט',
      'ui.menuClose': 'סגור תפריט',
      'ui.switchTo': 'Switch to English',
    },
    en: {
      'ui.menuOpen': 'Open menu',
      'ui.menuClose': 'Close menu',
      'ui.switchTo': 'החלפה לעברית',

      'meta.title': 'Yarden Rozen | Economist &amp; Data Analyst',

      'nav.brand': 'Yarden<span class="gradient-text">.</span>Rozen',
      'nav.about': 'About',
      'nav.skills': 'Tech Stack',
      'nav.projects': 'Portfolio',
      'nav.contact': 'Contact',

      'hero.eyebrow': 'About',
      'hero.name': 'Yarden Rozen',
      'hero.subtitle': 'Economist &amp; Data Analyst',
      'hero.summary':
        'Economist and data analyst specializing in budget control, costing and financial performance analysis. ' +
        'I turn raw ERP data into interactive dashboards and automated tools that help finance managers ' +
        'spot variances, forecast trends and make data-driven decisions — faster.',
      'hero.cv': 'Download CV',
      'cv.file': 'cv/Yarden-Rozen-CV.pdf',
      'cv.filename': 'Yarden Rozen.pdf',
      'hero.toProjects': 'View Portfolio',
      'hero.toContact': 'Get in Touch',
      'hero.initials': 'YR',

      'skills.eyebrow': 'Toolbox',
      'skills.title': 'Tech Stack',
      'skills.erp': 'ERP Systems',

      'projects.eyebrow': 'Selected Work',
      'projects.title': 'Portfolio',

      'cta.tableau': 'View on Tableau',

      'p1.placeholder': 'Dashboard screenshot coming soon',
      'p1.alt': 'Illustration: budget control dashboard showing budget, actuals and expense breakdown',
      'p1.category': 'FP&amp;A · Dashboard',
      'p1.title': 'Budget Control System — Drill-Down',
      'p1.desc':
        'An interactive dashboard for finance managers (FP&amp;A) to analyze variances, ' +
        'track the budget burn rate (Run-Rate) and drill down to individual journal entries.',
      'p1.kpiBudget': 'Budget <span class="kpi__unit">(₪M)</span>',
      'p1.kpiActual': 'Actual <span class="kpi__unit">(₪M)</span>',
      'p1.kpiVariance': 'Variance',
      'p1.kpiHint': 'over budget',
      'p1.kpiNote': 'Sample data for illustration',
      'p1.cta': 'View Live Project',

      'pricing.placeholder': 'Simulator screenshot coming soon',
      'pricing.alt': 'Pricing and profitability simulator: operating profit, break-even point, contribution margin and unit cost structure',
      'pricing.category': 'Costing · Simulator',
      'pricing.title': 'Pricing &amp; Profitability Feasibility Simulator',
      'pricing.desc':
        'Enterprise-grade financial simulator built with Python &amp; Streamlit, ' +
        'featuring granular costing, break-even analysis, and stress tests.',
      'pricing.kpiProfit': 'Operating profit <span class="kpi__unit">(₪K)</span>',
      'pricing.kpiBreakEven': 'Break-even <span class="kpi__unit">(units)</span>',
      'pricing.kpiMargin': 'Contribution margin',
      'pricing.kpiSafety': 'Margin of safety',
      'pricing.kpiNote': "The simulator's default scenario",
      'pricing.cta': 'View Live Project',

      'supply.placeholder': 'Dashboard screenshot coming soon',
      'supply.alt': 'Supply chain dashboard: budget vs. actual, variance by distribution center and monthly trend',
      'supply.category': 'FMCG · Logistics',
      'supply.title': 'Supply Chain &amp; Logistics Dashboard',
      'supply.desc':
        'An interactive, bilingual financial dashboard for an FMCG enterprise. Features budget variance tracking, ' +
        'warehouse productivity analysis, and a dynamic Headcount Optimizer simulator calculating net savings ' +
        'and FTE reduction based on logistics volume forecasts.',
      'supply.kpiBudget': 'Budget <span class="kpi__unit">(₪M)</span>',
      'supply.kpiActual': 'Actual <span class="kpi__unit">(₪M)</span>',
      'supply.kpiVariance': 'Variance',
      'supply.kpiHint': 'over budget',
      'supply.kpiNote': 'FY2025 figures from the dashboard',
      'supply.cta': 'View Live Project',

      'p2.alt': 'Retail performance and pricing dashboard in Tableau',
      'p2.category': 'BI · Dashboard',
      'p2.title': 'Retail Performance &amp; Pricing Dashboard',
      'p2.desc':
        'An interactive KPI dashboard focused on sales, margins, quantities and conversion rates, ' +
        'with dedicated views of product and regional performance — for fast insights and data-driven decisions.',

      'p3.alt': 'Product range analysis of online stores',
      'p3.category': 'Data Analysis',
      'p3.title': 'Online Stores Product Range Analysis',
      'p3.desc':
        'Data cleaning, processing and modeling in Python to uncover hidden insights in store data, ' +
        'with the results presented in a dashboard alongside recommendations and next steps.',

      'p4.alt': 'Data cleaning and analysis in SQL',
      'p4.category': 'SQL · Data Cleaning',
      'p4.title': 'Data Cleaning &amp; Analysis in SQL',
      'p4.desc':
        'Data cleaning and preparation in SQL on the Nashville Housing real-estate dataset, ' +
        'alongside a Tableau dashboard analyzing trends by region.',

      'p5.alt': 'Data analysis and dashboards in Excel',
      'p5.category': 'Excel · Dashboard',
      'p5.title': 'Data Analysis &amp; Dashboards in Excel',
      'p5.desc':
        'Data analysis and dashboard building in Excel — the most widely used tool in organizations ' +
        'for business analysis and routine reporting.',

      'contact.title': "Let's Talk",
      'contact.text': 'Open to opportunities in FP&amp;A, budget control and data analysis.',

      'footer.rights': 'Yarden Rozen. All rights reserved.',
    },
  };

  const root = document.documentElement;
  const originalHtml = new WeakMap();  // element -> Hebrew innerHTML
  const originalAttrs = new WeakMap(); // element -> { attr: Hebrew value }
  let current = root.lang === 'en' ? 'en' : 'he';

  const t = (key) => translations[current][key] ?? translations.he[key] ?? '';

  const parseAttrs = (spec) =>
    spec.split(';').map((pair) => pair.split(':').map((s) => s.trim())).filter(([attr, key]) => attr && key);

  const apply = (lang) => {
    const dict = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
      const value = lang === 'he' ? originalHtml.get(el) : dict[el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      if (!originalAttrs.has(el)) originalAttrs.set(el, {});
      const saved = originalAttrs.get(el);
      parseAttrs(el.dataset.i18nAttr).forEach(([attr, key]) => {
        if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
        const value = lang === 'he' ? saved[attr] : dict[key];
        if (value != null) el.setAttribute(attr, value);
      });
    });

    current = lang;
    root.lang = lang;
    root.dir = DIRECTION[lang];
    updateSwitch();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  };

  // ---------- Switch button ----------
  const button = document.querySelector('.lang-switch');

  function updateSwitch() {
    if (!button) return;
    const next = current === 'he' ? 'en' : 'he';
    button.lang = next; // the label is read in the language it offers
    button.setAttribute('aria-label', t('ui.switchTo'));
    button.querySelectorAll('[data-lang]').forEach((opt) =>
      opt.classList.toggle('is-active', opt.dataset.lang === current)
    );
  }

  const save = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode: just don't remember */ }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const switchTo = (lang) => {
    save(lang);
    if (reduceMotion.matches) { apply(lang); return; }
    // Fade the content out, swap language and direction while hidden, fade back in
    root.classList.add('is-lang-switching');
    setTimeout(() => {
      apply(lang);
      requestAnimationFrame(() => root.classList.remove('is-lang-switching'));
    }, 180);
  };

  if (button) button.addEventListener('click', () => switchTo(current === 'he' ? 'en' : 'he'));

  // Runs at the end of <body>, so the page is parsed: translate before first paint
  if (current === 'en') apply('en');
  else updateSwitch();

  window.i18n = { t, get lang() { return current; } };
})();
