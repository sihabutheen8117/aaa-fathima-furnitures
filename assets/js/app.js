/* AAA Fathima Furniture site behaviour: a small single-page shop.
 *
 * Every screen has its own address in the URL hash, so links can be shared
 * and the phone's back button moves between screens like in an app:
 *   #/               home: banner and categories
 *   #/c/<category>   products in one category (#/c/all = every product)
 *   #/search/<text>  search results
 *   #mw-203          one product (same format as links shared from the old site)
 *   #/enquiry  #/about  #/contact
 */
(function () {
  'use strict';

  const { SITE, CATEGORIES, PRODUCTS } = window.MW_DATA;
  const D = window.MWDraw;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const modelNum = (id) => parseInt(id.replace(/\D/g, ''), 10);
  const catOrder = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i]));
  const SORTED = PRODUCTS.slice().sort((a, b) => catOrder[a.cat] - catOrder[b.cat] || modelNum(a.id) - modelNum(b.id));
  const inCat = (id) => SORTED.filter((p) => id === 'all' || p.cat === id);
  const lowerName = (name) => name.replace(/^(?!TV)\w/, (c) => c.toLowerCase());

  /* ---------- helpers ---------- */
  const titleOf = (p) => (p.cat === 'bedroom-set' ? `${p.name} bedroom set` : catById[p.cat].single);
  const fmtDims = (d) => {
    if (!d) return '';
    const parts = [];
    if (d.h != null) parts.push('H.' + d.h);
    if (d.d != null) parts.push('D.' + d.d);
    if (d.w != null) parts.push('W.' + d.w);
    return parts.join(' | ');
  };
  const sizeLine = (p) => fmtDims(p.dims) || (p.components ? '4-piece set' : 'Size on request');
  const cm = (inches) => Math.round(inches * 2.54);
  const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  function openExternal(url) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  const ICON_PLUS = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const ICON_CHECK = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  const svgCache = new Map();
  function drawing(p, opts = {}) {
    if (p.photo) return `<img src="${esc(p.photo)}" alt="${opts.label === '' ? '' : esc(titleOf(p) + ' ' + p.id)}" loading="lazy">`;
    const key = p.id + JSON.stringify(opts);
    if (!svgCache.has(key)) {
      svgCache.set(key, D.render(p.art, Object.assign({ seed: p.id, label: `${titleOf(p)} ${p.id}` }, opts)));
    }
    return svgCache.get(key);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    // an open dialog sits in the browser's top layer, so the toast has to live inside it to be seen
    const host = $('dialog[open]') || document.body;
    if (t.parentNode !== host) host.appendChild(t);
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- static bits ---------- */
  document.body.insertAdjacentHTML('afterbegin', D.defs());
  $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
  $('#year').textContent = new Date().getFullYear();

  let mapLoaded = false;
  function loadMap() {
    // only fetch Google Maps when someone opens the contact screen
    if (mapLoaded) return;
    mapLoaded = true;
    $('#map-frame').src = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed`;
  }

  /* ---------- enquiry list (the "cart") ---------- */
  const STORE_KEY = 'aaafathima-enquiry-v1';
  let enquiry = [];
  try { enquiry = (JSON.parse(localStorage.getItem(STORE_KEY)) || []).filter((i) => byId[i.id]); } catch (e) { enquiry = []; }
  const inList = (id) => enquiry.some((i) => i.id === id);

  function saveList() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(enquiry)); } catch (e) { /* storage unavailable: list lasts for this visit */ }
    renderCounts();
    syncAddButtons();
    renderFormList();
    if (current && current.view === 'enquiry') renderEnquiry();
  }
  function addToList(id) {
    const item = enquiry.find((i) => i.id === id);
    if (item) item.qty += 1; else enquiry.push({ id, qty: 1 });
    saveList();
    $$('[data-count]').forEach((c) => { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); });
    toast(`${id} added to your enquiry list`);
  }
  function removeFromList(id) {
    enquiry = enquiry.filter((i) => i.id !== id);
    saveList();
    toast(`${id} removed from your enquiry list`);
  }
  function listLines() {
    return enquiry.map((i) => {
      const p = byId[i.id];
      const d = fmtDims(p.dims);
      return `• ${p.id} ${titleOf(p)}${d ? ` (${d})` : ''}, qty ${i.qty}`;
    });
  }

  function renderCounts() {
    const total = enquiry.reduce((s, i) => s + i.qty, 0);
    $$('[data-count]').forEach((c) => { c.textContent = total; c.hidden = total === 0; });
    $('.list-link').setAttribute('aria-label', total ? `Enquiry list, ${total} item${total > 1 ? 's' : ''}` : 'Enquiry list');
  }
  function syncAddButtons() {
    $$('[data-add]').forEach((b) => {
      const on = inList(b.dataset.add);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `Add ${b.dataset.add} to enquiry list`);
      b.innerHTML = on ? `${ICON_CHECK}<span>Added</span>` : `${ICON_PLUS}<span>Add to list</span>`;
    });
    if (current && current.view === 'product') {
      $('#pd-add').textContent = inList(current.id) ? 'Added. View enquiry list' : 'Add to enquiry list';
    }
  }
  function renderFormList() {
    const box = $('#form-list');
    box.hidden = enquiry.length === 0;
    box.innerHTML = enquiry.length
      ? `Your enquiry list will be added to this message: <b>${enquiry.map((i) => esc(i.id) + (i.qty > 1 ? ' &times;' + i.qty : '')).join(', ')}</b>`
      : '';
  }

  // "Add to list" buttons on product cards, wherever they appear
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    if (inList(b.dataset.add)) removeFromList(b.dataset.add); else addToList(b.dataset.add);
  });

  /* ---------- product card ---------- */
  function card(p) {
    return `<li class="card">
      <a class="card-link" href="#${p.id.toLowerCase()}">
        <span class="card-img">${drawing(p, { label: '' })}</span>
        <span class="card-text">
          <span class="card-name">${esc(p.cat === 'bedroom-set' ? p.name + ' set' : catById[p.cat].single)}</span>
          <span class="card-model">${p.id}</span>
          <span class="card-dims">${esc(sizeLine(p))}</span>
        </span>
      </a>
      <button class="card-add" type="button" data-add="${p.id}" aria-pressed="false"></button>
    </li>`;
  }

  /* ---------- home ---------- */
  let homeReady = false;
  function renderHome() {
    if (homeReady) return;
    homeReady = true;
    $$('[data-art]').forEach((el) => { el.innerHTML = drawing(byId[el.dataset.art], { pad: 0.02, label: '' }); });
    $('[data-mark]').innerHTML = D.logoMark();
    $('#cats').innerHTML = CATEGORIES.map((c) => `<li><a class="cat" href="#/c/${c.id}">
        <span class="cat-img">${drawing(byId[c.rep], { pad: 0.03, label: '' })}</span>
        <span class="cat-name">${esc(c.name)}</span></a></li>`).join('') +
      `<li><a class="cat cat-all" href="#/c/all"><span class="cat-img">${D.logoMark()}</span><span class="cat-name">All products</span></a></li>`;
    initBanner();
  }

  function initBanner() {
    const track = $('#slides');
    const banner = track.parentElement;
    const slides = $$('.slide', track);
    const dots = $('#dots');
    dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Show slide ${i + 1}"></button>`).join('');
    const dotBtns = $$('button', dots);
    let index = 0;
    let raf = 0;
    let holdUntil = 0;

    const show = (i, smooth = true) => {
      index = (i + slides.length) % slides.length;
      track.scrollTo({ left: index * track.clientWidth, behavior: smooth && !reduceMotion ? 'smooth' : 'instant' });
    };
    const sync = () => {
      index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      dotBtns.forEach((d, j) => d.setAttribute('aria-current', String(j === index)));
      banner.classList.toggle('is-dark', slides[index].classList.contains('slide-premium'));
    };
    const pause = () => { holdUntil = Date.now() + 12000; };

    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    dots.addEventListener('click', (e) => { const i = dotBtns.indexOf(e.target.closest('button')); if (i >= 0) { pause(); show(i); } });
    $('.banner-prev').addEventListener('click', () => { pause(); show(index - 1); });
    $('.banner-next').addEventListener('click', () => { pause(); show(index + 1); });
    ['pointerdown', 'focusin'].forEach((t) => banner.addEventListener(t, pause, { passive: true }));
    window.addEventListener('resize', () => show(index, false));
    if (!reduceMotion) {
      setInterval(() => {
        if (Date.now() < holdUntil || document.hidden || !current || current.view !== 'home') return;
        show(index + 1);
      }, 5000);
    }
    sync();
  }

  /* ---------- product list: category, all products or search ---------- */
  const norm = (s) => s.toLowerCase().replace(/[\s\-_.]/g, '');
  function matches(p, q) {
    const hay = norm([p.id, p.name || '', titleOf(p), catById[p.cat].name, p.finish || '', p.series || '',
      (p.components || []).map((c) => c.code + ' ' + c.name).join(' ')].join(' '));
    return q.split(/\s+/).filter(Boolean).every((w) => hay.includes(norm(w)));
  }

  function renderList(route) {
    const isSearch = route.q != null;
    let list, title, sub;
    if (isSearch) {
      list = SORTED.filter((p) => matches(p, route.q));
      title = 'Search results';
      sub = list.length ? `${list.length} ${list.length === 1 ? 'model matches' : 'models match'} “${route.q}”` : '';
    } else {
      list = inCat(route.cat);
      title = route.cat === 'all' ? 'All products' : catById[route.cat].name;
      sub = `${list.length} ${list.length === 1 ? 'model' : 'models'}`;
    }
    $('#list-title').textContent = title;
    $('#list-sub').textContent = sub;

    const chips = $('#list-chips');
    chips.hidden = isSearch;
    if (!isSearch) {
      chips.innerHTML = [{ id: 'all', name: 'All' }].concat(CATEGORIES).map((c) =>
        `<a class="chip" href="#/c/${c.id}" data-chip${c.id === route.cat ? ' aria-current="page"' : ''}>${esc(c.name)}</a>`).join('');
      // keep the current category's chip in view (scrolls the chip strip only, never the page)
      const on = $('[aria-current="page"]', chips);
      if (on) chips.scrollLeft += on.getBoundingClientRect().left - chips.getBoundingClientRect().left - 16;
    }

    $('#list-grid').innerHTML = list.map(card).join('');
    $('#list-empty').hidden = list.length > 0;
    $('#list-empty-q').textContent = `“${route.q || ''}”`;
    syncAddButtons();
  }

  /* ---------- product detail ---------- */
  function dimsTable(d) {
    const rows = [['Height', d.h], ['Depth', d.d], ['Width', d.w]];
    return `<table class="dims-table"><tbody>${rows.map(([k, v]) =>
      `<tr><th scope="row">${k}</th><td>${v != null ? `${v} in<span>${cm(v)} cm</span>` : '<span>Ask us</span>'}</td></tr>`).join('')}</tbody></table>`;
  }
  const specList = (specs) => Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  function componentsTable(p) {
    return `<table class="components">
      <thead><tr><th scope="col">Code</th><th scope="col">Piece</th><th scope="col">Size (inches)</th></tr></thead>
      <tbody>${p.components.map((c) => `<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${esc(fmtDims(c.dims))}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderProduct(id) {
    const p = byId[id];
    const cat = catById[p.cat];
    const title = titleOf(p);
    const crumb = $('#pd-crumb');
    crumb.textContent = cat.name;
    crumb.setAttribute('href', `#/c/${p.cat}`);

    const dimsKnown = p.dims && (p.dims.h != null || p.dims.d != null || p.dims.w != null);
    $('#pd-figure').innerHTML = drawing(p, dimsKnown ? { dims: p.dims, pad: 0.02 } : { pad: 0.04 });
    $('#pd-tag').innerHTML = `<b>MW - ${modelNum(p.id)}</b><span>${esc(p.cat === 'bedroom-set' ? p.name : cat.single)}</span>`;
    $('#pd-title').textContent = p.cat === 'bedroom-set' ? `${p.name} bedroom set` : `${title} ${p.id}`;
    $('#pd-finish').textContent = p.finish || '';

    let detail = '';
    if (p.components) {
      detail += `<p class="quote">&ldquo;${esc(p.quote)}&rdquo;</p>`;
      detail += componentsTable(p);
      detail += `<dl class="pd-specs">${specList(p.specs)}</dl>`;
    } else {
      detail += p.dims ? dimsTable(p.dims) : '<p class="pd-note">Sizes for this model are not printed in the catalogue. Ask us on WhatsApp and we will send them.</p>';
      if (p.dims && (p.dims.h == null || p.dims.d == null || p.dims.w == null)) detail += '<p class="pd-note">Some sizes for this model are not printed in the catalogue. Ask us for the full measurements.</p>';
      detail += `<dl class="pd-specs">${specList({ Material: 'Particle board', Assembly: 'Easy assembly' })}</dl>`;
    }
    $('#pd-detail').innerHTML = detail;

    const d = fmtDims(p.dims);
    $('#pd-wa').href = waLink(`Hello ${SITE.name}, I'm interested in ${p.cat === 'bedroom-set' ? `the ${p.name} bedroom set` : `the ${title.toLowerCase()}`} ${p.id}${d ? ` (${d})` : ''}. Could you share the price and availability?`);

    const others = inCat(p.cat).filter((x) => x.id !== p.id);
    $('#pd-more').hidden = others.length === 0;
    $('#pd-more-title').textContent = `More ${lowerName(cat.name)}`;
    $('#pd-more-list').innerHTML = others.map(card).join('');
    $('#pd-more-list').scrollLeft = 0;
    syncAddButtons();
  }

  $('#pd-add').addEventListener('click', () => {
    if (inList(current.id)) go('#/enquiry'); else addToList(current.id);
  });
  $('#pd-share').addEventListener('click', async () => {
    const url = location.href.split('#')[0] + '#' + current.id.toLowerCase();
    const title = `${$('#pd-title').textContent} | ${SITE.name}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch (e) { /* share sheet closed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied. Paste it into a chat to share this model.');
    } catch (e) {
      toast('Copy is blocked in this browser. The link is in the address bar.');
    }
  });

  /* ---------- enquiry screen ---------- */
  function renderEnquiry() {
    $('#eq-items').innerHTML = enquiry.map((i) => {
      const p = byId[i.id];
      return `<li class="eq-item">
        <a class="eq-thumb" href="#${p.id.toLowerCase()}" aria-label="View ${esc(p.id)}">${drawing(p, { label: '' })}</a>
        <div class="eq-meta"><b>${esc(p.id)}</b><span>${esc(titleOf(p))}</span><span>${esc(sizeLine(p))}</span>
          <button class="link-btn" type="button" data-remove="${esc(p.id)}">Remove</button></div>
        <div class="qty" role="group" aria-label="Quantity of ${esc(p.id)}">
          <button type="button" data-qty="-1" data-id="${esc(p.id)}" aria-label="One fewer ${esc(p.id)}">&minus;</button>
          <output aria-live="polite">${i.qty}</output>
          <button type="button" data-qty="1" data-id="${esc(p.id)}" aria-label="One more ${esc(p.id)}">+</button>
        </div>
      </li>`;
    }).join('');
    $('#eq-empty').hidden = enquiry.length > 0;
    $('#eq-form').hidden = enquiry.length === 0;
  }

  $('#eq-items').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { removeFromList(rm.dataset.remove); return; }
    const q = e.target.closest('[data-qty]');
    if (!q) return;
    const item = enquiry.find((i) => i.id === q.dataset.id);
    if (!item) return;
    item.qty += Number(q.dataset.qty);
    if (item.qty < 1) { removeFromList(item.id); return; }
    saveList();
    const again = $(`[data-qty="${q.dataset.qty}"][data-id="${q.dataset.id}"]`);
    if (again) again.focus();
  });
  $('#eq-clear').addEventListener('click', () => {
    enquiry = [];
    saveList();
    toast('Enquiry list cleared');
  });
  $('#eq-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enquiry.length) return;
    const name = $('#eq-name').value.trim();
    const place = $('#eq-place').value.trim();
    const lines = [`Hello ${SITE.name},`, 'Please share the price and availability for:', ...listLines()];
    if (name || place) lines.push('');
    if (name) lines.push(`Name: ${name}`);
    if (place) lines.push(`Place: ${place}`);
    openExternal(waLink(lines.join('\n')));
  });

  /* ---------- contact form ---------- */
  $('#enquiry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#f-name');
    const err = $('#f-name-error');
    if (!name.value.trim()) {
      name.setAttribute('aria-invalid', 'true');
      name.setAttribute('aria-describedby', 'f-name-error');
      err.hidden = false;
      name.focus();
      return;
    }
    name.removeAttribute('aria-invalid');
    err.hidden = true;
    const place = $('#f-place').value.trim();
    const msg = $('#f-message').value.trim();
    const lines = [`Hello ${SITE.name},`, msg || 'I would like to know more about your furniture.'];
    if (enquiry.length) lines.push('', 'Models I am interested in:', ...listLines());
    lines.push('', `Name: ${name.value.trim()}`, `I am a: ${$('#f-role').value}`);
    if (place) lines.push(`Place: ${place}`);
    openExternal(waLink(lines.join('\n')));
  });
  $('#f-name').addEventListener('input', (e) => {
    if (e.target.value.trim()) { e.target.removeAttribute('aria-invalid'); $('#f-name-error').hidden = true; }
  });

  /* ---------- menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('#menu-btn');
  $('#menu-cats').innerHTML = CATEGORIES.map((c) => `<a href="#/c/${c.id}">${esc(c.name)} <small>${inCat(c.id).length}</small></a>`).join('') +
    `<a href="#/c/all">All products <small>${PRODUCTS.length}</small></a>`;
  menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); });
  menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
  menu.addEventListener('click', (e) => { if (e.target === menu || e.target.closest('[data-close-menu]')) menu.close(); });

  /* ---------- router ---------- */
  const VIEWS = ['home', 'list', 'product', 'enquiry', 'about', 'contact'];
  const TAB = { home: 'home', list: 'home', product: 'home', enquiry: 'enquiry', about: 'about', contact: 'contact' };
  let current = null;

  function parse(hash) {
    let h = String(hash || '').replace(/^#/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* keep it as typed */ }
    if (/^mw-\d+$/i.test(h) && byId[h.toUpperCase()]) return { view: 'product', id: h.toUpperCase() };
    const [head, ...rest] = h.replace(/^\//, '').split('/');
    const arg = rest.join('/').trim();
    if (head === 'c' && (arg === 'all' || catById[arg])) return { view: 'list', cat: arg };
    if (head === 'search' && arg) return { view: 'list', q: arg };
    if (['enquiry', 'about', 'contact'].includes(head)) return { view: head };
    // section links from the old one-page site
    if (head === 'catalogue') return { view: 'list', cat: 'all' };
    if (head === 'bedroom-sets') return { view: 'list', cat: 'bedroom-set' };
    if (head === 'materials') return { view: 'about' };
    return { view: 'home' };
  }

  function pageTitle(r) {
    const brand = SITE.name;
    switch (r.view) {
      case 'list': return `${r.q != null ? `Search: ${r.q}` : r.cat === 'all' ? 'All products' : catById[r.cat].name} | ${brand}`;
      case 'product': return `${$('#pd-title').textContent} | ${brand}`;
      case 'enquiry': return `Enquiry list | ${brand}`;
      case 'about': return `About us | ${brand}`;
      case 'contact': return `Contact us | ${brand}`;
      default: return `${brand} | Wardrobes, bedroom sets and storage from Kollam`;
    }
  }

  const q = $('#q');
  function render(route) {
    current = route;
    VIEWS.forEach((v) => { $('#view-' + v).hidden = v !== route.view; });
    document.body.dataset.view = route.view;
    if (route.view === 'home') renderHome();
    else if (route.view === 'list') renderList(route);
    else if (route.view === 'product') renderProduct(route.id);
    else if (route.view === 'enquiry') renderEnquiry();
    else if (route.view === 'contact') loadMap();
    $$('[data-tab]').forEach((a) => {
      const on = a.dataset.tab === TAB[route.view];
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (document.activeElement !== q) q.value = route.q || '';
    document.title = pageTitle(route);
  }

  /* history: each screen is a history entry; scroll position is remembered per entry */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const scrolls = new Map();
  let seq = Date.now();
  let entry = history.state && history.state.n;
  if (!entry) { entry = ++seq; history.replaceState({ n: entry }, ''); }
  const firstEntry = entry;
  const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  const focusTitle = () => { const t = $(`#view-${current.view} [data-view-title]`); if (t) t.focus({ preventScroll: true }); };

  function go(hash, opts = {}) {
    const here = location.hash || '#/';
    if (hash === here) { jump(0); return; }               // same screen: just back to the top
    scrolls.set(entry, window.scrollY);
    if (opts.replace) history.replaceState({ n: entry }, '', hash);
    else { entry = ++seq; history.pushState({ n: entry }, '', hash); }
    render(parse(hash));
    jump(0);
    if (!opts.noFocus) focusTitle();
  }

  window.addEventListener('popstate', (e) => {
    scrolls.set(entry, window.scrollY);
    if (e.state && e.state.n) entry = e.state.n;
    else { entry = ++seq; history.replaceState({ n: entry }, ''); }   // hash typed into the address bar
    if (menu.open) menu.close();
    render(parse(location.hash));
    jump(scrolls.get(entry) || 0);
  });

  // in-page links become screen changes
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    e.preventDefault();
    if (href === '#main') { $('#main').focus(); return; }   // skip link
    if (menu.open) menu.close();
    go(href === '#' ? '#/' : href, { replace: a.hasAttribute('data-chip') });
  });

  // on-screen back arrows behave like the phone's back button while there is somewhere to go back to
  const parentOf = (r) => (r.view === 'product' ? `#/c/${byId[r.id].cat}` : '#/');
  $$('[data-back]').forEach((b) => b.addEventListener('click', () => {
    if (entry !== firstEntry) history.back();
    else go(parentOf(current), { replace: true });
  }));

  /* ---------- search ---------- */
  let searchTimer;
  function runSearch() {
    const v = q.value.trim();
    const onSearch = current.view === 'list' && current.q != null;
    if (!v) {
      if (onSearch) { if (entry !== firstEntry) history.back(); else go('#/', { replace: true, noFocus: true }); }
      return;
    }
    if (onSearch && current.q === v) return;
    go('#/search/' + encodeURIComponent(v), { replace: onSearch, noFocus: true });
  }
  q.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 250); });
  $('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(searchTimer);
    runSearch();
    q.blur();   // closes the phone keyboard so the results are visible
  });

  /* ---------- start ---------- */
  renderCounts();
  renderFormList();
  render(parse(location.hash));
})();
