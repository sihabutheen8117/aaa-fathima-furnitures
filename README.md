# AAA Fathima Furniture website

A static website (HTML, CSS and JavaScript only). There is no build step and no server code.

## Preview

Open `index.html` in a browser, or run a local server from this folder:

```
python -m http.server 8000
```

Then visit http://localhost:8000.

## Publish

The site is hosted on **Render** as a Static Site, deployed from the GitHub repo `aaa-fathima-furnitures`. Every push to `main` redeploys it automatically.

Render settings:

| Field | Value |
|---|---|
| Branch | `main` |
| Root Directory | (empty) |
| Build Command | `mkdir -p dist && cp -r index.html assets dist/` |
| Publish Directory | `dist` |

The build command copies only the site files into `dist`, so this README and other repo files are not published.

The site also works on any other static host (Netlify, Cloudflare Pages, Vercel, cPanel). Upload `index.html` and the `assets/` folder as they are.

## Editing content

Everything you are likely to change is in `assets/js/data.js`:

- **Contact details**: the `SITE` block (phone, WhatsApp number, address, branches).
- **Products**: the `PRODUCTS` list. Each entry has a model number, category, sizes (`h`, `d`, `w` in inches) and a finish description.
- **Real photos**: put a photo in `assets/img/products/` (for example `MW-195.jpg`), then add `photo: 'assets/img/products/MW-195.jpg'` to that product. The photo then replaces the drawing everywhere. Photos on a plain light background look best.

Product drawings are generated from the `art` description of each product (see `assets/js/draw.js`). They are drawn to each model's real proportions.

## How enquiries work

There is no backend. The contact form, the "Ask on WhatsApp" buttons and the enquiry list each open WhatsApp (to 97459 36872) with the message already written. The visitor only has to press send.

Each model has its own shareable link, for example `index.html#mw-203`.

## Logo

All logo files were made from the logo image the client sent on WhatsApp (a JPEG of the wooden "AAA" mark on a white disc).

- `assets/img/logo.webp`: the logo as sent, cropped to its white disc with a transparent background. Used in the header and footer.
- `assets/img/logo-mark.svg`: a flat vector trace of the mark, in the logo's wood colour. The same shape is in `draw.js` (`logoMark()`) and is used for the faint watermarks behind the hero, bedroom sets and About sections.
- `assets/img/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: browser tab and phone home-screen icons.

If the client has the original logo file (AI, EPS, SVG, PDF or a large PNG), ask for it. It will be sharper than a WhatsApp image, especially for print. The wordmark "AAA Fathima" is set in the Jost typeface.

## Details to confirm with the client

These come from gaps or likely misprints in the printed catalogue:

- **MW-201, MW-204**: height not visible in the photo (shown as "Ask us").
- **MW-207**: height and depth not visible.
- **MW-200** (D.36 | W.18) and **MW-356** (D.30 | W.16): depth and width look swapped. The drawings assume a wide unit, but the labels show the printed values.
- **MW-251 cot**: printed as D.60 | W.75, while MW-250 is D.75 | W.60.
- **Page 07** prints MW-209 twice. Only the first (rust finish) is included. Wardrobes MW-202, MW-205 and MW-208 were hidden in the photos and are not listed.
- **TV units MW-301 to MW-309**: no sizes are printed.
- The crockery unit (MW-358) was only on a draft sheet, so it is not included.
- Website domain, email address and the Ernakulam branch address are not in the material provided.
