/* AAA Fathima Furniture site behaviour */
(function () {
  'use strict';

  const { SITE, ROOMS, CATEGORIES, PRODUCTS } = window.MW_DATA;
  const D = window.MWDraw;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const modelNum = (id) => parseInt(id.replace(/\D/g, ''), 10);

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
  const cm = (inches) => Math.round(inches * 2.54);
  const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  function openExternal(url) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  const svgCache = new Map();
  function drawing(p, opts = {}) {
    if (p.photo) return `<img src="${esc(p.photo)}" alt="${esc(titleOf(p) + ' ' + p.id)}" loading="lazy">`;
    const key = p.id + JSON.stringify(opts);
    if (!svgCache.has(key)) {
      svgCache.set(key, D.render(p.art, Object.assign({ seed: p.id, label: `${titleOf(p)} ${p.id}` }, opts)));
    }
    return svgCache.get(key);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    // open dialogs sit in the browser's top layer, so the toast has to live inside them to be seen
    const host = $('dialog[open]') || document.body;
    if (t.parentNode !== host) host.appendChild(t);
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ---------- brand watermarks (tinted by each container's CSS color) ---------- */
  document.body.insertAdjacentHTML('afterbegin', D.defs());
  ['#hero-watermark', '#series-watermark', '#about-watermark'].forEach((s) => { $(s).innerHTML = D.logoMark(); });

  /* ---------- WhatsApp links and map ---------- */
  $$('[data-wa]').forEach((a) => {
    a.href = waLink(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $('#map-frame').src = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed`;
  $('#year').textContent = new Date().getFullYear();

  /* ---------- floating WhatsApp button ---------- */
  // Starts tucked (see index.html) and only shows while no other WhatsApp button is on screen,
  // so on phones it never sits on top of the hero buttons or the enquiry form.
  const fab = $('.fab');
  if ('IntersectionObserver' in window) {
    const onScreen = new Set();
    const fabIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? onScreen.add(en.target) : onScreen.delete(en.target)));
      fab.classList.toggle('is-tucked', onScreen.size > 0);
    });
    ['.hero-actions', '#contact', '.site-footer'].forEach((s) => fabIO.observe($(s)));
  } else {
    fab.classList.remove('is-tucked');
  }

  /* ---------- hero ---------- */
  $('#hero-scene').innerHTML = D.render(byId['MW-251'].art, {
    pieces: true, seed: 'hero', pad: 0.03,
    label: 'Azure Haven bedroom set with dresser, wardrobe, cot and bedside tables',
  });

  /* ---------- header ---------- */
  const header = $('#site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('#menu-btn');
  const nav = $('#site-nav');
  const setMenu = (open) => { menuBtn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });

  const navLinks = $$('.site-nav a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['bedroom-sets', 'catalogue', 'about', 'materials', 'contact', 'top', 'collections'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- enquiry list ---------- */
  const STORE_KEY = 'aaafathima-enquiry-v1';
  let enquiry = [];
  try { enquiry = (JSON.parse(localStorage.getItem(STORE_KEY)) || []).filter((i) => byId[i.id]); } catch (e) { enquiry = []; }
  const inList = (id) => enquiry.some((i) => i.id === id);

  function saveList() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(enquiry)); } catch (e) { /* storage unavailable: list lasts for this visit */ }
    renderListUI();
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

  function renderListUI() {
    const total = enquiry.reduce((s, i) => s + i.qty, 0);
    $$('[data-count]').forEach((c) => { c.textContent = total; c.hidden = total === 0; });
    $$('.list-fab').forEach((b) => { b.hidden = total === 0; });

    const items = $('#eq-items');
    items.innerHTML = enquiry.map((i) => {
      const p = byId[i.id];
      return `<li class="eq-item">
        <div class="eq-thumb">${drawing(p)}</div>
        <div class="eq-meta"><b>${esc(p.id)}</b><span>${esc(titleOf(p))}</span><span>${esc(fmtDims(p.dims) || (p.components ? '4-piece set' : 'Size on request'))}</span>
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

    const formList = $('#form-list');
    formList.hidden = enquiry.length === 0;
    formList.innerHTML = enquiry.length
      ? `Your enquiry list will be added to this message: <b>${enquiry.map((i) => esc(i.id) + (i.qty > 1 ? ' &times;' + i.qty : '')).join(', ')}</b>`
      : '';

    $$('.card-add').forEach((b) => {
      const on = inList(b.dataset.add);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${b.dataset.add} ${on ? 'from' : 'to'} enquiry list`);
      b.innerHTML = on ? ICON_CHECK : ICON_PLUS;
    });
    if (currentId) syncDialogAdd();
  }

  $('#eq-items').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { removeFromList(rm.dataset.remove); return; }
    const q = e.target.closest('[data-qty]');
    if (q) {
      const item = enquiry.find((i) => i.id === q.dataset.id);
      if (!item) return;
      item.qty += Number(q.dataset.qty);
      if (item.qty < 1) { removeFromList(item.id); return; }
      saveList();
      const btn = $(`[data-qty="${q.dataset.qty}"][data-id="${q.dataset.id}"]`);
      if (btn) btn.focus();
    }
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
    const text = [`Hello ${SITE.name},`, 'Please share the price and availability for:', ...listLines(), '',
      name && `Name: ${name}`, place && `Place: ${place}`].filter((l) => l !== false && l !== null).join('\n').trim();
    openExternal(waLink(text));
  });

  /* ---------- dialogs ---------- */
  const listDialog = $('#enquiry-dialog');
  const pd = $('#product-dialog');

  function openDialog(dlg) {
    if (!dlg.open) dlg.showModal();
    document.body.classList.add('has-dialog');
  }
  [listDialog, pd].forEach((dlg) => {
    dlg.addEventListener('close', () => {
      if (!listDialog.open && !pd.open) document.body.classList.remove('has-dialog');
      const t = $('#toast');
      if (t.parentNode === dlg) document.body.appendChild(t);
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
  });

  $$('[data-open-list]').forEach((b) => b.addEventListener('click', () => openDialog(listDialog)));

  /* ---------- rooms ---------- */
  function rangeOf(list) {
    const ids = list.map((p) => p.id).sort((a, b) => modelNum(a) - modelNum(b));
    return ids.length > 1 ? `${ids[0]} to ${ids[ids.length - 1]}` : ids[0];
  }

  $('#rooms').innerHTML = ROOMS.map((room) => {
    const cats = CATEGORIES.filter((c) => c.room === room.id);
    return `<article class="room">
      <div class="room-figure">${drawing(byId[room.rep], { pad: 0.02 })}</div>
      <h3>${esc(room.name)}</h3>
      <ul class="room-list">${cats.map((c) => {
        const list = PRODUCTS.filter((p) => p.cat === c.id);
        return `<li><button class="room-link" type="button" data-cat="${c.id}">
          <span class="rl-name">${esc(c.name)}</span>
          <span class="rl-count">${list.length}</span>
          <span class="rl-range">${esc(rangeOf(list))}</span>
        </button></li>`;
      }).join('')}</ul>
    </article>`;
  }).join('');

  $('#rooms').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.cat = b.dataset.cat;
    state.q = '';
    $('#cat-search').value = '';
    renderCatalogue();
    $('#catalogue').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  /* ---------- bedroom series ---------- */
  const sets = PRODUCTS.filter((p) => p.cat === 'bedroom-set');
  const tabs = $('#series-tabs');
  tabs.innerHTML = sets.map((s, i) => `<button class="series-tab" type="button" role="tab" id="tab-${s.id}" aria-controls="series-panel"
      aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-set="${s.id}">
      <span class="st-series">${esc(s.series)}</span><span class="st-name">${esc(s.name)}</span></button>`).join('');

  function specList(specs) {
    return Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  }
  function componentsTable(p, caption) {
    return `<table class="components">${caption ? `<caption>${esc(caption)}</caption>` : ''}
      <thead><tr><th scope="col">Code</th><th scope="col">Piece</th><th scope="col">Size (inches)</th></tr></thead>
      <tbody>${p.components.map((c) => `<tr><td>${esc(c.code)}</td><td>${esc(c.name)}</td><td>${esc(fmtDims(c.dims))}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderSeries(id, animate) {
    const s = byId[id];
    const panel = $('#series-panel');
    panel.setAttribute('aria-labelledby', 'tab-' + id);
    panel.innerHTML = `
      <div class="series-figure${animate ? ' swap' : ''}">${drawing(s, { pad: 0.03 })}</div>
      <div class="series-info">
        <p class="tag"><b>MW - ${modelNum(s.id)}</b><span>${esc(s.name)}</span></p>
        <p class="script">&ldquo;${esc(s.quote)}&rdquo;</p>
        ${componentsTable(s)}
        <dl class="specs">${specList(s.specs)}</dl>
        <div class="series-actions">
          <a class="btn btn-primary" href="${waLink(`Hello ${SITE.name}, I'm interested in the ${s.name} bedroom set (${s.id}). Could you share the price and availability?`)}" target="_blank" rel="noopener">Ask about ${esc(s.name)}</a>
          <button class="btn btn-outline" type="button" data-add-set="${s.id}">Add set to enquiry list</button>
        </div>
      </div>`;
  }
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('[data-set]');
    if (!t || t.getAttribute('aria-selected') === 'true') return;
    selectTab(t);
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = $$('[role="tab"]', tabs);
    const i = all.indexOf(document.activeElement);
    const next = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
    selectTab(next); next.focus();
  });
  function selectTab(t) {
    $$('[role="tab"]', tabs).forEach((b) => { const on = b === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    renderSeries(t.dataset.set, true);
  }
  $('#series-panel').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add-set]');
    if (b) addToList(b.dataset.addSet);
  });
  renderSeries(sets[0].id, false);

  /* ---------- catalogue ---------- */
  const ICON_PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>';
  const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 16.2-4.2-4.2-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>';
  const state = { cat: 'all', q: '' };
  let visible = PRODUCTS.slice();

  const chips = $('#chips');
  const chipDefs = [{ id: 'all', name: 'All models', n: PRODUCTS.length }].concat(
    CATEGORIES.map((c) => ({ id: c.id, name: c.name, n: PRODUCTS.filter((p) => p.cat === c.id).length })));
  chips.innerHTML = chipDefs.map((c) => `<button class="chip" type="button" data-chip="${c.id}" aria-pressed="false">${esc(c.name)} <small>${c.n}</small></button>`).join('');
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]');
    if (!b) return;
    state.cat = b.dataset.chip;
    renderCatalogue();
  });

  const norm = (s) => s.toLowerCase().replace(/[\s\-_.]/g, '');
  function matches(p, q) {
    if (!q) return true;
    const hay = norm([p.id, p.name || '', titleOf(p), catById[p.cat].name, p.finish || '', p.series || '',
      (p.components || []).map((c) => c.code + ' ' + c.name).join(' ')].join(' '));
    return q.split(/\s+/).filter(Boolean).every((w) => hay.includes(norm(w)));
  }

  const catOrder = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i]));
  const SORTED = PRODUCTS.slice().sort((a, b) => catOrder[a.cat] - catOrder[b.cat] || modelNum(a.id) - modelNum(b.id));

  function renderCatalogue() {
    visible = SORTED.filter((p) => (state.cat === 'all' || p.cat === state.cat) && matches(p, state.q));
    $$('[data-chip]', chips).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chip === state.cat)));
    const active = $(`[data-chip="${state.cat}"]`, chips);
    if (active) {
      // keep the active chip visible by scrolling the chip strip only, never the page
      const l = active.offsetLeft - chips.offsetLeft, r = l + active.offsetWidth;
      if (l < chips.scrollLeft) chips.scrollLeft = l - 8;
      else if (r > chips.scrollLeft + chips.clientWidth) chips.scrollLeft = r - chips.clientWidth + 24;
    }

    $('#cat-grid').innerHTML = visible.map((p) => `<li class="card">
      <button class="card-open" type="button" data-open="${p.id}" aria-label="View ${esc(titleOf(p))} ${p.id}">
        <span class="card-frame">${drawing(p)}</span>
        <span class="card-cap">
          <span class="card-cat">${esc(p.cat === 'bedroom-set' ? p.name + ', bedroom set' : catById[p.cat].single)}</span>
          <span class="card-model">Model No : <b>${p.id}</b></span>
          ${p.dims ? `<span class="card-dims">(${esc(fmtDims(p.dims))})</span>` : `<span class="card-dims">${p.components ? '4-piece set' : 'Size on request'}</span>`}
        </span>
      </button>
      <button class="card-add" type="button" data-add="${p.id}" aria-pressed="false" aria-label="Add ${p.id} to enquiry list">${ICON_PLUS}</button>
    </li>`).join('');

    const catName = state.cat === 'all' ? null : catById[state.cat].name.replace(/^(?!TV)\w/, (c) => c.toLowerCase());
    let msg;
    if (state.q) msg = `${visible.length} ${visible.length === 1 ? 'model matches' : 'models match'} “${state.q}”${catName ? ` in ${catName}` : ''}`;
    else msg = catName ? `Showing ${visible.length} ${catName}` : `Showing all ${visible.length} models`;
    $('#cat-count').textContent = msg;
    $('#cat-empty').hidden = visible.length > 0;
    $('#cat-empty-q').textContent = `“${state.q}”`;
    renderListUI();
  }

  let searchTimer;
  $('#cat-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value.trim(); renderCatalogue(); }, 120);
  });
  $('#cat-reset').addEventListener('click', () => {
    state.cat = 'all'; state.q = ''; $('#cat-search').value = '';
    renderCatalogue();
  });

  $('#cat-grid').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      if (inList(add.dataset.add)) removeFromList(add.dataset.add); else addToList(add.dataset.add);
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) openProduct(open.dataset.open, visible);
  });

  /* ---------- product detail ---------- */
  let currentId = null;
  let navList = PRODUCTS;

  function dimsTable(d) {
    const rows = [['Height', d.h], ['Depth', d.d], ['Width', d.w]];
    return `<table class="dims-table"><tbody>${rows.map(([k, v]) =>
      `<tr><th scope="row">${k}</th><td>${v != null ? `${v} in<span>${cm(v)} cm</span>` : '<span>Ask us</span>'}</td></tr>`).join('')}</tbody></table>`;
  }

  function syncDialogAdd() {
    const b = $('#pd-add');
    b.textContent = inList(currentId) ? 'Added. View enquiry list' : 'Add to enquiry list';
  }

  function openProduct(id, list) {
    const p = byId[id];
    if (!p) return;
    currentId = id;
    if (list && list.some((x) => x.id === id)) navList = list;
    else if (!navList.some((x) => x.id === id)) navList = PRODUCTS;

    const title = titleOf(p);
    const dimsKnown = p.dims && (p.dims.h != null || p.dims.d != null || p.dims.w != null);
    $('#pd-figure').innerHTML = drawing(p, dimsKnown ? { dims: p.dims, pad: 0.02 } : { pad: 0.04 });
    $('#pd-tag').innerHTML = `<b>MW - ${modelNum(p.id)}</b><span>${esc(p.cat === 'bedroom-set' ? p.name : catById[p.cat].single)}</span>`;
    $('#pd-title').textContent = p.cat === 'bedroom-set' ? `${p.name} bedroom set` : `${title} ${p.id}`;
    $('#pd-finish').textContent = p.finish || '';

    let detail = '';
    if (p.components) {
      detail += `<p class="script" style="font-size:1.7rem">&ldquo;${esc(p.quote)}&rdquo;</p>`;
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
    syncDialogAdd();

    const i = navList.findIndex((x) => x.id === id);
    $('#pd-pos').textContent = `${i + 1} of ${navList.length}`;
    $('#pd-prev').disabled = navList.length < 2;
    $('#pd-next').disabled = navList.length < 2;

    history.replaceState(null, '', '#' + id.toLowerCase());
    openDialog(pd);
    $('.pd-inner', pd).scrollTop = 0;
    pd.scrollTop = 0;
  }

  function step(dir) {
    const i = navList.findIndex((x) => x.id === currentId);
    const next = navList[(i + dir + navList.length) % navList.length];
    openProduct(next.id);
  }
  $('#pd-prev').addEventListener('click', () => step(-1));
  $('#pd-next').addEventListener('click', () => step(1));
  pd.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  pd.addEventListener('close', () => {
    const was = currentId;
    currentId = null;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    const card = was && $(`[data-open="${was}"]`);
    if (card) card.focus({ preventScroll: true });
  });

  $('#pd-add').addEventListener('click', () => {
    if (inList(currentId)) { pd.close(); openDialog(listDialog); return; }
    addToList(currentId);
  });
  $('#pd-copy').addEventListener('click', async () => {
    const url = location.href.split('#')[0] + '#' + currentId.toLowerCase();
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied. Paste it into a chat to share this model.');
    } catch (e) {
      toast('Copy is blocked in this browser. The link is in the address bar.');
    }
  });

  /* ---------- contact form ---------- */
  const form = $('#enquiry-form');
  form.addEventListener('submit', (e) => {
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
    const role = $('#f-role').value;
    const msg = $('#f-message').value.trim();
    const lines = [`Hello ${SITE.name},`, msg || 'I would like to know more about your furniture.'];
    if (enquiry.length) lines.push('', 'Models I am interested in:', ...listLines());
    lines.push('', `Name: ${name.value.trim()}`, `I am a: ${role}`);
    if (place) lines.push(`Place: ${place}`);
    openExternal(waLink(lines.join('\n')));
  });
  $('#f-name').addEventListener('input', (e) => {
    if (e.target.value.trim()) { e.target.removeAttribute('aria-invalid'); $('#f-name-error').hidden = true; }
  });

  /* ---------- start ---------- */
  renderCatalogue();

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1)).toUpperCase();
    if (byId[id]) openProduct(id);
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
