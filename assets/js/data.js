/*
 * AAA Fathima Furniture site content.
 * Edit this file to change contact details, add products or fix sizes.
 *
 * Product fields
 *   id      model number exactly as printed in the catalogue
 *   cat     category id (see CATEGORIES)
 *   dims    { h, d, w } in inches, as printed: (H.74 | D.17 | W.32). Use null if unknown.
 *   finish  short description of colours/finish
 *   photo   optional path to a real product photo, e.g. 'assets/img/products/MW-195.jpg'.
 *           When set, the photo is shown instead of the drawing.
 *   art     drawing description used when there is no photo (see draw.js)
 */
(function (root) {
  'use strict';
  const { H, V, Hg, Vg, door, drawers, shelves, mirror, panel, slats, cushion, pair } = root.MWDraw.L;

  const SITE = {
    name: 'AAA Fathima Furniture',
    phone: '+919946000862',
    phoneDisplay: '99460 00862',
    whatsapp: '918870639863',
    whatsappDisplay: '88706 39863',
    address: ['5/660, AAA Fathima Furniture', 'Murukkumon, Nilamel', 'Kollam 691 534', 'Kerala, India'],
    branches: ['Kollam', 'Ernakulam'],
    mapQuery: 'AAA Fathima Furniture, Murukkumon, Nilamel, Kollam, Kerala 691534',
  };

  // Shown on the home page in this order. `rep` is the model drawn in the category's round picture.
  const CATEGORIES = [
    { id: 'bedroom-set', name: 'Bedroom sets', single: 'Bedroom set', room: 'bedroom', rep: 'MW-250' },
    { id: 'wardrobe', name: 'Wardrobes', single: 'Wardrobe', room: 'bedroom', rep: 'MW-203' },
    { id: 'dresser', name: 'Dressers', single: 'Dresser', room: 'bedroom', rep: 'MW-195' },
    { id: 'tv-unit', name: 'TV units', single: 'TV unit', room: 'living', rep: 'MW-305' },
    { id: 'office-table', name: 'Office tables', single: 'Office table', room: 'work', rep: 'MW-193' },
    { id: 'study-table', name: 'Study tables', single: 'Study table', room: 'work', rep: 'MW-167' },
    { id: 'kids-wardrobe', name: 'Kids wardrobes', single: 'Kids wardrobe', room: 'bedroom', rep: 'MW-169' },
    { id: 'bedside', name: 'Bedside tables', single: 'Bedside table', room: 'bedroom', rep: 'MW-350' },
    { id: 'cabinet', name: 'Multi-purpose cabinets', single: 'Multi-purpose cabinet', room: 'living', rep: 'MW-357' },
    { id: 'book-case', name: 'Book cases', single: 'Book case', room: 'living', rep: 'MW-351' },
    { id: 'shoe-rack', name: 'Shoe racks', single: 'Shoe rack', room: 'living', rep: 'MW-353' },
  ];

  /* ---- drawing helpers ---- */
  const cab = (w, h, d, m, front, o = {}) => ({ items: [Object.assign({ x: 0, y: 0, z: 0, w, h, d, mat: m, front }, o)] });
  const onLegs = { y: 5, legs: { type: 'tapered', mat: 'black' } };
  const tv = (x, y, w = 40, h = 23) => ({ kind: 'tv', x, y, z: 13.9, w, h });
  const wall = (m, front) => ({ x: 0, y: 0, z: 14, w: 72, h: 60, d: 1.5, mat: m, front, inset: 0, noShadow: true });
  const consoleUnit = (m, front, o = {}) => Object.assign({ x: 4, y: 0, z: 0, w: 64, h: 15, d: 14, mat: m, front }, o);

  /* ---- bedroom sets ---- */
  const blackCoral = {
    items: [
      { x: 90, y: 0, z: 75, w: 100, h: 38, d: 2.5, mat: 'white', gloss: true, inset: 0, noShadow: true,
        front: Vg(0, [1.1, panel('white')], [1, Hg(0, [1, panel('white')], [2.4, cushion('black', { gloss: true })], [1, panel('white')])], [1.2, panel('white')]) },
      { x: 93, y: 13, z: 59, w: 16, h: 7, d: 16, mat: 'white', gloss: true, noShadow: true, front: drawers(1, 'black') },
      { x: 171, y: 13, z: 59, w: 16, h: 7, d: 16, mat: 'white', gloss: true, noShadow: true, front: drawers(1, 'black') },
      { kind: 'vase', x: 101, y: 20, z: 67, s: 0.9 },
      { x: 0, y: 0, z: 44, w: 34, h: 74, d: 16, mat: 'white', gloss: true,
        front: V([2.5, H([1, shelves(4, { mat: 'white', decor: true })], [1.15, mirror()])], [1.3, H([1, drawers(3, 'black')], [1.1, door('black', { side: 'l' })])]) },
      { x: 36, y: 0, z: 42, w: 47, h: 78, d: 18, mat: 'white', gloss: true,
        front: V([0.06, panel('black')], [1, H(door('white', { side: 'r', handle: 'long-v' }), door('white', { side: 'l', handle: 'long-v' }), door('white', { side: 'l', handle: 'long-v' }))]) },
      { x: 110, y: 0, z: 0, w: 60, h: 12, d: 75, mat: 'white', gloss: true, inset: 0, front: Vg(0, [1, panel('white')], [0.14, panel('black')]) },
    ],
  };

  const azureHaven = {
    items: [
      { x: 90, y: 0, z: 75, w: 100, h: 40, d: 2.5, mat: 'white', inset: 0, noShadow: true,
        front: Vg(0, [1.3, Hg(0, [1, panel('white')], [2.3, cushion('black', { tufted: true })], [1, panel('white')])], [1, panel('wood')]) },
      { x: 93, y: 31, z: 69, w: 14, h: 0.9, d: 6, mat: 'wood', noShadow: true },
      { x: 173, y: 31, z: 69, w: 14, h: 0.9, d: 6, mat: 'wood', noShadow: true },
      { x: 93, y: 12, z: 59, w: 16, h: 10, d: 16, mat: 'wood', noShadow: true, front: drawers(2, 'white') },
      { x: 171, y: 12, z: 59, w: 16, h: 10, d: 16, mat: 'wood', noShadow: true, front: drawers(2, 'white') },
      { kind: 'plant', x: 180, y: 22, z: 67, s: 0.7 },
      { x: 0, y: 0, z: 44, w: 34, h: 74, d: 16, mat: 'wood',
        front: V([2.5, H([1, shelves(4, { mat: 'wood', decor: true })], [1.15, mirror()])], [1.3, H([1, drawers(3, 'white')], [1, shelves(1)])]) },
      { x: 36, y: 0, z: 42, w: 47, h: 78, d: 18, mat: 'wood',
        front: H(door('white', { side: 'r' }), door('white', { side: 'l' }), door('white', { side: 'l' })) },
      { x: 110, y: 0, z: 0, w: 60, h: 12, d: 75, mat: 'white', top: 'woodH', inset: 1.6, front: panel('black', { gloss: true }) },
    ],
  };

  const bedroomSpecs = (extra) => Object.assign({ Material: 'Particle board', Assembly: 'Easy assembly', Storage: 'Yes' }, extra);

  const PRODUCTS = [
    /* ---------- Bedroom sets (catalogue pages 02-03) ---------- */
    {
      id: 'MW-250', cat: 'bedroom-set', name: 'Black Coral', series: 'Bedroom Series 1',
      quote: 'Real Comfort, Visual and Physical, is Vital to every Room',
      finish: 'High-gloss white with black accents',
      components: [
        { code: 'MW250A', name: 'Dresser', dims: { h: 74, d: 16, w: 34 } },
        { code: 'MW250B', name: 'Wardrobe', dims: { h: 78, d: 18, w: 47 } },
        { code: 'MW250C', name: 'Cot', dims: { h: 12, d: 75, w: 60 } },
        { code: 'MW250D', name: 'Bed side', dims: { h: 12, d: 16, w: 16 } },
      ],
      specs: bedroomSpecs({ 'Bed type': 'Hydraulic', Mattress: 'Not included', 'Bed size': 'King, Queen' }),
      art: blackCoral,
    },
    {
      id: 'MW-251', cat: 'bedroom-set', name: 'Azure Haven', series: 'Bedroom Series 2',
      quote: 'Take Comfort Into Luxurious Slumber',
      finish: 'Walnut and white with a tufted black headboard',
      components: [
        { code: 'MW251A', name: 'Dresser', dims: { h: 74, d: 16, w: 34 } },
        { code: 'MW251B', name: 'Wardrobe', dims: { h: 78, d: 18, w: 47 } },
        { code: 'MW251C', name: 'Cot', dims: { h: 12, d: 60, w: 75 } },
        { code: 'MW251D', name: 'Bed side', dims: { h: 12, d: 16, w: 16 } },
      ],
      specs: bedroomSpecs({ Mattress: 'Not included', 'Bed size': 'King, Queen' }),
      art: azureHaven,
    },

    /* ---------- Wardrobes (page 07) ---------- */
    { id: 'MW-201', cat: 'wardrobe', dims: { h: null, d: 17, w: 47 }, finish: 'Ice blue and white, three doors',
      art: cab(47, 74, 17, 'white', H(door('blue', { side: 'r' }), door('white', { side: 'l' }), door('blue', { side: 'l' })), { y: 2, plinth: 'white' }) },
    { id: 'MW-203', cat: 'wardrobe', dims: { h: 76, d: 17, w: 47 }, finish: 'Walnut doors with dark stone finish',
      art: cab(47, 74, 17, 'marbleDark', V([2.2, pair('wood')], [1, pair('marbleDark', { handle: 'none' })]), { y: 2, plinth: 'black' }) },
    { id: 'MW-204', cat: 'wardrobe', dims: { h: null, d: 17, w: 47 }, finish: 'Black with gold trim and handles',
      art: cab(47, 74, 17, 'gold', pair('black', { handle: 'gold-long' }), { y: 2, plinth: 'black', inset: 1 }) },
    { id: 'MW-206', cat: 'wardrobe', dims: { h: 76, d: 17, w: 47 }, finish: 'Sky blue doors on a black frame',
      art: cab(47, 74, 17, 'black', H(door('sky', { side: 'r' }), door('sky', { side: 'l' }), door('sky', { side: 'l' })), { y: 2, plinth: 'black' }) },
    { id: 'MW-207', cat: 'wardrobe', dims: { h: null, d: null, w: 60 }, finish: 'Black, four doors with long gold handles',
      art: cab(60, 74, 18, 'black', H(door('black', { handle: 'none' }), door('black', { side: 'r', handle: 'gold-long' }), door('black', { side: 'l', handle: 'gold-long' }), door('black', { handle: 'none' })), { y: 2, plinth: 'black' }) },
    { id: 'MW-209', cat: 'wardrobe', dims: { h: 76, d: 17, w: 47 }, finish: 'Rustic copper texture',
      art: cab(47, 74, 17, 'rust', pair('rust'), { y: 2, plinth: 'black' }) },

    /* ---------- Dressers (page 05) ---------- */
    { id: 'MW-195', cat: 'dresser', dims: { h: 74, d: 17, w: 32 }, finish: 'White with walnut shelves, on tapered legs',
      art: cab(32, 69, 17, 'white',
        V([3.2, H([1, V([1, door('white', { handle: 'knob' })], [1.7, shelves(2, { mat: 'wood', decor: true })])], [1.25, mirror()])],
          [1.6, H([1.25, door('white', { handle: 'knob' })], [1, V(drawers(1, 'white', { handle: 'knob' }), shelves(1, { mat: 'wood' }))])]),
        onLegs) },
    { id: 'MW-196', cat: 'dresser', dims: { h: 72, d: 17, w: 30 }, finish: 'Walnut with white drawers',
      art: cab(30, 70, 17, 'wood', V([3, H([1.35, mirror()], [1, shelves(4, { decor: true })])], [1.1, drawers(2, 'white')]), { y: 2, plinth: 'wood' }) },
    { id: 'MW-197', cat: 'dresser', dims: { h: 71, d: 14, w: 34 }, finish: 'White with walnut shelves',
      art: cab(34, 69, 14, 'white', V([2.6, H([1.3, mirror()], [1, shelves(4, { mat: 'wood', decor: true })])], [1, H([1, drawers(2, 'white')], [1, door('white', { side: 'l' })])]), { y: 2, plinth: 'white' }) },
    { id: 'MW-198', cat: 'dresser', dims: { h: 71, d: 16, w: 34 }, finish: 'Dark walnut dressing table with white storage',
      art: {
        items: [
          { x: 0, y: 0, z: 0, w: 34, h: 30, d: 16, mat: 'darkwood', front: H([1.6, V([1, drawers(1, 'white')], [3.2, shelves(1)])], [1, door('white', { side: 'l' })]) },
          { x: 0, y: 30, z: 9, w: 34, h: 41, d: 7, mat: 'darkwood', front: H([1.7, mirror()], [1, shelves(3, { decor: true })]) },
        ],
        measure: { x: 0, w: 34, z: 0, d: 16, h: 71 },
      } },
    { id: 'MW-199', cat: 'dresser', dims: { h: 74, d: 16, w: 34 }, finish: 'Black with a white drawer',
      art: cab(34, 74, 16, 'black', V([3.3, H([1.3, mirror()], [1, shelves(5, { decor: true })])], [0.55, drawers(1, 'white')], [0.45, panel('black')])) },
    { id: 'MW-200', cat: 'dresser', dims: { h: 77, d: 36, w: 18 }, finish: 'Walnut with lit niches and white drawers',
      art: cab(36, 77, 18, 'wood', V([2.4, H([1, shelves(3, { lights: true, decor: true })], [1.7, mirror()])], [1, H([1.5, shelves(1)], [1, drawers(3, 'white')])])) },

    /* ---------- Bedside, book case, shoe racks (page 05) ---------- */
    { id: 'MW-350', cat: 'bedside', dims: { h: 16, d: 16, w: 16 }, finish: 'Walnut with white drawers, on tapered legs',
      art: cab(16, 11, 16, 'wood', V([1, shelves(1)], [1.7, H([1, shelves(1)], [1.4, drawers(2, 'white', { handle: 'knob' })])]), onLegs) },
    { id: 'MW-351', cat: 'book-case', dims: { h: 68, d: 15, w: 23 }, finish: 'Walnut shelves with white drawers',
      art: cab(23, 66.5, 15, 'wood', V([3.6, shelves(4, { books: true })], [1, drawers(2, 'white')]), { y: 1.5, plinth: 'wood' }) },
    { id: 'MW-352', cat: 'shoe-rack', dims: { h: 44, d: 17, w: 16 }, finish: 'White, three tilt-out compartments',
      art: cab(16, 42.5, 17, 'white', V(door('white', { handle: 'bar-h' }), door('white', { handle: 'bar-h' }), door('white', { handle: 'bar-h' })), { y: 1.5, plinth: 'white' }) },
    { id: 'MW-353', cat: 'shoe-rack', dims: { h: 52, d: 16, w: 31 }, finish: 'White drawers with black open shelves',
      art: cab(31, 52, 16, 'black', H([1.1, drawers(3, 'white')], [1, shelves(4, { mat: 'black', decor: true })])) },

    /* ---------- TV units (page 06, sizes not printed) ---------- */
    { id: 'MW-301', cat: 'tv-unit', dims: null, finish: 'Beige stone panel with walnut slats and white drawers',
      art: { items: [wall('white', Hg(0, [1, slats('wood')], [4.5, panel('marbleLight')])), tv(24, 26),
        consoleUnit('white', H([1, drawers(2, 'white')], [1.2, door('marbleLight', { side: 'r' })], [1.2, door('marbleLight', { side: 'l' })])),
        { kind: 'plant', x: 12, y: 15, z: 7, s: 0.8 }] } },
    { id: 'MW-302', cat: 'tv-unit', dims: null, finish: 'All white with open display shelves',
      art: { items: [wall('white', Hg(0.6, [4, panel('white')], [1, shelves(4, { mat: 'white', decor: true })])), tv(10, 26),
        consoleUnit('white', H(door('white', { side: 'r' }), drawers(2, 'white'), door('white', { side: 'l' })), { gloss: true })] } },
    { id: 'MW-303', cat: 'tv-unit', dims: null, finish: 'Walnut slat wall with black shelves and drawers',
      art: { items: [wall('black', Hg(0.6, [1, shelves(5, { mat: 'black', decor: true })], [4, slats('wood')])), tv(26, 26),
        consoleUnit('wood', H([1, drawers(1, 'black')], [1.3, shelves(1)], [1, drawers(1, 'black')]))] } },
    { id: 'MW-304', cat: 'tv-unit', dims: null, finish: 'Black panel with walnut slats',
      art: { items: [wall('black', Hg(0, [5, panel('black')], [1.2, slats('wood')])), tv(10, 26),
        consoleUnit('wood', H(door('black', { side: 'r' }), door('black', { side: 'l' }), door('black', { side: 'l' })))] } },
    { id: 'MW-305', cat: 'tv-unit', dims: null, finish: 'Black stone panel with lit walnut shelves',
      art: { items: [wall('wood', Hg(0.6, [4, panel('marbleDark')], [1, shelves(4, { mat: 'wood', lights: true })])), tv(8, 26),
        consoleUnit('black', H(drawers(1, 'black'), drawers(1, 'black'), drawers(1, 'black')), { top: 'woodH' })] } },
    { id: 'MW-306', cat: 'tv-unit', dims: null, finish: 'Walnut and black with a display tower',
      art: { items: [wall('wood', Hg(0.6, [1, slats('wood')], [3, panel('black')], [1.3, shelves(5, { mat: 'wood', decor: true })])), tv(17, 26, 34, 20),
        consoleUnit('black', H(door('black', { side: 'r' }), door('black', { side: 'l' }), shelves(1, { mat: 'wood' })), { top: 'woodH', w: 50 })] } },
    { id: 'MW-307', cat: 'tv-unit', dims: null, finish: 'Walnut wall panel with white floating shelves',
      art: { items: [wall('wood', null), tv(28, 25, 38, 22),
        { x: 4, y: 36, z: 8, w: 18, h: 1, d: 6, mat: 'white', noShadow: true },
        { x: 8, y: 46, z: 8, w: 14, h: 1, d: 6, mat: 'white', noShadow: true },
        { kind: 'plant', x: 12, y: 37, z: 10, s: 0.55 },
        consoleUnit('white', H(drawers(1, 'white'), drawers(1, 'white'), shelves(1)), { y: 3, h: 12, w: 58, legs: { type: 'block', mat: 'black' } })] } },
    { id: 'MW-308', cat: 'tv-unit', dims: null, finish: 'Walnut cubbies and white drawer, on tapered legs',
      art: { items: [
        { x: 0, y: 6, z: 0, w: 60, h: 15, d: 16, mat: 'wood', legs: { type: 'tapered', mat: 'black' },
          front: H([1, V(H(shelves(1), shelves(1)), H(shelves(1), shelves(1)))], [1, V([1, drawers(1, 'white')], [1.3, panel('white')])]) },
        { kind: 'tv', stand: true, x: 12, y: 21, z: 6, w: 36, h: 21 }] } },
    { id: 'MW-309', cat: 'tv-unit', dims: null, finish: 'Walnut wall with white cabinets and display shelves',
      art: { items: [wall('wood', Vg(0.6, [1, H(door('white', { side: 'r' }), door('white', { side: 'l' }), door('white', { side: 'l' }))], [2.4, Hg(0.6, [3, panel('wood')], [1, shelves(4, { mat: 'white', decor: true })])])),
        tv(10, 22, 36, 20),
        consoleUnit('white', H(door('white', { side: 'r' }), door('white', { side: 'l' }), door('white', { side: 'r' }), door('white', { side: 'l' })))] } },

    /* ---------- Multi-purpose cabinets (page 06) ---------- */
    { id: 'MW-356', cat: 'cabinet', dims: { h: 51, d: 30, w: 16 }, finish: 'White and black, on tapered legs',
      art: cab(30, 46, 16, 'white', H([1, V([1, shelves(2, { decor: true })], [1.1, door('white', { handle: 'knob' })])], [1, door('black', { side: 'l', handle: 'knob' })]), onLegs) },
    { id: 'MW-357', cat: 'cabinet', dims: { h: 72, d: 16, w: 28 }, finish: 'Walnut shelves with white doors',
      art: cab(28, 70.5, 16, 'wood', V([3, shelves(4, { decor: true, books: [1] })], [1, pair('white')]), { y: 1.5, plinth: 'wood' }) },

    /* ---------- Office tables (page 04) ---------- */
    { id: 'MW-189', cat: 'office-table', dims: { h: 30, d: 18, w: 46 }, finish: 'White with open side storage',
      art: { items: [
        { x: 1, y: 8, z: 16.2, w: 30, h: 20.8, d: 0.8, mat: 'white', noShadow: true },
        { x: 0, y: 0, z: 0, w: 1.2, h: 28.8, d: 18, mat: 'white' },
        { x: 31, y: 0, z: 0, w: 15, h: 28.8, d: 18, mat: 'white', front: shelves(2, { decor: true }) },
        { x: 0, y: 28.8, z: 0, w: 46, h: 1.2, d: 18, mat: 'white' }] } },
    { id: 'MW-190', cat: 'office-table', dims: { h: 30, d: 18, w: 48 }, finish: 'Walnut with a shelf hutch and side cabinet',
      art: { items: [
        { x: 1, y: 8, z: 16.2, w: 32, h: 20.8, d: 0.8, mat: 'wood', noShadow: true },
        { x: 0, y: 0, z: 0, w: 1.2, h: 28.8, d: 18, mat: 'wood' },
        { x: 33, y: 0, z: 0, w: 15, h: 28.8, d: 18, mat: 'wood', front: V([1, shelves(1)], [1.6, door('wood', { side: 'l', handle: 'knob' })]) },
        { x: 0, y: 28.8, z: 0, w: 48, h: 1.2, d: 18, mat: 'wood', top: 'woodH' },
        { x: 34, y: 30, z: 6, w: 14, h: 16, d: 10, mat: 'wood', front: shelves(3, { decor: true }) }],
        measure: { x: 0, w: 48, z: 0, d: 18, h: 30 } } },
    { id: 'MW-191', cat: 'office-table', dims: { h: 30, d: 24, w: 40 }, finish: 'Black with blue drawers',
      art: { items: [
        { x: 1, y: 8, z: 22.2, w: 25, h: 20.8, d: 0.8, mat: 'black', noShadow: true },
        { x: 0, y: 0, z: 0, w: 1.2, h: 28.8, d: 24, mat: 'black' },
        { x: 26, y: 0, z: 0, w: 14, h: 28.8, d: 24, mat: 'black', front: drawers(3, 'blue') },
        { x: 0, y: 28.8, z: 0, w: 40, h: 1.2, d: 24, mat: 'black' }] } },
    { id: 'MW-192', cat: 'office-table', dims: { h: 32, d: 20, w: 43 }, finish: 'White frame with a dark walnut top and drawer',
      art: { items: [
        { x: 13, y: 9, z: 18.2, w: 28.8, h: 21.6, d: 0.8, mat: 'white', noShadow: true },
        { x: 0, y: 0, z: 0, w: 13, h: 30.6, d: 20, mat: 'white', front: V([2, shelves(1)], [1, drawers(1, 'darkwood')]) },
        { x: 41.8, y: 0, z: 0, w: 1.2, h: 30.6, d: 20, mat: 'white' },
        { x: 0, y: 30.6, z: 0, w: 43, h: 1.4, d: 20, mat: 'darkwood' }] } },
    { id: 'MW-193', cat: 'office-table', dims: { h: 30, d: 24, w: 48 }, finish: 'Walnut with white drawers',
      art: { items: [
        { x: 1, y: 8, z: 22.2, w: 33, h: 20.8, d: 0.8, mat: 'wood', noShadow: true },
        { x: 0, y: 0, z: 0, w: 1.2, h: 28.8, d: 24, mat: 'wood' },
        { x: 1.2, y: 3, z: 1, w: 32.8, h: 0.8, d: 22, mat: 'wood', noShadow: true },
        { x: 34, y: 0, z: 0, w: 14, h: 28.8, d: 24, mat: 'wood', front: drawers(3, 'white') },
        { x: 0, y: 28.8, z: 0, w: 48, h: 1.2, d: 24, mat: 'wood', top: 'woodH' }] } },
    { id: 'MW-194', cat: 'office-table', dims: { h: 30, d: 30, w: 60 }, finish: 'Black top with twin white pedestals',
      art: { items: [
        { x: 16, y: 8, z: 28.2, w: 28, h: 20.6, d: 0.8, mat: 'white', noShadow: true },
        { x: 0, y: 0, z: 0, w: 16, h: 28.6, d: 30, mat: 'white', front: door('white', { side: 'r', handle: 'knob' }) },
        { x: 44, y: 0, z: 0, w: 16, h: 28.6, d: 30, mat: 'white', front: drawers(3, 'white') },
        { x: 0, y: 28.6, z: 0, w: 60, h: 1.4, d: 30, mat: 'black' }] } },

    /* ---------- Study tables (page 04) ---------- */
    { id: 'MW-167', cat: 'study-table', dims: { h: 59, d: 18, w: 32 }, finish: 'Dark walnut desk, white shelves, round mirror and chair',
      art: { items: [
        { x: 0, y: 29.2, z: 16.5, w: 32, h: 29.8, d: 1.2, mat: 'white', noShadow: true },
        { kind: 'roundMirror', x: 9.5, y: 46, z: 16.4, r: 6.5 },
        { x: 19, y: 37, z: 8, w: 13, h: 0.9, d: 8.5, mat: 'white', noShadow: true },
        { x: 19, y: 46, z: 8, w: 13, h: 0.9, d: 8.5, mat: 'white', noShadow: true },
        { kind: 'plant', x: 26, y: 47, z: 12, s: 0.45 },
        { x: 0, y: 0, z: 0, w: 1.2, h: 28, d: 18, mat: 'darkwood' },
        { x: 30.8, y: 0, z: 0, w: 1.2, h: 28, d: 18, mat: 'darkwood' },
        { x: 0, y: 28, z: 0, w: 32, h: 1.2, d: 18, mat: 'darkwood' },
        { x: 9.5, y: 0, z: 4.5, w: 1, h: 15, d: 1, mat: 'black', noShadow: true },
        { x: 20.5, y: 0, z: 4.5, w: 1, h: 15, d: 1, mat: 'black', noShadow: true },
        { x: 9, y: 15, z: -6, w: 13, h: 1.4, d: 12, mat: 'black' },
        { x: 9.5, y: 0, z: -5.5, w: 1, h: 15, d: 1, mat: 'black', noShadow: true },
        { x: 20.5, y: 0, z: -5.5, w: 1, h: 15, d: 1, mat: 'black', noShadow: true },
        { x: 9, y: 16.4, z: -6, w: 13, h: 13, d: 1.2, mat: 'black', noShadow: true }],
        measure: { x: 0, w: 32, z: 0, d: 18, h: 59 } } },
    { id: 'MW-168', cat: 'study-table', dims: { h: 28, d: 16, w: 24 }, finish: 'Kids desk and chair, green with a printed top',
      art: { items: [
        { x: -15, y: 0, z: 2, w: 1, h: 12, d: 10, mat: 'green' },
        { x: -6, y: 0, z: 2, w: 1, h: 12, d: 10, mat: 'green' },
        { x: -15, y: 12, z: 2, w: 10, h: 1, d: 10, mat: 'green' },
        { x: -15, y: 13, z: 11, w: 10, h: 11, d: 1, mat: 'green', noShadow: true },
        { x: 1.4, y: 6, z: 14.8, w: 21.2, h: 20.6, d: 0.8, mat: 'green', noShadow: true },
        { x: 0, y: 0, z: 0, w: 1.4, h: 26.6, d: 16, mat: 'green' },
        { x: 22.6, y: 0, z: 0, w: 1.4, h: 26.6, d: 16, mat: 'green' },
        { x: 0, y: 26.6, z: 0, w: 24, h: 1.4, d: 16, mat: 'green', top: 'printGalaxy' }],
        measure: { x: 0, w: 24, z: 0, d: 16, h: 28 } } },

    /* ---------- Kids wardrobes (page 04) ---------- */
    { id: 'MW-169', cat: 'kids-wardrobe', dims: { h: 72, d: 17, w: 32 }, finish: 'Printed jungle doors',
      art: cab(32, 69, 17, 'white', pair('printJungle'), { y: 3, plinth: 'green' }) },
    { id: 'MW-170', cat: 'kids-wardrobe', dims: { h: 72, d: 17, w: 32 }, finish: 'Printed starry-night doors',
      art: cab(32, 69, 17, 'white', pair('printGalaxy'), { y: 3, plinth: 'pink' }) },
  ];

  root.MW_DATA = { SITE, CATEGORIES, PRODUCTS };
})(window);
