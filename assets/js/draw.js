/*!
 * AAA Fathima Furniture drawing kit
 * - logoMark(): the AAA Fathima mark as a flat inline SVG (for tinted watermarks)
 * - render(): draws furniture as an oblique-projection SVG from simple box
 *   descriptions (see data.js). All sizes are in inches, like the catalogue.
 */
(function (root) {
  'use strict';

  const KX = 0.42;     // screen-x shift per inch of depth
  const KY = 0.26;     // screen-y shift per inch of depth
  const BOARD = 0.75;  // carcass board thickness

  const r2 = (n) => Math.round(n * 100) / 100;
  const P = (x, y, z) => [r2(x + z * KX), r2(-y - z * KY)];
  const ptsStr = (arr) => arr.map((p) => p[0] + ',' + p[1]).join(' ');
  const polygon = (arr, a = '') => `<polygon points="${ptsStr(arr)}"${a}/>`;
  const rect = (x, y, w, h, a = '') =>
    `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(Math.max(0, w))}" height="${r2(Math.max(0, h))}"${a}/>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = h || 1;
    return function () {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 10000) / 10000;
    };
  }

  /* ---------- materials ---------- */
  const MATS = {
    white:       { fill: 'url(#mw-g-white)',        edge: '#d3ccc4', handle: '#2b2725', dark: false },
    black:       { fill: 'url(#mw-g-black)',        edge: '#0e0c0b', handle: '#cfc8bf', dark: true },
    wood:        { fill: 'url(#mw-p-wood)',         edge: '#7a4a2c', handle: '#2b2725', dark: true },
    woodH:       { fill: 'url(#mw-p-wood-h)',       edge: '#7a4a2c', handle: '#2b2725', dark: true },
    darkwood:    { fill: 'url(#mw-p-darkwood)',     edge: '#3b2419', handle: '#ece5dc', dark: true },
    marbleDark:  { fill: 'url(#mw-p-marble-dark)',  edge: '#121110', handle: '#cfc8bf', dark: true },
    marbleLight: { fill: 'url(#mw-p-marble-light)', edge: '#b7ab9b', handle: '#2b2725', dark: false },
    blue:        { fill: 'url(#mw-g-blue)',         edge: '#7ea6c1', handle: '#2b2725', dark: false },
    sky:         { fill: 'url(#mw-g-sky)',          edge: '#2f82b2', handle: '#1f1c1b', dark: false },
    rust:        { fill: 'url(#mw-p-rust)',         edge: '#5a2c18', handle: '#efe7dc', dark: true },
    gold:        { fill: 'url(#mw-g-gold)',         edge: '#9c7a45', handle: '#2b2725', dark: false },
    green:       { fill: 'url(#mw-g-green)',        edge: '#264d33', handle: '#ffffff', dark: true },
    pink:        { fill: 'url(#mw-g-pink)',         edge: '#a9547f', handle: '#ffffff', dark: false },
    printJungle: { fill: 'url(#mw-p-jungle)',       edge: '#1f4a30', handle: '#f6f1e8', dark: true },
    printGalaxy: { fill: 'url(#mw-p-galaxy)',       edge: '#261d4f', handle: '#f6f1e8', dark: true },
  };
  const mat = (name) => MATS[name] || MATS.white;

  /* ---------- shared <defs>, injected once per page ---------- */
  function woodTile(base, dark, light) {
    return `<rect width="10" height="48" fill="${base}"/>
<path d="M1.2 0C1.7 12 .7 24 1.4 36S1 46 1.2 48" stroke="${dark}" stroke-width=".35" fill="none" opacity=".75"/>
<path d="M3.4 0C3 14 3.9 27 3.3 40S3.5 47 3.4 48" stroke="${light}" stroke-width=".6" fill="none" opacity=".45"/>
<path d="M5.7 0C6.3 10 5.3 30 6 40S5.6 47 5.7 48" stroke="${dark}" stroke-width=".25" fill="none" opacity=".6"/>
<path d="M7.9 0C7.4 18 8.5 30 7.8 42S7.9 47 7.9 48" stroke="${dark}" stroke-width=".5" fill="none" opacity=".4"/>
<path d="M9.2 0C9.5 20 8.8 34 9.3 44S9.2 47 9.2 48" stroke="${light}" stroke-width=".3" fill="none" opacity=".5"/>`;
  }

  function defs() {
    const lg = (id, a, b, x2 = 1, y2 = 1) =>
      `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
    return `<svg class="mw-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
${lg('mw-g-white', '#ffffff', '#e8e3dd')}
${lg('mw-g-black', '#3b3633', '#1b1817')}
${lg('mw-g-blue', '#b4d3e7', '#86b3d2')}
${lg('mw-g-sky', '#71c4ec', '#3b9bd0')}
${lg('mw-g-gold', '#e4c48b', '#b08648')}
${lg('mw-g-green', '#4a9663', '#2b6741')}
${lg('mw-g-pink', '#eea6cb', '#d27aa8')}
${lg('mw-g-copper', '#d39a72', '#9c5533')}
<linearGradient id="mw-g-mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f5f7"/><stop offset=".55" stop-color="#c9d6dd"/><stop offset="1" stop-color="#aebec8"/></linearGradient>
<linearGradient id="mw-g-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d434a"/><stop offset="1" stop-color="#101214"/></linearGradient>
<linearGradient id="mw-shade-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="mw-shade-left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="mw-shadow"><stop offset="0" stop-color="#3a281e" stop-opacity=".26"/><stop offset=".65" stop-color="#3a281e" stop-opacity=".1"/><stop offset="1" stop-color="#3a281e" stop-opacity="0"/></radialGradient>
<radialGradient id="mw-glow" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff1c9" stop-opacity=".95"/><stop offset=".45" stop-color="#f6c06a" stop-opacity=".55"/><stop offset="1" stop-color="#f6c06a" stop-opacity="0"/></radialGradient>
<pattern id="mw-p-wood" patternUnits="userSpaceOnUse" width="10" height="48">${woodTile('#a96d42', '#7f4b2d', '#c99063')}</pattern>
<pattern id="mw-p-wood-h" patternUnits="userSpaceOnUse" width="10" height="48" patternTransform="rotate(90)">${woodTile('#a96d42', '#7f4b2d', '#c99063')}</pattern>
<pattern id="mw-p-darkwood" patternUnits="userSpaceOnUse" width="10" height="48">${woodTile('#5f3c2b', '#3f271b', '#7a5440')}</pattern>
<pattern id="mw-p-marble-dark" patternUnits="userSpaceOnUse" width="60" height="60">
<rect width="60" height="60" fill="#2d2b2a"/>
<path d="M-4 12C10 16 18 6 30 14S50 30 64 22" stroke="#e7e1d8" stroke-width=".35" fill="none" opacity=".4"/>
<path d="M-4 40C8 34 20 46 34 40S52 50 64 44" stroke="#e7e1d8" stroke-width=".25" fill="none" opacity=".3"/>
<path d="M20 -4C24 12 16 26 26 38S28 56 22 64" stroke="#bfb6aa" stroke-width=".3" fill="none" opacity=".35"/>
</pattern>
<pattern id="mw-p-marble-light" patternUnits="userSpaceOnUse" width="60" height="60">
<rect width="60" height="60" fill="#ddd3c5"/>
<path d="M-4 14C10 18 18 8 30 16S50 32 64 24" stroke="#a89a87" stroke-width=".35" fill="none" opacity=".6"/>
<path d="M-4 44C8 38 20 50 34 44S52 54 64 48" stroke="#b9ac9b" stroke-width=".3" fill="none" opacity=".5"/>
<path d="M38 -4C42 12 34 26 44 38S46 56 40 64" stroke="#c4b8a8" stroke-width=".4" fill="none" opacity=".5"/>
</pattern>
<filter id="mw-f-rust" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="4" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .13  0 0 0 0 .06  0 0 0 2.2 -.9"/></filter>
<filter id="mw-f-rust-hi" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".22" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .5  0 0 0 0 .3  0 0 0 2 -1.1"/></filter>
<pattern id="mw-p-rust" patternUnits="userSpaceOnUse" width="40" height="40">
<rect width="40" height="40" fill="#8d4b2c"/>
<rect width="40" height="40" filter="url(#mw-f-rust)"/>
<rect width="40" height="40" filter="url(#mw-f-rust-hi)" opacity=".7"/>
</pattern>
<pattern id="mw-p-jungle" patternUnits="userSpaceOnUse" width="16" height="16">
<rect width="16" height="16" fill="#2f6b45"/>
<ellipse cx="4" cy="4" rx="3" ry="1.3" transform="rotate(-35 4 4)" fill="#8cc56b"/>
<ellipse cx="12" cy="9" rx="3.2" ry="1.2" transform="rotate(30 12 9)" fill="#1f4f33"/>
<circle cx="11" cy="3" r="1.3" fill="#f2c14e"/><circle cx="5" cy="12" r="1.5" fill="#e9724c"/>
<ellipse cx="13" cy="14" rx="2" ry=".9" transform="rotate(-20 13 14)" fill="#8cc56b"/>
</pattern>
<pattern id="mw-p-galaxy" patternUnits="userSpaceOnUse" width="14" height="14">
<rect width="14" height="14" fill="#3a2d6b"/>
<circle cx="3.5" cy="4" r="2.2" fill="#e58fc9" opacity=".9"/><circle cx="10.5" cy="10" r="2.6" fill="#8fb5f0" opacity=".85"/>
<circle cx="11" cy="3" r=".5" fill="#fff"/><circle cx="4" cy="11" r=".4" fill="#fff"/><circle cx="7.5" cy="7" r=".9" fill="#f6e27a"/>
</pattern>
</defs></svg>`;
  }

  /* ---------- the AAA Fathima mark ---------- */
  // Silhouette traced from the client's logo (same paths as assets/img/logo-mark.svg).
  // One path per piece, in assembly order for the hero reveal:
  // frame and bars, the four feet, the centre "A", then the arch on top.
  const MARK_PATHS = [
    'M38 314 38 347 42 352 114 354 118 360 0 629 1 637 15 655 44 656 50 652 77 588 90 571 728 571 738 578 772 655 803 656 819 634 705 360 710 354 780 353 785 347 783 310 752 310 744 314 705 309 624 310 614 321 565 414 565 425 587 475 592 477 639 388 651 378 715 516 712 524 667 525 110 524 106 517 171 377 181 384 232 477 247 451 259 415 215 332 199 310 41 310Z',
    'M252 588 248 585 201 587 160 669 164 672 219 670Z',
    'M268 588 301 671 352 673 360 669 321 586 272 585Z',
    'M555 588 551 585 504 586 463 664 463 670 468 673 520 671Z',
    'M571 588 603 670 609 673 658 673 663 670 663 662 625 587 575 585Z',
    'M390 136 285 385 243 492 243 501 255 504 293 502 320 438 329 432 490 432 505 445 529 502 577 503 580 499 577 486 437 139 432 135ZM410 222 420 234 479 378 477 386 353 387 344 383 381 283Z',
    'M174 34 160 57 153 81 157 125 200 254 267 371 274 366 274 352 208 98 210 79 227 57 250 48 555 47 579 50 595 58 611 79 613 99 548 352 550 369 557 367 620 252 665 113 665 68 655 45 636 23 609 7 573 0 236 0 199 13Z',
  ];
  function logoMark(o = {}) {
    const cls = o.cls ? ` class="${o.cls}"` : '';
    const fill = o.color || 'currentColor';
    return `<svg${cls} viewBox="0 0 820 674" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<g fill="${fill}" fill-rule="evenodd">${MARK_PATHS.map((d, i) => `<path class="logo-piece" style="--i:${i}" d="${d}"/>`).join('')}</g>
</svg>`;
  }

  /* ---------- layout DSL ---------- */
  const L = {
    H: (...kids) => ({ split: 'h', kids }),
    V: (...kids) => ({ split: 'v', kids }),
    Hg: (gap, ...kids) => ({ split: 'h', gap, kids }),
    Vg: (gap, ...kids) => ({ split: 'v', gap, kids }),
    door: (m, o = {}) => Object.assign({ t: 'door', mat: m }, o),
    drawers: (n, m, o = {}) => Object.assign({ t: 'drawers', n, mat: m }, o),
    shelves: (n, o = {}) => Object.assign({ t: 'shelves', n }, o),
    open: (o = {}) => Object.assign({ t: 'shelves', n: 1 }, o),
    mirror: (o = {}) => Object.assign({ t: 'mirror' }, o),
    panel: (m, o = {}) => Object.assign({ t: 'panel', mat: m }, o),
    slats: (m, o = {}) => Object.assign({ t: 'slats', mat: m }, o),
    cushion: (m, o = {}) => Object.assign({ t: 'cushion', mat: m }, o),
    glass: (o = {}) => Object.assign({ t: 'glass' }, o),
    pair: (m, o = {}) => ({
      split: 'h',
      kids: [Object.assign({ t: 'door', mat: m, side: 'r' }, o), Object.assign({ t: 'door', mat: m, side: 'l' }, o)],
    }),
  };

  function layout(node, x, y, w, h, ctx) {
    if (!node) return '';
    if (node.split) {
      const kids = node.kids.map((k) => (Array.isArray(k) ? k : [1, k]));
      const total = kids.reduce((s, k) => s + k[0], 0);
      const gap = node.gap != null ? node.gap : ctx.gap;
      const span = (node.split === 'h' ? w : h) - gap * (kids.length - 1);
      let cur = node.split === 'h' ? x : y;
      let out = '';
      kids.forEach(([wt, kid]) => {
        const size = (span * wt) / total;
        out += node.split === 'h' ? layout(kid, cur, y, size, h, ctx) : layout(kid, x, cur, w, size, ctx);
        cur += size + gap;
      });
      return out;
    }
    return leaf(node, x, y, w, h, ctx);
  }

  function sheen(x, y, w, h, dark) {
    const op = dark ? 0.09 : 0.55;
    return polygon([[r2(x + w * 0.1), r2(y + h)], [r2(x + w * 0.34), r2(y + h)], [r2(x + w * 0.9), r2(y)], [r2(x + w * 0.66), r2(y)]],
      ` fill="#fff" opacity="${op}"`);
  }

  function handle(type, side, m, x, y, w, h, n) {
    if (type === 'none') return '';
    const col = n.handleColor || (type.indexOf('gold') === 0 ? '#caa266' : m.handle);
    const edgeX = side === 'l' ? x + 1.3 : x + w - 1.3;
    if (type === 'knob') {
      const cx = side === 'c' ? x + w / 2 : edgeX;
      return `<circle cx="${r2(cx)}" cy="${r2(y + h * (n.hy != null ? n.hy : 0.5))}" r=".72" fill="${col}"/>`;
    }
    if (type === 'bar-h') {
      const len = Math.min(8, w * 0.45);
      return rect(x + w / 2 - len / 2, y + Math.min(2, h * 0.22), len, 0.55, ` rx=".27" fill="${col}"`);
    }
    const long = type === 'long-v' || type === 'gold-long';
    const len = long ? h * 0.62 : Math.min(9, h * 0.32);
    const cy = y + h * (n.hy != null ? n.hy : long ? 0.5 : h > 40 ? 0.46 : 0.5);
    return rect(edgeX - 0.3, cy - len / 2, long ? 0.7 : 0.6, len, ` rx=".3" fill="${col}"`);
  }

  function books(x, y, w, h, rand) {
    const cols = ['#7b3f2e', '#2f4858', '#c9a66b', '#6b705c', '#e6dccb', '#3e2c23', '#9c5533', '#b8c4c9'];
    let s = '';
    let cx = x + 0.4;
    const limit = x + w * (0.5 + rand() * 0.4);
    while (cx < limit) {
      const bw = 0.7 + rand() * 0.8;
      const bh = h * (0.6 + rand() * 0.28);
      if (cx + bw > x + w - 0.3) break;
      s += rect(cx, y + h - bh, bw, bh, ` fill="${cols[Math.floor(rand() * cols.length)]}"`);
      s += rect(cx, y + h - bh * 0.82, bw, 0.22, ' fill="#fff" opacity=".35"');
      cx += bw + 0.08;
    }
    return s;
  }

  function decor(x, y, w, h, rand) {
    const pick = rand();
    const base = y + h;
    const cx = x + w * (0.3 + rand() * 0.4);
    if (pick < 0.4) { // vase with stems
      const vh = Math.min(h * 0.38, 4.2), vw = Math.min(w * 0.18, 2.2);
      const col = ['#e9e2d7', '#9c5533', '#2b2725'][Math.floor(rand() * 3)];
      return `<ellipse cx="${r2(cx)}" cy="${r2(base - vh / 2)}" rx="${r2(vw / 2)}" ry="${r2(vh / 2)}" fill="${col}"/>` +
        `<path d="M${r2(cx)} ${r2(base - vh)}q-.6 ${r2(-h * 0.25)} -1.6 ${r2(-h * 0.35)}M${r2(cx)} ${r2(base - vh)}q.8 ${r2(-h * 0.2)} 1.8 ${r2(-h * 0.3)}" stroke="#5f7d4f" stroke-width=".22" fill="none"/>`;
    }
    if (pick < 0.75) { // potted plant
      const ph = Math.min(h * 0.28, 2.6), pw = Math.min(w * 0.22, 2.6);
      const lh = Math.min(h * 0.4, 4.5);
      return polygon([[r2(cx - pw / 2), r2(base - ph)], [r2(cx + pw / 2), r2(base - ph)], [r2(cx + pw * 0.35), r2(base)], [r2(cx - pw * 0.35), r2(base)]], ' fill="#e8e1d6"') +
        `<ellipse cx="${r2(cx - pw * 0.3)}" cy="${r2(base - ph - lh * 0.45)}" rx="${r2(pw * 0.32)}" ry="${r2(lh * 0.5)}" transform="rotate(-25 ${r2(cx - pw * 0.3)} ${r2(base - ph - lh * 0.45)})" fill="#4f7a4c"/>` +
        `<ellipse cx="${r2(cx + pw * 0.3)}" cy="${r2(base - ph - lh * 0.4)}" rx="${r2(pw * 0.3)}" ry="${r2(lh * 0.45)}" transform="rotate(25 ${r2(cx + pw * 0.3)} ${r2(base - ph - lh * 0.4)})" fill="#6b9a5f"/>` +
        `<ellipse cx="${r2(cx)}" cy="${r2(base - ph - lh * 0.55)}" rx="${r2(pw * 0.28)}" ry="${r2(lh * 0.55)}" fill="#3e6b42"/>`;
    }
    // stacked books lying flat
    let s = '';
    const cols = ['#c9a66b', '#2f4858', '#e6dccb', '#7b3f2e'];
    const bw = Math.min(w * 0.5, 6);
    for (let i = 0; i < 3; i++) {
      s += rect(cx - bw / 2 + rand() * 0.6, base - (i + 1) * 0.75, bw - i * 0.5, 0.7, ` fill="${cols[(i + Math.floor(rand() * 4)) % 4]}"`);
    }
    return s;
  }

  function leaf(n, x, y, w, h, ctx) {
    const m = mat(n.mat || ctx.body);
    const gl = ctx.gloss || n.gloss;
    let s = '';
    switch (n.t) {
      case 'door': {
        s += rect(x, y, w, h, ` fill="${m.fill}" stroke="${m.edge}" stroke-width=".18"`);
        if (gl) s += sheen(x, y, w, h, m.dark);
        s += handle(n.handle || 'bar-v', n.side || 'r', m, x, y, w, h, n);
        return s;
      }
      case 'drawers': {
        const k = n.n || 1, g = 0.45;
        const dh = (h - g * (k - 1)) / k;
        for (let i = 0; i < k; i++) {
          const dy = y + i * (dh + g);
          s += rect(x, dy, w, dh, ` fill="${m.fill}" stroke="${m.edge}" stroke-width=".18"`);
          if (gl) s += sheen(x, dy, w, dh, m.dark);
          if (n.handle === 'knob') s += `<circle cx="${r2(x + w / 2)}" cy="${r2(dy + dh / 2)}" r=".75" fill="${m.handle}"/>`;
          else if (n.handle !== 'none') {
            const len = Math.min(7, w * 0.42);
            const hy = dh < 7 ? dy + dh / 2 - 0.27 : dy + 1.7;
            s += rect(x + w / 2 - len / 2, hy, len, 0.55, ` rx=".27" fill="${m.handle}"`);
          }
        }
        return s;
      }
      case 'shelves': {
        const sm = mat(n.mat || ctx.body);
        const k = n.n || 1, tb = BOARD * 0.85;
        const ch = (h - tb * (k - 1)) / k;
        s += rect(x, y, w, h, ` fill="${sm.fill}"`) + rect(x, y, w, h, ` fill="#120a06" opacity="${sm.dark ? 0.36 : 0.16}"`);
        for (let i = 0; i < k; i++) {
          const cy = y + i * (ch + tb);
          const wantBooks = n.books === true || (Array.isArray(n.books) && n.books.indexOf(i) > -1);
          if (wantBooks) s += books(x, cy, w, ch, ctx.rand);
          else if (n.decor && ctx.rand() > 0.3) s += decor(x, cy, w, ch, ctx.rand);
          s += rect(x, cy, w, Math.min(ch * 0.4, 3.2), ' fill="url(#mw-shade-top)"');
          s += rect(x, cy, Math.min(w * 0.18, 1.8), ch, ' fill="url(#mw-shade-left)"');
          if (n.lights) {
            s += rect(x, cy, w, ch, ' fill="url(#mw-glow)"');
            s += rect(x + w * 0.2, cy + 0.1, w * 0.6, 0.25, ' fill="#fff6dc"');
          }
          if (i < k - 1) {
            s += rect(x, cy + ch, w, tb, ` fill="${sm.fill}"`);
            s += rect(x, cy + ch, w, 0.16, ' fill="#fff" opacity=".28"');
          }
        }
        return s;
      }
      case 'mirror': {
        s += rect(x, y, w, h, ' fill="url(#mw-g-mirror)" stroke="#97a6ae" stroke-width=".2"');
        s += polygon([[r2(x + w * 0.08), r2(y + h)], [r2(x + w * 0.3), r2(y + h)], [r2(x + w * 0.82), r2(y)], [r2(x + w * 0.6), r2(y)]], ' fill="#fff" opacity=".45"');
        s += polygon([[r2(x + w * 0.38), r2(y + h)], [r2(x + w * 0.45), r2(y + h)], [r2(x + w * 0.97), r2(y)], [r2(x + w * 0.9), r2(y)]], ' fill="#fff" opacity=".35"');
        return s;
      }
      case 'panel': {
        s += rect(x, y, w, h, ` fill="${m.fill}"`);
        if (gl) s += sheen(x, y, w, h, m.dark);
        return s;
      }
      case 'slats': {
        s += rect(x, y, w, h, ' fill="#1d1918"');
        const count = Math.max(3, Math.round(w / 2.1));
        const pitch = w / count;
        for (let i = 0; i < count; i++) s += rect(x + i * pitch + pitch * 0.12, y, pitch * 0.76, h, ` fill="${m.fill}"`);
        return s;
      }
      case 'cushion': {
        const rx = Math.min(h * 0.16, 1.4);
        s += rect(x, y, w, h, ` rx="${r2(rx)}" fill="${m.fill}"`);
        if (n.tufted) {
          const rows = h > 9 ? 3 : 2;
          const cols = Math.max(3, Math.floor(w / 4));
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const off = r % 2 ? 0.5 : 0;
              const bx = x + (w / cols) * (c + 0.25 + off * 0.5 + 0.25);
              const by = y + (h / rows) * (r + 0.5);
              if (bx < x + w - 0.8) s += `<circle cx="${r2(bx)}" cy="${r2(by)}" r=".32" fill="#000" opacity=".5"/><circle cx="${r2(bx - 0.1)}" cy="${r2(by - 0.1)}" r=".12" fill="#fff" opacity=".35"/>`;
            }
          }
        }
        if (gl || n.gloss) s += sheen(x, y, w, h, true);
        s += rect(x, y + 0.2, w, Math.min(h * 0.2, 1.4), ` rx="${r2(rx)}" fill="#fff" opacity=".07"`);
        return s;
      }
      case 'glass': {
        s += rect(x, y, w, h, ` fill="${m.fill}" stroke="${m.edge}" stroke-width=".18"`);
        s += rect(x + 0.8, y + 0.8, w - 1.6, h - 1.6, ' fill="#c6d7de" opacity=".7"');
        s += polygon([[r2(x + w * 0.2), r2(y + h - 0.8)], [r2(x + w * 0.38), r2(y + h - 0.8)], [r2(x + w * 0.8), r2(y + 0.8)], [r2(x + w * 0.62), r2(y + 0.8)]], ' fill="#fff" opacity=".45"');
        s += handle('bar-v', n.side || 'r', m, x, y, w, h, n);
        return s;
      }
      default:
        return '';
    }
  }

  /* ---------- items ---------- */
  function legs(b, which) {
    const type = b.legs.type || 'tapered';
    const lmName = b.legs.mat || 'black';
    const lm = mat(lmName);
    const x = b.x || 0, z = b.z || 0, w = b.w, d = b.d, H = b.y || 0;
    const ins = b.legs.inset != null ? b.legs.inset : 1.6;
    const zs = which === 'back' ? z + d - ins : z + ins;
    let s = '';
    [x + ins, x + w - ins].forEach((lx, i) => {
      if (type === 'tapered') {
        const sp = (i === 0 ? -1 : 1) * Math.min(1.2, H * 0.2);
        const t = P(lx, H, zs), bt = P(lx + sp, 0, zs);
        s += polygon([[r2(t[0] - 0.75), t[1]], [r2(t[0] + 0.75), t[1]], [r2(bt[0] + 0.38), bt[1]], [r2(bt[0] - 0.38), bt[1]]], ` fill="${lm.fill}"`);
      } else if (type === 'block') {
        s += boxSvg({ x: lx - 1.1, y: 0, z: zs - 1.1, w: 2.2, h: H, d: 2.2, mat: lmName }, {});
      } else if (type === 'castor') {
        const c = P(lx, H / 2, zs);
        s += `<circle cx="${c[0]}" cy="${c[1]}" r="${r2(H / 2)}" fill="#2a2624"/>`;
      }
    });
    return s;
  }

  function boxSvg(b, ctx) {
    const x = b.x || 0, y = b.y || 0, z = b.z || 0, w = b.w, h = b.h, d = b.d;
    const m = mat(b.mat), sideM = mat(b.side || b.mat), topM = mat(b.top || b.mat);
    let s = '';
    if (b.plinth) s += boxSvg({ x: x + 1, y: 0, z: z + 1.2, w: w - 2, h: y, d: d - 2.4, mat: b.plinth }, ctx);
    if (b.legs) s += legs(b, 'back');
    const side = [P(x + w, y, z), P(x + w, y, z + d), P(x + w, y + h, z + d), P(x + w, y + h, z)];
    s += polygon(side, ` fill="${sideM.fill}"`) + polygon(side, ` fill="#1a0f0a" opacity="${sideM.dark ? 0.34 : 0.15}"`);
    const top = [P(x, y + h, z), P(x + w, y + h, z), P(x + w, y + h, z + d), P(x, y + h, z + d)];
    s += polygon(top, ` fill="${topM.fill}"`) + polygon(top, ` fill="#fff" opacity="${topM.dark ? 0.1 : 0.4}"`);
    const f = P(x, y + h, z);
    s += rect(f[0], f[1], w, h, ` fill="${m.fill}"`);
    if (b.front) {
      const ins = b.inset != null ? b.inset : BOARD;
      const c2 = Object.assign({}, ctx, { body: b.mat, gloss: !!b.gloss });
      s += layout(b.front, f[0] + ins, f[1] + ins, w - 2 * ins, h - 2 * ins, c2);
    } else if (b.gloss) {
      s += sheen(f[0], f[1], w, h, m.dark);
    }
    s += polygon([P(x, y, z), P(x + w, y, z), P(x + w, y, z + d), P(x + w, y + h, z + d), P(x, y + h, z + d), P(x, y + h, z)],
      ' fill="none" stroke="#2a1a12" stroke-opacity=".3" stroke-width=".18" stroke-linejoin="round"');
    if (b.legs) s += legs(b, 'front');
    return s;
  }

  function tvSvg(t) {
    const f = P(t.x, t.y + t.h, t.z);
    let s = '';
    if (t.stand) {
      const a = P(t.x + t.w * 0.2, t.y, t.z), c = P(t.x + t.w * 0.8, t.y, t.z);
      s += polygon([[a[0] - 1, a[1]], [a[0] + 2, a[1]], [a[0] + 1, a[1] - 2.2]], ' fill="#1a1a1a"');
      s += polygon([[c[0] - 2, c[1]], [c[0] + 1, c[1]], [c[0] - 1, c[1] - 2.2]], ' fill="#1a1a1a"');
      f[1] -= 1.6;
    }
    s += rect(f[0], f[1], t.w, t.h, ' rx=".5" fill="#141414"');
    s += rect(f[0] + 0.5, f[1] + 0.5, t.w - 1, t.h - 1.2, ' fill="url(#mw-g-screen)"');
    s += polygon([[r2(f[0] + t.w * 0.55), r2(f[1] + 0.5)], [r2(f[0] + t.w * 0.75), r2(f[1] + 0.5)], [r2(f[0] + t.w * 0.45), r2(f[1] + t.h - 0.7)], [r2(f[0] + t.w * 0.25), r2(f[1] + t.h - 0.7)]], ' fill="#fff" opacity=".06"');
    return s;
  }

  function vaseSvg(v) {
    const s = v.s || 1;
    const b = P(v.x, v.y, v.z);
    const vh = 4 * s, vw = 2.2 * s;
    let out = `<ellipse cx="${b[0]}" cy="${r2(b[1] - vh / 2)}" rx="${r2(vw / 2)}" ry="${r2(vh / 2)}" fill="${v.color || '#3f6fa0'}"/>`;
    out += `<path d="M${b[0]} ${r2(b[1] - vh)}q-1 -3 -2.4 -4.6M${b[0]} ${r2(b[1] - vh)}q.4 -3.4 .6 -5.6M${b[0]} ${r2(b[1] - vh)}q1.2 -2.6 2.6 -3.8" stroke="#5c7d4c" stroke-width=".25" fill="none"/>`;
    const fl = v.flower || '#e9a3a8';
    out += `<circle cx="${r2(b[0] - 2.4)}" cy="${r2(b[1] - vh - 4.6)}" r=".9" fill="${fl}"/><circle cx="${r2(b[0] + 0.6)}" cy="${r2(b[1] - vh - 5.6)}" r="1" fill="${fl}"/><circle cx="${r2(b[0] + 2.6)}" cy="${r2(b[1] - vh - 3.8)}" r=".85" fill="${fl}"/>`;
    return out;
  }

  function plantSvg(v) {
    const s = v.s || 1;
    const b = P(v.x, v.y, v.z);
    const ph = 5 * s, pw = 4.6 * s;
    let out = polygon([[r2(b[0] - pw / 2), r2(b[1] - ph)], [r2(b[0] + pw / 2), r2(b[1] - ph)], [r2(b[0] + pw * 0.36), b[1]], [r2(b[0] - pw * 0.36), b[1]]], ' fill="#ece5da"');
    const leaves = [[-2.4, -9, -30, 1.6, 4.6, '#4f7a4c'], [2.2, -9.5, 28, 1.5, 4.8, '#6b9a5f'], [0, -11.5, 0, 1.4, 5.6, '#3e6b42'], [-3.6, -7, -55, 1.2, 3.4, '#6b9a5f'], [3.6, -7.4, 55, 1.2, 3.4, '#4f7a4c']];
    leaves.forEach(([dx, dy, rot, rx, ry, col]) => {
      const cx = r2(b[0] + dx * s), cy = r2(b[1] + dy * s);
      out += `<ellipse cx="${cx}" cy="${cy}" rx="${r2(rx * s)}" ry="${r2(ry * s)}" transform="rotate(${rot} ${cx} ${cy})" fill="${col}"/>`;
    });
    return out;
  }

  function roundMirrorSvg(v) {
    const c = P(v.x, v.y, v.z);
    return `<circle cx="${c[0]}" cy="${c[1]}" r="${v.r}" fill="url(#mw-g-copper)"/><circle cx="${c[0]}" cy="${c[1]}" r="${r2(v.r * 0.84)}" fill="url(#mw-g-mirror)"/>` +
      `<path d="M${r2(c[0] - v.r * 0.5)} ${r2(c[1] + v.r * 0.3)}L${r2(c[0] + v.r * 0.2)} ${r2(c[1] - v.r * 0.6)}" stroke="#fff" stroke-width="${r2(v.r * 0.14)}" opacity=".5"/>`;
  }

  function itemSvg(it, ctx) {
    switch (it.kind || 'box') {
      case 'tv': return tvSvg(it);
      case 'vase': return vaseSvg(it);
      case 'plant': return plantSvg(it);
      case 'roundMirror': return roundMirrorSvg(it);
      default: return boxSvg(it, ctx);
    }
  }

  function shadowSvg(b) {
    const x = b.x || 0, z = b.z || 0;
    const c = P(x + b.w / 2, 0, z + b.d / 2);
    const rx = (b.w + b.d * KX) * 0.6;
    const ry = Math.max(b.d * KY * 0.95, 2.4) + 1.2;
    return `<ellipse cx="${c[0]}" cy="${r2(c[1] + 0.6)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="url(#mw-shadow)"/>`;
  }

  /* ---------- bounds ---------- */
  function bounds(items) {
    const bb = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const add = (p) => {
      if (p[0] < bb.minX) bb.minX = p[0];
      if (p[0] > bb.maxX) bb.maxX = p[0];
      if (p[1] < bb.minY) bb.minY = p[1];
      if (p[1] > bb.maxY) bb.maxY = p[1];
    };
    items.forEach((it) => {
      const k = it.kind || 'box';
      if (k === 'box') {
        const x = it.x || 0, y = it.y || 0, z = it.z || 0;
        const y0 = it.legs || it.plinth ? 0 : y;
        [x, x + it.w].forEach((X) => [y0, y + it.h].forEach((Y) => [z, z + it.d].forEach((Z) => add(P(X, Y, Z)))));
        if (it.legs && it.legs.type === 'tapered') { add(P(x - 1.5, 0, z)); add(P(x + it.w + 1.5, 0, z + it.d)); }
      } else if (k === 'tv') {
        add(P(it.x, it.y, it.z)); add(P(it.x + it.w, it.y + it.h + (it.stand ? 1.6 : 0), it.z));
      } else if (k === 'roundMirror') {
        const c = P(it.x, it.y, it.z);
        add([c[0] - it.r, c[1] - it.r]); add([c[0] + it.r, c[1] + it.r]);
      } else {
        const s = it.s || 1;
        const c = P(it.x, it.y, it.z);
        add([c[0] - 5 * s, c[1] - 15 * s]); add([c[0] + 5 * s, c[1]]);
      }
    });
    return bb;
  }

  function worldBox(items) {
    const w = { X0: Infinity, X1: -Infinity, Y1: -Infinity, Z0: Infinity, Z1: -Infinity };
    items.forEach((it) => {
      if ((it.kind || 'box') !== 'box') return;
      const x = it.x || 0, y = it.y || 0, z = it.z || 0;
      w.X0 = Math.min(w.X0, x); w.X1 = Math.max(w.X1, x + it.w);
      w.Y1 = Math.max(w.Y1, y + it.h);
      w.Z0 = Math.min(w.Z0, z); w.Z1 = Math.max(w.Z1, z + it.d);
    });
    return w;
  }

  /* ---------- dimension lines (H | D | W labels from the catalogue) ---------- */
  function dimensionSvg(art, dims, span) {
    const m = art.measure
      ? { X0: art.measure.x || 0, X1: (art.measure.x || 0) + art.measure.w, Y1: art.measure.h, Z0: art.measure.z || 0, Z1: (art.measure.z || 0) + art.measure.d }
      : worldBox(art.items);
    const fs = Math.max(2.6, Math.min(6.5, span / 15));
    const off = fs * 1.5;
    const col = '#9c5533';
    const line = (a, b, extra = '') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${col}" stroke-width="${r2(fs * 0.06)}"${extra}/>`;
    const tick = (p) => line([r2(p[0] - fs * 0.3), r2(p[1] + fs * 0.3)], [r2(p[0] + fs * 0.3), r2(p[1] - fs * 0.3)]);
    const dash = ` stroke-dasharray="${r2(fs * 0.25)} ${r2(fs * 0.2)}" opacity=".7"`;
    const text = (p, label, rot) => `<text x="${p[0]}" y="${p[1]}" font-size="${r2(fs)}" fill="${col}" text-anchor="middle" dominant-baseline="middle" class="mw-dimtext"${rot ? ` transform="rotate(${rot} ${p[0]} ${p[1]})"` : ''}>${esc(label)}</text>`;
    let s = '';
    const extents = [];
    if (dims.h != null) {
      const a = P(m.X0 - off, 0, m.Z0), b = P(m.X0 - off, m.Y1, m.Z0);
      s += line(P(m.X0 - 0.6, 0, m.Z0), P(m.X0 - off - fs * 0.4, 0, m.Z0), dash) + line(P(m.X0 - 0.6, m.Y1, m.Z0), P(m.X0 - off - fs * 0.4, m.Y1, m.Z0), dash);
      s += line(a, b) + tick(a) + tick(b);
      const mid = [r2(a[0] - fs * 0.8), r2((a[1] + b[1]) / 2)];
      s += text(mid, 'H.' + dims.h, -90);
      extents.push([mid[0] - fs, mid[1]]);
    }
    if (dims.w != null) {
      const a = P(m.X0, -off, m.Z0), b = P(m.X1, -off, m.Z0);
      s += line(P(m.X0, -0.8, m.Z0), P(m.X0, -off - fs * 0.4, m.Z0), dash) + line(P(m.X1, -0.8, m.Z0), P(m.X1, -off - fs * 0.4, m.Z0), dash);
      s += line(a, b) + tick(a) + tick(b);
      const mid = [r2((a[0] + b[0]) / 2), r2(a[1] + fs * 0.95)];
      s += text(mid, 'W.' + dims.w);
      extents.push([mid[0], mid[1] + fs * 0.8]);
    }
    if (dims.d != null) {
      const a = P(m.X1 + off, 0, m.Z0), b = P(m.X1 + off, 0, m.Z1);
      s += line(P(m.X1 + 0.6, 0, m.Z0), P(m.X1 + off + fs * 0.4, 0, m.Z0), dash) + line(P(m.X1 + 0.6, 0, m.Z1), P(m.X1 + off + fs * 0.4, 0, m.Z1), dash);
      s += line(a, b) + tick(a) + tick(b);
      const mid = [r2((a[0] + b[0]) / 2 + fs * 1.5), r2((a[1] + b[1]) / 2 + fs * 0.5)];
      s += text(mid, 'D.' + dims.d);
      extents.push([mid[0] + fs * 1.6, mid[1] + fs * 0.6]);
    }
    return { svg: s, extents };
  }

  /* ---------- public render ---------- */
  function render(art, opts = {}) {
    const items = art.items;
    const ctx = { rand: rng(opts.seed || 'mw'), gap: 0.6 };
    const bb = bounds(items);
    // floor shadow sits a little below the lowest point
    bb.maxY += 2.5;
    let body = '';
    items.forEach((it) => {
      if ((it.kind || 'box') === 'box' && (it.y || 0) < 9 && !it.noShadow) body += shadowSvg(it);
    });
    items.forEach((it, i) => {
      const g = itemSvg(it, ctx);
      body += opts.pieces ? `<g class="piece" style="--i:${i}">${g}</g>` : g;
    });
    const spanX = bb.maxX - bb.minX, spanY = bb.maxY - bb.minY;
    let dimsSvg = '';
    if (opts.dims) {
      const res = dimensionSvg(art, opts.dims, Math.max(spanX, spanY));
      dimsSvg = res.svg;
      const fs = Math.max(2.6, Math.min(6.5, Math.max(spanX, spanY) / 15));
      bb.minX -= fs * 3.6; bb.maxX += fs * 4.2; bb.maxY += fs * 3.2;
      res.extents.forEach((p) => {
        bb.minX = Math.min(bb.minX, p[0]); bb.maxX = Math.max(bb.maxX, p[0]);
        bb.maxY = Math.max(bb.maxY, p[1]);
      });
    }
    const pad = Math.max(spanX, spanY) * (opts.pad != null ? opts.pad : 0.06);
    const vb = [bb.minX - pad, bb.minY - pad, bb.maxX - bb.minX + pad * 2, bb.maxY - bb.minY + pad * 2].map(r2).join(' ');
    const label = opts.label ? ` role="img" aria-label="${esc(opts.label)}"` : ' aria-hidden="true"';
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"${label}${opts.cls ? ` class="${opts.cls}"` : ''}>${body}${dimsSvg}</svg>`;
  }

  root.MWDraw = { render, logoMark, defs, L };
})(window);
