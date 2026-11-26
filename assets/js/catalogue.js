/*
 * Loads the catalogue (categories and products) for the shop.
 *
 * With Supabase connected in config.js, the catalogue comes from the database, so
 * changes made in the admin panel appear the next time a page is opened. If the
 * database can't be reached in time, the shop uses the copy this browser saved on
 * its last visit, and failing that the products written in data.js.
 *
 * Whatever the source, the shop gets the same shape:
 *   CATEGORIES  [{ id, name, single, rep, photo }] in home page order
 *   PRODUCTS    [{ id, cat, name, series, quote, finish, dims, mrp, price, components,
 *                  specs, photo, thumb, art }]
 *     dims        { h, d, w } in inches (any may be null), or null when none are known
 *     mrp/price   MRP and offer price in whole rupees, or null when not set
 *     components  pieces of a set: [{ code, name, dims }]
 *     specs       [[label, value], ...] in display order
 *     photo/thumb large and small photo URLs, or null
 *     art         built-in drawing from data.js, used when there is no photo
 */
(function (root) {
  'use strict';

  const cfg = root.MW_CONFIG || {};
  const bundled = root.MW_DATA;
  const CACHE_KEY = 'aaafathima-catalogue-v1';
  const TIMEOUT_MS = 6000;
  const DEFAULT_SPECS = [['Material', 'Particle board'], ['Assembly', 'Easy assembly']];
  const COLUMNS = {
    categories: 'id,name,single,position,rep_product,photo_url',
    products: 'id,category_id,name,series,quote,finish,h,d,w,mrp,price,components,specs,photo_url,thumb_url,art_key',
  };

  // built-in drawings, by model number (the database refers to them by art_key)
  const ART = Object.fromEntries(bundled.PRODUCTS.map((p) => [p.id, p.art]));

  const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
  function dimsOf(o) {
    const d = { h: num(o && o.h), d: num(o && o.d), w: num(o && o.w) };
    return d.h == null && d.d == null && d.w == null ? null : d;
  }

  function fromBundled() {
    return {
      source: 'bundled',
      CATEGORIES: bundled.CATEGORIES.map((c) => ({ id: c.id, name: c.name, single: c.single, rep: c.rep, photo: null })),
      PRODUCTS: bundled.PRODUCTS.map((p) => ({
        id: p.id, cat: p.cat, name: p.name || '', series: p.series || '', quote: p.quote || '', finish: p.finish || '',
        dims: dimsOf(p.dims),
        mrp: num(p.mrp), price: num(p.price),
        components: (p.components || []).map((c) => ({ code: c.code, name: c.name, dims: dimsOf(c.dims) })),
        specs: p.specs ? Object.entries(p.specs) : DEFAULT_SPECS,
        photo: p.photo || null, thumb: p.photo || null, art: p.art || null,
      })),
    };
  }

  function fromRows(cats, prods, source) {
    const CATEGORIES = cats.slice()
      .sort((a, b) => (a.position - b.position) || String(a.name).localeCompare(b.name))
      .map((c) => ({ id: c.id, name: c.name, single: c.single, rep: c.rep_product || null, photo: c.photo_url || null }));
    const known = new Set(CATEGORIES.map((c) => c.id));
    const PRODUCTS = prods.filter((p) => known.has(p.category_id)).map((p) => ({
      id: p.id, cat: p.category_id, name: p.name || '', series: p.series || '', quote: p.quote || '', finish: p.finish || '',
      dims: dimsOf(p),
      mrp: num(p.mrp), price: num(p.price),
      components: (Array.isArray(p.components) ? p.components : [])
        .map((c) => ({ code: c.code || '', name: c.name || '', dims: dimsOf(c) })),
      specs: (Array.isArray(p.specs) ? p.specs : []).filter((s) => Array.isArray(s) && s[0] && s[1]),
      photo: p.photo_url || null,
      thumb: p.thumb_url || p.photo_url || null,
      art: (p.art_key && ART[p.art_key]) || null,
    }));
    return { source, CATEGORIES, PRODUCTS };
  }

  async function fetchRemote() {
    const base = cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    // the publishable key alone gives the public, read-only view (hidden items are left out)
    const get = (table) => fetch(`${base}${table}?select=${COLUMNS[table]}`, {
      headers: { apikey: cfg.supabaseKey, Accept: 'application/json' },
      signal: ctrl.signal,
    }).then((r) => {
      if (!r.ok) throw new Error(`${table}: HTTP ${r.status}`);
      return r.json();
    });
    try {
      const [cats, prods] = await Promise.all([get('categories'), get('products')]);
      if (!Array.isArray(cats) || !Array.isArray(prods)) throw new Error('unexpected reply');
      return { cats, prods };
    } finally {
      clearTimeout(timer);
    }
  }

  async function load() {
    if (!cfg.supabaseUrl || !cfg.supabaseKey) return fromBundled();
    try {
      const { cats, prods } = await fetchRemote();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), cats, prods })); } catch (e) { /* storage full or blocked */ }
      return fromRows(cats, prods, 'live');
    } catch (err) {
      console.warn('Catalogue: the database could not be reached, using a saved copy.', err);
      try {
        const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (saved && Array.isArray(saved.cats) && Array.isArray(saved.prods)) return fromRows(saved.cats, saved.prods, 'saved');
      } catch (e) { /* no usable saved copy */ }
      return fromBundled();
    }
  }

  root.MWCatalogue = {
    // always resolves, so the shop can always start
    ready: load().catch((err) => { console.error('Catalogue:', err); return fromBundled(); }),
    ART, DEFAULT_SPECS, fromRows, fromBundled,
  };
})(window);
