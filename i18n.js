// ==========================================================
// Hebrew / English language switch
// Hebrew is the source text in index.html; English lives in the dictionary below.
//   data-i18n="key"                  -> translates the element's content (HTML allowed)
//   data-i18n-attr="alt:key; ..."    -> translates attributes
// A key with no English entry keeps its Hebrew text, so a new row never breaks.
// Language order: ?lang=en|he in the link, then the saved choice, then Hebrew.
// The inline script in <head> applies it before first paint; the switch saves the choice.
// Numbers, ₪ figures and screenshots never flip: they are marked .num / dir=ltr in the markup.
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
      'ui.skip': 'Skip to content',
      'ui.navLabel': 'Main',

      'meta.title': 'Yarden Rozen | Economist &amp; Data Analyst',

      'nav.brand': 'Yarden Rozen',
      'nav.apps': 'Live apps',
      'nav.work': 'Earlier work',
      'nav.about': 'About',
      'nav.contact': 'Contact',

      'hero.who': '<b>Yarden Rozen</b> · Economist &amp; Data Analyst',
      'hero.title': 'From budget to <span class="hl">decision.</span>',
      'hero.sub': 'I build live models for budget control, costing and financial performance, from ERP data to the decision.',
      'hero.toApps': 'See the live apps',
      'hero.stackLabel': 'The three live apps',
      'hero.altBudget': 'Illustration: budget control system',
      'hero.altPricing': 'Pricing and profitability simulator',
      'hero.altSupply': 'Supply chain and logistics dashboard',

      'cv.download': 'Download CV',
      'cv.file': 'cv/Yarden-Rozen-CV.pdf',
      'cv.filename': 'Yarden Rozen.pdf',

      'apps.title': 'Three live apps',
      'apps.lead': 'Financial tools running live, built with Python and Streamlit. Entry takes an access code, which is in my CV.',
      'apps.open': 'Open the app',
      'apps.code': 'The access code is in my CV.',
      'apps.cvLink': 'Download',

      'kpi.variance': 'Variance',
      'kpi.over': 'over budget',

      'p1.alt': 'Illustration: budget control dashboard showing budget, actuals and expense breakdown',
      'p1.category': 'FP&amp;A · Dashboard',
      'p1.title': 'Budget Control System, Drill-Down',
      'p1.desc':
        'An interactive dashboard for finance managers (FP&amp;A) to analyze variances, ' +
        'track the budget burn rate (Run-Rate) and drill down to individual journal entries.',
      'p1.kpiBudget': 'Budget (₪M)',
      'p1.kpiActual': 'Actual (₪M)',
      'p1.kpiNote': 'Sample data for illustration',

      'pricing.alt': 'Pricing and profitability simulator: operating profit, break-even point, contribution margin and unit cost structure',
      'pricing.category': 'Costing · Simulator',
      'pricing.title': 'Pricing &amp; Profitability Feasibility Simulator',
      'pricing.desc':
        'An industrial-grade financial simulator built with Python and Streamlit, ' +
        'featuring granular costing, break-even analysis and stress tests.',
      'pricing.kpiProfit': 'Operating profit (₪K)',
      'pricing.kpiBreakEven': 'Break-even (units)',
      'pricing.kpiMargin': 'Contribution margin',
      'pricing.kpiSafety': 'Margin of safety',
      'pricing.kpiNote': "The simulator's default scenario",

      'supply.alt': 'Supply chain dashboard: budget vs. actual, variance by distribution center and monthly trend',
      'supply.category': 'FMCG · Logistics',
      'supply.title': 'Supply Chain &amp; Logistics Dashboard',
      'supply.desc':
        'An interactive, bilingual financial dashboard for an FMCG company. Profit-center budget control, ' +
        'warehouse productivity analysis, and a Headcount Optimizer that calculates net savings ' +
        'and FTE reduction from logistics volume forecasts.',
      'supply.kpiBudget': 'Budget (₪M)',
      'supply.kpiActual': 'Actual (₪M)',
      'supply.kpiNote': 'FY2025 figures from the dashboard',

      'work.title': 'Earlier work',
      'work.lead': 'Earlier projects in Tableau, SQL, Python and Excel.',
      'work.colProject': 'Project',
      'work.colField': 'Field',
      'work.colTools': 'Tools',
      'work.onRequest': 'On request',

      'p2.category': 'BI · Dashboard',
      'p2.title': 'Retail Performance &amp; Pricing Dashboard',
      'p2.desc': 'Sales, margins, quantities and conversion rates, with views of product and regional performance.',

      'p3.category': 'Data analysis',
      'p3.title': 'Online Stores Product Range',
      'p3.desc': 'Cleaning, processing and modeling in Python to surface insights, with recommendations and next steps.',

      'p4.category': 'Data cleaning',
      'p4.title': 'Data Cleaning &amp; Analysis in SQL',
      'p4.desc': 'Preparing the Nashville Housing real-estate dataset, plus a trends-by-region dashboard.',

      'p5.category': 'Reporting · Dashboard',
      'p5.title': 'Data Analysis &amp; Dashboards in Excel',
      'p5.desc': 'Analysis and routine reporting in the tool most organizations run on.',

      'about.title': 'About',
      'about.alt': 'Yarden Rozen',
      'about.lead': 'Economist and data analyst, specializing in budget control, costing and financial performance analysis.',
      'about.body':
        'I turn raw ERP data into interactive dashboards and automated tools that help finance managers ' +
        'spot variances, forecast trends and make data-driven decisions, faster.',
      'about.tkAnalysis': 'Analysis &amp; modeling',
      'about.tkViz': 'Visualization',
      'about.tkFinance': 'Finance systems',
      'about.erp': 'ERP systems',

      'contact.title': "Let's talk.",
      'contact.text': 'Open to opportunities in FP&amp;A, budget control and data analysis.',

      'footer.rights': 'Yarden Rozen. All rights reserved.',
      'footer.top': 'Back to top',
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
    updateSwitch(lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  };

  // ---------- Switch button ----------
  const button = document.querySelector('.lang');

  function updateSwitch(active) {
    if (!button) return;
    button.dataset.active = active;   // moves the Hunter block (CSS)
    button.setAttribute('aria-label', translations[active]['ui.switchTo']);
  }

  const save = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode: just don't remember */ }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = null;

  const switchTo = (lang) => {
    save(lang);
    updateSwitch(lang);                 // the block glides at once, as feedback for the click
    if (reduceMotion.matches) { apply(lang); return; }
    // Fade the content out, swap language and direction while hidden, fade back in
    clearTimeout(pending);
    root.classList.add('is-lang-switching');
    pending = setTimeout(() => {
      apply(lang);
      requestAnimationFrame(() => root.classList.remove('is-lang-switching'));
    }, 200);
  };

  if (button) {
    button.addEventListener('click', () => switchTo(button.dataset.active === 'he' ? 'en' : 'he'));
  }

  // Runs at the end of <body>, so the page is parsed: translate before first paint
  if (current === 'en') apply('en');
  else updateSwitch('he');

  window.i18n = { t, get lang() { return current; } };
})();
