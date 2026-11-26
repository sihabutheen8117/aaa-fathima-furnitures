/* AAA Fathima Furniture admin panel.
 *
 * Staff sign in with their email and password, then add, edit, hide and delete
 * products and categories. Everything is saved in Supabase (supabase/schema.sql).
 * The database itself only lets accounts on the staff list (public.admins) change
 * anything; this page just offers the forms.
 *
 * Screens, by address:
 *   #/products              all products, with search and a category filter
 *   #/products/new          add a product
 *   #/products/MW-203       edit a product
 *   #/categories            categories in home page order
 *   #/categories/new        add a category
 *   #/categories/wardrobe   edit a category
 */
(function () {
  'use strict';

  const cfg = window.MW_CONFIG || {};
  const D = window.MWDraw;
  const ART = Object.fromEntries(window.MW_DATA.PRODUCTS.map((p) => [p.id, p.art]));
  const DEFAULT_SPECS = [['Material', 'Particle board'], ['Assembly', 'Easy assembly']];
  const BUCKET = 'photos';
  const PHOTO = { big: 1600, thumb: 600, quality: 0.82 };
  const MODEL_RE = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;
  const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byModel = (a, b) => a.localeCompare(b, 'en', { numeric: true });
  const norm = (s) => String(s || '').toLowerCase().replace(/[\s\-_.]/g, '');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const rupees = (n) => '₹' + n.toLocaleString('en-IN');

  /* ---------- screens ---------- */
  const SCREENS = ['loading', 'setup', 'login', 'newpass', 'denied'];
  const VIEWS = ['products', 'product', 'categories', 'category'];

  function showScreen(name) {
    SCREENS.forEach((s) => { $('#screen-' + s).hidden = s !== name; });
    if (name !== 'app') VIEWS.forEach((v) => { $('#view-' + v).hidden = true; });
    $('#ad-user').hidden = name !== 'app';
    $('#ad-tabs').hidden = name !== 'app';
    document.body.dataset.screen = name;
    if (name !== 'app' && name !== 'loading') focusTitle();
  }
  function showView(name) {
    VIEWS.forEach((v) => { $('#view-' + v).hidden = v !== name; });
    const tab = name.startsWith('categor') ? 'categories' : 'products';
    $$('[data-tab]').forEach((a) => {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
    focusTitle();
  }
  function focusTitle() {
    const t = $$('[data-title]').find((el) => !el.closest('[hidden]'));
    if (t) t.focus({ preventScroll: true });
  }
  function showFatal(msg) {
    $('#screen-loading').innerHTML = `${esc(msg)} <button class="link-btn" type="button" id="retry">Try again</button>`;
    showScreen('loading');
    $('#retry').addEventListener('click', () => location.reload());
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }
  function showError(sel, msg) {
    const el = $(sel);
    el.textContent = msg || '';
    el.hidden = !msg;
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    btn.disabled = on;
    btn.setAttribute('aria-busy', String(on));
  }

  // turn database and network errors into something staff can act on
  function friendly(err, what) {
    const code = err && err.code;
    const msg = String((err && (err.message || err.error_description)) || err || '');
    if (/fetch|network|load failed/i.test(msg)) return 'No internet connection. Check it and try again.';
    if (code === '23505') return `${what || 'That'} is already used. Choose another.`;
    if (code === '23503') return 'Something this depends on was changed or removed. Reload the page and try again.';
    if (code === '23514') return 'Some values are not allowed. Check the model number, sizes and prices.';
    if (code === '42501' || /row-level security|permission denied|Unauthorized/i.test(msg)) return 'Your account is not allowed to make changes. Ask the site owner to add you to the staff list.';
    if (code === 'PGRST116') return 'This was changed or removed on another device. Reload the page and try again.';
    if (/JWT|expired|session/i.test(msg)) return 'You were signed out. Sign in again and retry.';
    return msg || 'Something went wrong. Try again.';
  }

  /* ---------- start ---------- */
  if (!cfg.supabaseUrl || !cfg.supabaseKey) { showScreen('setup'); return; }
  if (!window.supabase) { showFatal('The admin panel could not load. Check the internet connection.'); return; }

  // read the address before Supabase reads it (and clears it): an emailed reset link lands here
  const startHash = location.hash;
  let recovering = /type=recovery/.test(startHash);
  let linkError = /error_description=([^&]+)/.exec(startHash);

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  let user = null;              // signed-in staff member
  let cats = [];                // all category rows, in home page order (hidden ones too)
  let prods = [];               // all product rows, by model number
  let catById = {};
  let prodById = {};

  async function loadAll() {
    const [c, p] = await Promise.all([
      sb.from('categories').select('*').order('position').order('name'),
      sb.from('products').select('*'),
    ]);
    if (c.error) throw c.error;
    if (p.error) throw p.error;
    cats = c.data;
    prods = p.data.sort((a, b) => byModel(a.id, b.id));
    catById = Object.fromEntries(cats.map((x) => [x.id, x]));
    prodById = Object.fromEntries(prods.map((x) => [x.id, x]));
    $('#tab-count-products').textContent = prods.length;
    $('#tab-count-categories').textContent = cats.length;
  }
  const inCat = (id) => prods.filter((p) => p.category_id === id);

  /* ---------- signing in and out ---------- */
  sb.auth.onAuthStateChange((event, session) => {
    // supabase-js asks that its own methods are not awaited inside this callback
    setTimeout(() => onAuth(event, session), 0);
  });

  async function onAuth(event, session) {
    if (event === 'PASSWORD_RECOVERY') recovering = true;
    if (recovering && session) {
      $('#newpass-user').value = session.user.email || '';
      showScreen('newpass');
      return;
    }
    recovering = false;   // the reset link didn't sign anyone in (expired or already used)
    if (!session) {
      user = null;
      showScreen('login');
      if (linkError) {
        // shown once, and taken out of the address so it doesn't come back after signing out
        showError('#login-error', decodeURIComponent(linkError[1].replace(/\+/g, ' ')) + '. Ask for a new link below.');
        linkError = null;
        history.replaceState(null, '', location.pathname);
      }
      return;
    }
    if (user && user.id === session.user.id) return;   // token refreshed, or signed in again in another tab
    try {
      const { data, error } = await sb.from('admins').select('email').maybeSingle();
      if (error) throw error;
      if (recovering) return;
      if (!data) {
        $('#denied-email').textContent = session.user.email;
        showScreen('denied');
        return;
      }
      user = session.user;
      await loadAll();
      if (recovering) return;
      showScreen('app');
      if (!/^#\/(products|categories)/.test(location.hash)) history.replaceState(null, '', '#/products');
      route();
    } catch (err) {
      showFatal(friendly(err));
    }
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    if (!email || !password) { showError('#login-error', 'Enter your email and password.'); return; }
    showError('#login-error', '');
    const btn = $('#login-form [type="submit"]');
    busy(btn, true, 'Signing in…');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    busy(btn, false);
    if (error) {
      showError('#login-error', /invalid login credentials/i.test(error.message)
        ? 'That email and password don’t match. Check them and try again.'
        : friendly(error));
    } else {
      $('#login-password').value = '';
    }
  });

  $('#show-forgot').addEventListener('click', (e) => {
    const form = $('#forgot-form');
    form.hidden = !form.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!form.hidden));
    if (!form.hidden) {
      $('#forgot-email').value = $('#login-email').value.trim();
      $('#forgot-email').focus();
    }
  });

  $('#forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#forgot-email').value.trim();
    if (!email) { showError('#forgot-msg', 'Enter your email.'); return; }
    const btn = $('#forgot-form [type="submit"]');
    busy(btn, true, 'Sending…');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    busy(btn, false);
    showError('#forgot-msg', error
      ? friendly(error)
      : 'If this email is on the staff list, a link is on its way. Open it on this device to set a new password.');
  });

  $('#newpass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = $('#newpass').value;
    if (password.length < 8) { showError('#newpass-error', 'Use at least 8 characters.'); return; }
    const btn = $('#newpass-form [type="submit"]');
    busy(btn, true, 'Saving…');
    const { error } = await sb.auth.updateUser({ password });
    busy(btn, false);
    if (error) { showError('#newpass-error', friendly(error)); return; }
    $('#newpass').value = '';
    recovering = false;
    toast('Password saved');
    const { data } = await sb.auth.getSession();
    user = null;
    onAuth('SIGNED_IN', data.session);
  });

  async function signOut() {
    if (dirty && !confirm('Sign out without saving your changes?')) return;
    dirty = false;
    await sb.auth.signOut();
  }
  $('#sign-out').addEventListener('click', signOut);
  $$('[data-sign-out]').forEach((b) => b.addEventListener('click', signOut));

  /* ---------- moving between screens ---------- */
  let dirty = false;          // the open form has changes that are not saved
  let lastHash = '';

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }
  window.addEventListener('hashchange', () => {
    if (!user) return;
    if (dirty && !confirm('Leave without saving your changes?')) {
      history.replaceState(null, '', lastHash);
      return;
    }
    dirty = false;
    route();
  });
  window.addEventListener('beforeunload', (e) => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  function route() {
    lastHash = location.hash;
    let h = location.hash.replace(/^#\/?/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* keep it as typed */ }
    const [section, arg] = h.split('/');
    if (section === 'categories') { if (arg) openCategory(arg); else showCategories(); }
    else if (arg) openProduct(arg);
    else showProducts();
  }

  /* ---------- pictures ---------- */
  const drawCache = new Map();
  function artSvg(key) {
    if (!drawCache.has(key)) drawCache.set(key, D.render(ART[key], { seed: key, pad: 0.04, label: '' }));
    return drawCache.get(key);
  }
  const noPic = () => `<span class="no-pic">${D.logoMark()}</span>`;
  function productPic(p) {
    if (!p) return noPic();
    const src = p.thumb_url || p.photo_url;
    if (src) return `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`;
    if (p.art_key && ART[p.art_key]) return artSvg(p.art_key);
    return noPic();
  }
  function categoryPic(c, repId) {
    if (c && c.photo_url) return `<img class="cover" src="${esc(c.photo_url)}" alt="" loading="lazy" decoding="async">`;
    const list = c ? inCat(c.id) : [];
    const rep = prodById[repId] || list.find((p) => p.thumb_url || p.photo_url || (p.art_key && ART[p.art_key]));
    return productPic(rep);
  }

  // shrink a phone photo before upload: a large copy for the product screen, a small one for lists
  async function makePhotos(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const bigCanvas = scaled(img, img.naturalWidth, img.naturalHeight, PHOTO.big);
      const thumbCanvas = scaled(bigCanvas, bigCanvas.width, bigCanvas.height, PHOTO.thumb);
      const [big, thumb] = await Promise.all([encode(bigCanvas), encode(thumbCanvas)]);
      return { big, thumb, preview: URL.createObjectURL(thumb) };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  function scaled(src, w, h, max) {
    const s = Math.min(1, max / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * s));
    c.height = Math.max(1, Math.round(h * s));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';               // transparent PNGs get a white background
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  function encode(canvas) {
    // WebP where the browser can make it (much smaller), otherwise JPEG
    return new Promise((resolve, reject) => {
      canvas.toBlob((webp) => {
        if (webp && webp.type === 'image/webp') { resolve(webp); return; }
        canvas.toBlob((jpg) => (jpg ? resolve(jpg) : reject(new Error('The photo could not be prepared.'))), 'image/jpeg', PHOTO.quality);
      }, 'image/webp', PHOTO.quality);
    });
  }
  const extOf = (blob) => (blob.type === 'image/webp' ? 'webp' : 'jpg');
  const stamp = () => Date.now().toString(36);

  async function upload(path, blob) {
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
    if (error) throw error;
    return { path, url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  }
  function removeFiles(paths) {
    const list = paths.filter(Boolean);
    if (!list.length) return;
    sb.storage.from(BUCKET).remove(list).then(({ error }) => {
      if (error) console.warn('Could not delete old photo files', list, error);
    });
  }

  /* ---------- product list ---------- */
  function categoryOptions(selected, { all = false, blank = false } = {}) {
    let html = '';
    if (all) html += `<option value="">All categories (${prods.length})</option>`;
    if (blank) html += '<option value="">Choose a category</option>';
    html += cats.map((c) => `<option value="${esc(c.id)}"${c.id === selected ? ' selected' : ''}>${esc(c.name)} (${inCat(c.id).length})${c.visible ? '' : ', hidden'}</option>`).join('');
    return html;
  }

  function showProducts() {
    const sel = $('#p-cat');
    const keep = sel.value;
    sel.innerHTML = categoryOptions(keep, { all: true });
    if (keep && !catById[keep]) sel.value = '';
    renderProducts();
    showView('products');
  }

  function renderProducts() {
    const words = $('#p-search').value.trim().split(/\s+/).filter(Boolean).map(norm);
    const cat = $('#p-cat').value;
    const list = prods.filter((p) => {
      if (cat && p.category_id !== cat) return false;
      if (!words.length) return true;
      const c = catById[p.category_id];
      const hay = norm([p.id, p.name, p.finish, p.series, c && c.name].join(' '));
      return words.every((w) => hay.includes(w));
    });
    $('#p-list').innerHTML = list.map((p) => {
      const c = catById[p.category_id];
      const badge = !p.visible ? '<span class="ad-badge">Hidden</span>'
        : c && !c.visible ? '<span class="ad-badge">Category hidden</span>' : '';
      const shown = p.price || p.mrp;
      const sub = [p.name || (c && c.single), shown && rupees(shown), p.finish].filter(Boolean).join(' · ');
      return `<li><a class="ad-row" href="#/products/${encodeURIComponent(p.id)}">
          <span class="ad-thumb">${productPic(p)}</span>
          <span class="ad-row-text"><b>${esc(p.id)}</b><span>${esc(sub)}</span></span>
          ${badge}
          <svg class="ic ad-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </a></li>`;
    }).join('');
    $('#p-empty').hidden = list.length > 0;
    $('#p-count').textContent = list.length === prods.length
      ? plural(prods.length, 'product', 'products')
      : `${list.length} of ${plural(prods.length, 'product', 'products')}`;
  }
  let searchTimer;
  $('#p-search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderProducts, 150); });
  $('#p-cat').addEventListener('change', renderProducts);

  /* ---------- product form ---------- */
  let editing = null;         // the product row being edited; null when adding
  let newPhoto = null;        // photo picked but not uploaded yet: { big, thumb, preview }
  let dropPhoto = false;      // the saved photo is to be removed on save
  let pendingCat = null;      // category to pre-select in the next new product

  function rowItem(kind, values) {
    if (kind === 'spec') {
      return `<li class="ad-rowitem ad-spec">
        <input type="text" aria-label="Label" placeholder="Label, e.g. Material" value="${esc(values[0])}">
        <input type="text" aria-label="Value" placeholder="Value, e.g. Particle board" value="${esc(values[1])}">
        <button class="ad-x" type="button" data-remove-row aria-label="Remove this specification">&times;</button></li>`;
    }
    const v = values || {};
    const n = (x) => (x == null ? '' : esc(x));
    return `<li class="ad-rowitem ad-piece">
      <input type="text" aria-label="Piece code" placeholder="Code" value="${n(v.code)}" autocapitalize="characters">
      <input type="text" aria-label="Piece name" placeholder="Name, e.g. Wardrobe" value="${n(v.name)}">
      <input type="text" inputmode="decimal" aria-label="Height in inches" placeholder="H" value="${n(v.h)}">
      <input type="text" inputmode="decimal" aria-label="Depth in inches" placeholder="D" value="${n(v.d)}">
      <input type="text" inputmode="decimal" aria-label="Width in inches" placeholder="W" value="${n(v.w)}">
      <button class="ad-x" type="button" data-remove-row aria-label="Remove this piece">&times;</button></li>`;
  }

  function openProduct(rawId) {
    const id = rawId === 'new' ? null : rawId.toUpperCase();
    const p = id ? prodById[id] : null;
    if (id && !p) { toast(`${id} is not in the catalogue`); history.replaceState(null, '', '#/products'); showProducts(); return; }
    if (!cats.length) { toast('Add a category first'); history.replaceState(null, '', '#/categories/new'); openCategory('new'); return; }
    editing = p;
    clearNewPhoto();
    dropPhoto = false;

    $('#pf-title').textContent = p ? `Edit ${p.id}` : 'New product';
    $('#pf-id').value = p ? p.id : '';
    $('#pf-id-hint').textContent = p
      ? 'Changing it also changes the product’s web address, so links shared earlier stop working.'
      : 'Letters, numbers and dashes, as printed in the catalogue.';
    $('#pf-cat').innerHTML = categoryOptions(p ? p.category_id : pendingCat || $('#p-cat').value, { blank: true });
    pendingCat = null;
    $('#pf-name').value = p ? p.name || '' : '';
    $('#pf-finish').value = p ? p.finish || '' : '';
    ['h', 'd', 'w'].forEach((k) => { $('#pf-' + k).value = p && p[k] != null ? p[k] : ''; });
    ['mrp', 'price'].forEach((k) => { $('#pf-' + k).value = p && p[k] != null ? p[k].toLocaleString('en-IN') : ''; });
    $('#pf-visible').checked = p ? p.visible : true;
    $('#pf-series').value = p ? p.series || '' : '';
    $('#pf-quote').value = p ? p.quote || '' : '';
    $('#pf-specs').innerHTML = (p ? p.specs : DEFAULT_SPECS).map((s) => rowItem('spec', s)).join('');
    $('#pf-pieces').innerHTML = (p ? p.components : []).map((c) => rowItem('piece', c)).join('');
    $('#pf-more').open = !!(p && (p.components.length || p.series || p.quote));
    $('#pf-danger').hidden = !p;
    if (p) $('#pf-view').href = `index.html#${p.id.toLowerCase()}`;
    $('#pf-save').textContent = p ? 'Save changes' : 'Add product';
    clearProductErrors();
    renderPriceHint();
    renderProductPic();
    dirty = false;
    showView('product');
  }

  function clearNewPhoto() {
    if (newPhoto) URL.revokeObjectURL(newPhoto.preview);
    newPhoto = null;
  }

  function renderProductPic() {
    const savedSrc = editing && !dropPhoto && (editing.thumb_url || editing.photo_url);
    const art = editing && editing.art_key && ART[editing.art_key];
    let html; let hint;
    if (newPhoto) {
      html = `<img src="${newPhoto.preview}" alt="New photo">`;
      hint = 'New photo. It is uploaded when you save.';
    } else if (savedSrc) {
      html = `<img src="${esc(savedSrc)}" alt="Current photo">`;
      hint = 'A photo on a plain, light background looks best.';
    } else if (art) {
      html = artSvg(editing.art_key);
      hint = dropPhoto ? 'The photo will be removed when you save, and the drawing shown instead.'
        : 'This model shows a drawing. Add a photo to show the real product instead.';
    } else {
      html = noPic();
      hint = dropPhoto ? 'The photo will be removed when you save.' : 'A photo on a plain, light background looks best.';
    }
    $('#pf-pic').innerHTML = html;
    $('#pf-photo-hint').textContent = hint;
    $('#pf-file-label').textContent = newPhoto || savedSrc ? 'Change photo' : 'Add photo';
    $('#pf-photo-remove').hidden = !(newPhoto || savedSrc);
  }

  $('#pf-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    showError('#pf-error', '');
    $('#pf-photo-hint').textContent = 'Preparing the photo…';
    try {
      const photos = await makePhotos(file);
      clearNewPhoto();
      newPhoto = photos;
      dirty = true;
    } catch (err) {
      showError('#pf-error', 'That photo could not be opened. Try a JPEG or PNG photo.');
    }
    renderProductPic();
  });
  $('#pf-photo-remove').addEventListener('click', () => {
    if (newPhoto) clearNewPhoto();               // undo the photo just picked
    else dropPhoto = true;                       // remove the saved one
    dirty = true;
    renderProductPic();
  });

  $('#pf-spec-add').addEventListener('click', () => {
    $('#pf-specs').insertAdjacentHTML('beforeend', rowItem('spec', ['', '']));
    $('#pf-specs li:last-child input').focus();
    dirty = true;
  });
  $('#pf-piece-add').addEventListener('click', () => {
    const n = $$('#pf-pieces li').length;
    const id = $('#pf-id').value.trim().toUpperCase().replace(/-/g, '');
    $('#pf-pieces').insertAdjacentHTML('beforeend', rowItem('piece', { code: id ? id + String.fromCharCode(65 + n) : '' }));
    $('#pf-pieces li:last-child input:nth-child(2)').focus();
    dirty = true;
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-remove-row]');
    if (!b) return;
    const list = b.closest('ul');
    b.closest('li').remove();
    dirty = true;
    const next = list.nextElementSibling;
    if (next) next.focus();
  });
  $('#pf').addEventListener('input', () => { dirty = true; });
  $('#pf-id').addEventListener('blur', (e) => { e.target.value = cleanModel(e.target.value); });

  const cleanModel = (v) => v.trim().toUpperCase().replace(/\s+/g, '-').replace(/-+/g, '-');
  function readNum(raw) {
    const s = String(raw).trim().replace(',', '.');
    if (!s) return { value: null };
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0 || n >= 1000) return { bad: true };
    return { value: Math.round(n * 100) / 100 };
  }

  /* ---------- prices ---------- */
  // whole rupees, typed the way people write them: 20000, 20,000, ₹20,000, Rs. 20,000/-
  function readRupees(raw) {
    const s = String(raw).replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '').replace(/\/-$/, '');
    if (!s) return { value: null };
    if (!/^\d+$/.test(s)) return { bad: true };
    const n = Number(s);
    if (n <= 0 || n >= 1e8) return { bad: true };
    return { value: n };
  }
  // tells staff what customers will see, as they type
  function renderPriceHint() {
    const mrp = readRupees($('#pf-mrp').value);
    const price = readRupees($('#pf-price').value);
    let hint;
    if (mrp.bad || price.bad) hint = 'Prices are whole rupees, like 20000 or 20,000.';
    else if (!mrp.value && !price.value) hint = 'With no price, the website shows “Price on request”.';
    else if (!price.value) hint = `The website shows ${rupees(mrp.value)}. Add an offer price to show a discount.`;
    else if (!mrp.value) hint = `The website shows ${rupees(price.value)}. Add the MRP to show it struck through, with the saving.`;
    else if (price.value > mrp.value) hint = 'The offer price is higher than the MRP. Check both.';
    else if (price.value === mrp.value) hint = `The website shows ${rupees(price.value)}, with no discount because both prices are the same.`;
    else {
      const off = Math.floor(((mrp.value - price.value) * 100) / mrp.value);
      hint = `The website shows ${rupees(price.value)} with MRP ${rupees(mrp.value)} struck through: save ${rupees(mrp.value - price.value)}` +
        (off > 0 ? `, ${off}% off.` : '.');
    }
    $('#pf-price-hint').textContent = hint;
  }
  ['#pf-mrp', '#pf-price'].forEach((sel) => {
    $(sel).addEventListener('input', () => {
      // a fresh edit replaces the error from the last save with the live hint
      setFieldError(null, '#pf-price-error');
      ['#pf-mrp', '#pf-price'].forEach((s) => $(s).removeAttribute('aria-invalid'));
      renderPriceHint();
    });
    // tidy to 20,000 when leaving the box, so the number is easy to check
    $(sel).addEventListener('blur', (e) => {
      const r = readRupees(e.target.value);
      if (r.value) e.target.value = r.value.toLocaleString('en-IN');
    });
  });

  function setFieldError(input, errEl, msg) {
    const el = $(errEl);
    el.textContent = msg || '';
    el.hidden = !msg;
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }
  function clearProductErrors() {
    setFieldError($('#pf-id'), '#pf-id-error');
    setFieldError($('#pf-cat'), '#pf-cat-error');
    setFieldError(null, '#pf-dims-error');
    setFieldError(null, '#pf-price-error');
    ['h', 'd', 'w', 'mrp', 'price'].forEach((k) => $('#pf-' + k).removeAttribute('aria-invalid'));
    $$('#pf-specs input, #pf-pieces input').forEach((i) => i.removeAttribute('aria-invalid'));
    showError('#pf-error', '');
  }

  // read the form into a database row; returns { row, firstBad } where firstBad is the first field to fix
  function readProductForm() {
    clearProductErrors();
    let firstBad = null;
    const bad = (input, errEl, msg) => { setFieldError(input, errEl, msg); if (!firstBad) firstBad = input; };

    const idInput = $('#pf-id');
    const id = cleanModel(idInput.value);
    idInput.value = id;
    if (!id) bad(idInput, '#pf-id-error', 'Enter the model number.');
    else if (!MODEL_RE.test(id)) bad(idInput, '#pf-id-error', 'Use only letters, numbers and dashes, like MW-210.');
    else if (id !== (editing && editing.id) && prodById[id]) bad(idInput, '#pf-id-error', `${id} is already in the catalogue.`);

    const category_id = $('#pf-cat').value;
    if (!category_id) bad($('#pf-cat'), '#pf-cat-error', 'Choose a category.');

    const dims = {};
    let dimsBad = false;
    ['h', 'd', 'w'].forEach((k) => {
      const input = $('#pf-' + k);
      const r = readNum(input.value);
      if (r.bad) { input.setAttribute('aria-invalid', 'true'); if (!firstBad) firstBad = input; dimsBad = true; }
      dims[k] = r.value === undefined ? null : r.value;
    });
    if (dimsBad) setFieldError(null, '#pf-dims-error', 'Sizes are numbers of inches, like 74 or 31.5.');

    const mrpInput = $('#pf-mrp');
    const priceInput = $('#pf-price');
    const mrp = readRupees(mrpInput.value);
    const price = readRupees(priceInput.value);
    if (mrp.bad || price.bad) {
      [[mrpInput, mrp], [priceInput, price]].forEach(([input, r]) => {
        if (r.bad) { input.setAttribute('aria-invalid', 'true'); if (!firstBad) firstBad = input; }
      });
      setFieldError(null, '#pf-price-error', 'Prices are whole rupees, like 20000 or 20,000.');
    } else if (mrp.value && price.value && price.value > mrp.value) {
      bad(priceInput, '#pf-price-error', 'The offer price can’t be more than the MRP.');
    }
    if (!$('#pf-price-error').hidden) $('#pf-price-hint').textContent = '';   // the error says it; no need to repeat it

    const specs = [];
    $$('#pf-specs li').forEach((li) => {
      const [k, v] = $$('input', li).map((i) => i.value.trim());
      if (!k && !v) return;
      if (!k || !v) {
        const empty = $$('input', li).find((i) => !i.value.trim());
        empty.setAttribute('aria-invalid', 'true');
        if (!firstBad) { firstBad = empty; $('#pf-more').open = true; }
        showError('#pf-error', 'Each specification needs a label and a value. Fill both in or remove the row.');
        return;
      }
      specs.push([k, v]);
    });

    const components = [];
    $$('#pf-pieces li').forEach((li) => {
      const inputs = $$('input', li);
      const [code, name] = inputs.slice(0, 2).map((i) => i.value.trim());
      const nums = inputs.slice(2).map((i) => readNum(i.value));
      if (!code && !name && nums.every((r) => r.value == null && !r.bad)) return;
      nums.forEach((r, j) => {
        if (r.bad) {
          inputs[j + 2].setAttribute('aria-invalid', 'true');
          if (!firstBad) { firstBad = inputs[j + 2]; $('#pf-more').open = true; }
          showError('#pf-error', 'Piece sizes are numbers of inches, like 74 or 31.5.');
        }
      });
      if (!name) {
        inputs[1].setAttribute('aria-invalid', 'true');
        if (!firstBad) { firstBad = inputs[1]; $('#pf-more').open = true; }
        showError('#pf-error', 'Each piece needs a name, like Wardrobe.');
      }
      components.push({ code: code.toUpperCase(), name, h: nums[0].value == null ? null : nums[0].value, d: nums[1].value == null ? null : nums[1].value, w: nums[2].value == null ? null : nums[2].value });
    });

    const text = (sel) => $(sel).value.trim() || null;
    const row = {
      id, category_id,
      name: text('#pf-name'), finish: text('#pf-finish'), series: text('#pf-series'), quote: text('#pf-quote'),
      h: dims.h, d: dims.d, w: dims.w,
      mrp: mrp.value || null, price: price.value || null,
      specs, components,
      visible: $('#pf-visible').checked,
    };
    return { row, firstBad };
  }

  $('#pf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { row, firstBad } = readProductForm();
    if (firstBad) { firstBad.focus(); return; }
    const btn = $('#pf-save');
    busy(btn, true, newPhoto ? 'Uploading photo…' : 'Saving…');
    const uploaded = [];
    try {
      if (newPhoto) {
        const base = `products/${row.id}/${stamp()}`;
        const big = await upload(`${base}.${extOf(newPhoto.big)}`, newPhoto.big);
        uploaded.push(big.path);
        const thumb = await upload(`${base}-thumb.${extOf(newPhoto.thumb)}`, newPhoto.thumb);
        uploaded.push(thumb.path);
        Object.assign(row, { photo_url: big.url, photo_path: big.path, thumb_url: thumb.url, thumb_path: thumb.path });
        btn.textContent = 'Saving…';
      } else if (dropPhoto) {
        Object.assign(row, { photo_url: null, photo_path: null, thumb_url: null, thumb_path: null });
      }
      const query = editing
        ? sb.from('products').update(row).eq('id', editing.id)
        : sb.from('products').insert(row);
      const { data, error } = await query.select().single();
      if (error) throw error;
      // the old photo files are no longer used by anything
      if (editing && (newPhoto || dropPhoto)) removeFiles([editing.photo_path, editing.thumb_path]);
      uploaded.length = 0;
      clearNewPhoto();
      dirty = false;
      await loadAll();
      toast(`${data.id} ${editing ? 'saved' : 'added'}${data.visible ? '' : ' (hidden from the website)'}`);
      go('#/products');
    } catch (err) {
      if (uploaded.length) removeFiles(uploaded);
      showError('#pf-error', friendly(err, row.id));
      $('#pf-error').scrollIntoView({ block: 'center' });
    } finally {
      busy(btn, false);
    }
  });

  $('#pf-delete').addEventListener('click', async () => {
    const p = editing;
    if (!confirm(`Delete ${p.id} for good?\n\nTo take it off the website for now, cancel and switch off “Show on the website” instead.`)) return;
    const btn = $('#pf-delete');
    busy(btn, true, 'Deleting…');
    const { data, error } = await sb.from('products').delete().eq('id', p.id).select();
    busy(btn, false);
    if (error || !data.length) { showError('#pf-error', error ? friendly(error) : friendly({ code: '42501' })); return; }
    removeFiles([p.photo_path, p.thumb_path]);
    dirty = false;
    await loadAll();
    toast(`${p.id} deleted`);
    go('#/products');
  });

  /* ---------- category list ---------- */
  function showCategories() {
    renderCategories();
    showView('categories');
  }
  function renderCategories() {
    const up = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
    const down = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    $('#c-list').innerHTML = cats.map((c, i) => {
      const n = inCat(c.id).length;
      const badge = !c.visible ? '<span class="ad-badge">Hidden</span>' : n === 0 ? '<span class="ad-badge">Empty</span>' : '';
      return `<li class="ad-crow">
        <a class="ad-row" href="#/categories/${encodeURIComponent(c.id)}">
          <span class="ad-thumb is-round">${categoryPic(c, c.rep_product)}</span>
          <span class="ad-row-text"><b>${esc(c.name)}</b><span>${plural(n, 'product', 'products')}</span></span>
          ${badge}
        </a>
        <span class="ad-move">
          <button type="button" data-move="-1" data-id="${esc(c.id)}" aria-label="Move ${esc(c.name)} up"${i === 0 ? ' disabled' : ''}>${up}</button>
          <button type="button" data-move="1" data-id="${esc(c.id)}" aria-label="Move ${esc(c.name)} down"${i === cats.length - 1 ? ' disabled' : ''}>${down}</button>
        </span>
      </li>`;
    }).join('');
  }

  $('#c-list').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-move]');
    if (!b) return;
    const id = b.dataset.id;
    const step = Number(b.dataset.move);
    const i = cats.findIndex((c) => c.id === id);
    const j = i + step;
    if (i < 0 || j < 0 || j >= cats.length) return;
    const order = cats.slice();
    [order[i], order[j]] = [order[j], order[i]];
    // renumber in steps of 10 and save only the rows whose number changed
    const changes = order.map((c, k) => ({ c, position: (k + 1) * 10 })).filter((x) => x.c.position !== x.position);
    $$('#c-list [data-move]').forEach((x) => { x.disabled = true; });
    const results = await Promise.all(changes.map((x) => sb.from('categories').update({ position: x.position }).eq('id', x.c.id)));
    const failed = results.find((r) => r.error);
    try { await loadAll(); } catch (err) { /* keep the old list */ }
    renderCategories();
    const again = $(`#c-list [data-move="${step}"][data-id="${CSS.escape(id)}"]`);
    const other = $(`#c-list [data-move="${-step}"][data-id="${CSS.escape(id)}"]`);
    if (again && !again.disabled) again.focus(); else if (other) other.focus();
    toast(failed ? friendly(failed.error) : `${catById[id].name} moved ${step < 0 ? 'up' : 'down'}`);
  });

  /* ---------- category form ---------- */
  let editingCat = null;
  let newCatPhoto = null;
  let dropCatPhoto = false;
  let idTouched = false;
  let singleTouched = false;

  const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  function singular(s) {
    const t = s.trim();
    if (/ies$/i.test(t)) return t.replace(/ies$/i, 'y');
    if (/(ch|sh|x|ss)es$/i.test(t)) return t.replace(/es$/i, '');
    if (/[^s]s$/i.test(t)) return t.slice(0, -1);
    return t;
  }

  function openCategory(rawId) {
    const c = rawId === 'new' ? null : catById[rawId];
    if (rawId !== 'new' && !c) { toast('That category no longer exists'); history.replaceState(null, '', '#/categories'); showCategories(); return; }
    editingCat = c;
    clearNewCatPhoto();
    dropCatPhoto = false;
    idTouched = !!c;
    singleTouched = !!c;

    $('#cf-title').textContent = c ? `Edit ${c.name}` : 'New category';
    $('#cf-name').value = c ? c.name : '';
    $('#cf-single').value = c ? c.single : '';
    $('#cf-id').value = c ? c.id : '';
    $('#cf-id').readOnly = !!c;
    $('#cf-id-hint').textContent = c
      ? 'This can’t be changed, so links people saved keep working.'
      : 'Filled in from the name. It can’t be changed later, so links keep working.';
    const list = c ? inCat(c.id) : [];
    const rep = $('#cf-rep');
    rep.innerHTML = '<option value="">The first product with a picture</option>' +
      list.map((p) => `<option value="${esc(p.id)}"${c && c.rep_product === p.id ? ' selected' : ''}>${esc(p.id)}${p.name ? ' ' + esc(p.name) : ''}</option>`).join('');
    rep.disabled = list.length === 0;
    $('#cf-visible').checked = c ? c.visible : true;
    $('#cf-danger').hidden = !c;
    $('#cf-delete').disabled = list.length > 0;
    $('#cf-delete-note').hidden = list.length === 0;
    $('#cf-delete-note').textContent = list.length
      ? `To delete this category, first move its ${plural(list.length, 'product', 'products')} to another category or delete them.` : '';
    $('#cf-save').textContent = c ? 'Save changes' : 'Add category';
    clearCategoryErrors();
    renderCategoryPic();
    dirty = false;
    showView('category');
  }

  function clearNewCatPhoto() {
    if (newCatPhoto) URL.revokeObjectURL(newCatPhoto.preview);
    newCatPhoto = null;
  }
  function renderCategoryPic() {
    const c = editingCat;
    const saved = c && !dropCatPhoto && c.photo_url;
    let html;
    if (newCatPhoto) html = `<img class="cover" src="${newCatPhoto.preview}" alt="New photo">`;
    else if (saved) html = `<img class="cover" src="${esc(saved)}" alt="Current photo">`;
    else html = categoryPic(c ? Object.assign({}, c, { photo_url: null }) : null, $('#cf-rep').value);
    $('#cf-pic').innerHTML = html;
    const hasPhoto = !!(newCatPhoto || saved);
    $('#cf-file-label').textContent = hasPhoto ? 'Change photo' : 'Add photo';
    $('#cf-photo-remove').hidden = !hasPhoto;
    // choosing a model's picture only makes sense once the category has products
    $('#cf-rep').closest('.field').hidden = hasPhoto || $('#cf-rep').disabled;
    $('#cf-pic-hint').textContent = hasPhoto ? 'The photo fills the round tile on the home page.'
      : $('#cf-rep').disabled ? 'Upload a photo, or leave it and the tile will use the first product’s picture.'
        : 'Or upload a photo of your own for the tile.';
  }
  $('#cf-rep').addEventListener('change', () => { dirty = true; renderCategoryPic(); });
  $('#cf-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    showError('#cf-error', '');
    try {
      const photos = await makePhotos(file);
      clearNewCatPhoto();
      newCatPhoto = photos;
      dirty = true;
    } catch (err) {
      showError('#cf-error', 'That photo could not be opened. Try a JPEG or PNG photo.');
    }
    renderCategoryPic();
  });
  $('#cf-photo-remove').addEventListener('click', () => {
    if (newCatPhoto) clearNewCatPhoto(); else dropCatPhoto = true;
    dirty = true;
    renderCategoryPic();
  });

  $('#cf-name').addEventListener('input', (e) => {
    if (!editingCat && !idTouched) $('#cf-id').value = slugify(e.target.value);
    if (!editingCat && !singleTouched) $('#cf-single').value = singular(e.target.value);
  });
  $('#cf-single').addEventListener('input', () => { singleTouched = true; });
  $('#cf-id').addEventListener('input', () => { idTouched = true; });
  $('#cf').addEventListener('input', () => { dirty = true; });

  function clearCategoryErrors() {
    setFieldError($('#cf-name'), '#cf-name-error');
    setFieldError($('#cf-single'), '#cf-single-error');
    setFieldError($('#cf-id'), '#cf-id-error');
    showError('#cf-error', '');
  }

  $('#cf').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearCategoryErrors();
    let firstBad = null;
    const bad = (input, errEl, msg) => { setFieldError(input, errEl, msg); if (!firstBad) firstBad = input; };
    const name = $('#cf-name').value.trim();
    const single = $('#cf-single').value.trim();
    const id = editingCat ? editingCat.id : slugify($('#cf-id').value);
    if (!editingCat) $('#cf-id').value = id;
    if (!name) bad($('#cf-name'), '#cf-name-error', 'Enter the category name.');
    if (!single) bad($('#cf-single'), '#cf-single-error', 'Enter the name for one item.');
    if (!editingCat) {
      if (!id) bad($('#cf-id'), '#cf-id-error', 'Enter a web address, like dining-tables.');
      else if (!SLUG_RE.test(id)) bad($('#cf-id'), '#cf-id-error', 'Use lowercase letters, numbers and dashes.');
      else if (catById[id] || id === 'all') bad($('#cf-id'), '#cf-id-error', 'This web address is already used.');
    }
    if (firstBad) { firstBad.focus(); return; }

    const row = { name, single, rep_product: $('#cf-rep').value || null, visible: $('#cf-visible').checked };
    if (!editingCat) {
      row.id = id;
      row.position = cats.reduce((m, c) => Math.max(m, c.position), 0) + 10;
    }
    const btn = $('#cf-save');
    busy(btn, true, newCatPhoto ? 'Uploading photo…' : 'Saving…');
    const uploaded = [];
    try {
      if (newCatPhoto) {
        // the tile is small, so the smaller copy is plenty
        const up = await upload(`categories/${id}/${stamp()}.${extOf(newCatPhoto.thumb)}`, newCatPhoto.thumb);
        uploaded.push(up.path);
        Object.assign(row, { photo_url: up.url, photo_path: up.path });
      } else if (dropCatPhoto) {
        Object.assign(row, { photo_url: null, photo_path: null });
      }
      const query = editingCat
        ? sb.from('categories').update(row).eq('id', editingCat.id)
        : sb.from('categories').insert(row);
      const { data, error } = await query.select().single();
      if (error) throw error;
      if (editingCat && (newCatPhoto || dropCatPhoto)) removeFiles([editingCat.photo_path]);
      uploaded.length = 0;
      clearNewCatPhoto();
      dirty = false;
      await loadAll();
      if (editingCat) {
        toast(`${data.name} saved`);
        go('#/categories');
      } else {
        // a new category stays off the website until it has a product, so go straight to adding one
        pendingCat = data.id;
        toast(`${data.name} added. Now add its first product.`);
        go('#/products/new');
      }
    } catch (err) {
      if (uploaded.length) removeFiles(uploaded);
      showError('#cf-error', friendly(err, 'This web address'));
    } finally {
      busy(btn, false);
    }
  });

  $('#cf-delete').addEventListener('click', async () => {
    const c = editingCat;
    if (inCat(c.id).length) return;
    if (!confirm(`Delete the category “${c.name}”?`)) return;
    const btn = $('#cf-delete');
    busy(btn, true, 'Deleting…');
    const { data, error } = await sb.from('categories').delete().eq('id', c.id).select();
    busy(btn, false);
    if (error || !data.length) { showError('#cf-error', error ? friendly(error) : friendly({ code: '42501' })); return; }
    removeFiles([c.photo_path]);
    dirty = false;
    await loadAll();
    toast(`${c.name} deleted`);
    go('#/categories');
  });
})();
