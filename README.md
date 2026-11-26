# AAA Fathima Furniture website

A static website (HTML, CSS and JavaScript only) with an admin panel for the shop's staff. There is no build step and no server code of our own: products, categories and photos are kept in a free [Supabase](https://supabase.com) project, which also handles the staff login.

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
| Build Command | `mkdir -p dist && cp -r index.html admin.html assets dist/` |
| Publish Directory | `dist` |

The build command copies only the site files into `dist`, so this README and other repo files are not published.

The site also works on any other static host (Netlify, Cloudflare Pages, Vercel, cPanel). Upload `index.html`, `admin.html` and the `assets/` folder as they are.

## How the site is laid out

The site works like a simple shop app, designed for phones first. Visitors see the categories first and tap one to see its products:

1. **Home**: banner, then round category tiles (three per row on phones, six on desktop).
2. **Category**: the products in that category as a two-column grid, with chips to switch category. Each card shows the name, model number and price.
3. **Product**: the measured drawing, price, sizes, and buttons to ask on WhatsApp or add to the enquiry list.

**Prices.** Each product can have an **MRP** and an **offer price**, both in whole rupees. With both set, the shop shows the MRP struck through, the offer price, how much the customer saves and a "% OFF" badge on the picture (the percentage is rounded down, so it never claims more than the real discount). With only one of them, that price is shown on its own. With neither, the product shows "Price on request". Prices are also added to the enquiry list and to the WhatsApp messages.

Phones get a bottom tab bar (Shop, Enquiry, Call, Contact) and a menu listing every category. On desktop the links move into the header. The search box under the header searches model numbers, names, categories and finishes.

Every screen has its own address, so links can be shared and the phone's back button works:

| Screen | Address |
|---|---|
| Home | `index.html#/` |
| One category | `index.html#/c/wardrobe` (the category's web address, set when it is added) |
| All products | `index.html#/c/all` |
| One product | `index.html#mw-203` |
| Search | `index.html#/search/white` |
| Enquiry list, About, Contact | `#/enquiry`, `#/about`, `#/contact` |

Categories with no products yet are left off the home page, the menu and the category chips.

## Admin panel

Staff manage the catalogue at **`/admin.html`** (for example `https://your-site.onrender.com/admin.html`), on a phone or a computer. After signing in they can:

- **Products**: add, edit, hide or delete a product: model number, category, name (for named sets such as *Black Coral*), colour and finish, **MRP and offer price**, sizes in inches, specifications, the pieces of a set, series and tagline. While prices are typed, the form says exactly what customers will see (for example "₹10,000 with MRP ₹20,000 struck through: save ₹10,000, 50% off"). An offer price above the MRP is refused.
- **Photos**: take a photo with the phone or choose one. It is shrunk on the phone before uploading (a large copy for the product screen and a small one for lists), so pages stay fast on mobile data. A photo replaces the built-in drawing.
- **Hide instead of delete**: switching off *Show on the website* takes a product off the shop without losing it. Hiding a category hides all its products.
- **Categories**: add, rename, hide, reorder (the arrows set the order of the home page tiles), choose which product's picture is used for the round tile or upload a tile photo, and delete a category once it is empty.

Changes appear on the shop the next time a page is opened. The admin page is hidden from search engines.

**Who can sign in.** Only people whose email is in the staff list (the `admins` table) can change anything. The database enforces this itself (see `supabase/schema.sql`), not only the admin page. To add a staff member, create their login and add their email (step 4 below). To remove one, delete their row from `admins` and their user from *Authentication > Users*.

### How the shop gets its products

`assets/js/catalogue.js` loads the categories and products from Supabase when a page opens. If Supabase can't be reached within 6 seconds, the shop uses the copy the visitor's browser saved on its last visit, and failing that the original catalogue written in `assets/js/data.js`. So the shop never shows an empty page.

While `assets/js/config.js` is empty, the shop simply runs from `data.js` as before, and the admin page explains how to connect.

`data.js` still holds:

- **Contact details**: the `SITE` block (phone, WhatsApp number, address, branches). These are not in the admin panel. Calls and WhatsApp both go to +91 88706 39863; the number is also written in `index.html` (header, contact screen, footer, menu and bottom bar).
- **The built-in drawings** of the original 39 models (the `art` of each product, drawn to each model's real proportions by `assets/js/draw.js`). The database links to them by model number (`art_key`), so a product keeps its drawing until someone uploads a photo for it, even if its model number is changed.
- **The original catalogue**, used as the last fallback and to create `supabase/seed.sql` (`node tools/make-seed.mjs`).

### Admin panel setup (once)

1. **Create the project.** Sign up at [supabase.com](https://supabase.com) and create a new project on the free plan. Choose the region **Mumbai (ap-south-1)**, closest to Kerala.
2. **Create the tables.** In the dashboard open *SQL Editor*, paste all of `supabase/schema.sql` and click *Run*. Then do the same with `supabase/seed.sql`, which loads the current 11 categories and 39 products. Both files are safe to run again; the seed never overwrites changes made in the admin panel.
3. **Turn off public sign-ups.** *Authentication > Sign In / Providers*: switch off *Allow new users to sign up*. Staff accounts are only created by you.
4. **Add the staff.** *Authentication > Users > Add user > Create new user*: enter their email and a password, and tick *Auto Confirm User*. Then in the *SQL Editor* run, with their email in lowercase:
   ```sql
   insert into public.admins (email) values ('staff.member@example.com');
   ```
5. **Allow the password-reset link.** *Authentication > URL Configuration*: set *Site URL* to the admin page address, for example `https://your-site.onrender.com/admin.html`, and add the same address under *Redirect URLs*.
6. **Connect the site.** *Project Settings > API Keys*: copy the *Project URL* and the *publishable* key (on older projects, the *anon public* key) into `assets/js/config.js`. These two are meant to be public. **Never** put the *secret* or *service_role* key in the site.
7. **Publish.** Change the Render *Build Command* to the one in the table above (it now copies `admin.html` too), then push to `main`.

Good to know:

- **Updating an existing database.** If the tables were created before prices were added, run all of `supabase/schema.sql` again *before* publishing the new site. It adds the `mrp` and `price` columns and leaves everything else as it is. Until then the shop can't read the catalogue from the database and falls back to its saved copy.
- **Forgot password emails.** Supabase's built-in email sender is meant for testing: it sends only a few emails an hour and may deliver only to members of your Supabase team. For reliable reset emails, add an email provider under *Authentication > Emails > SMTP Settings* (Brevo and Resend have free plans). Until then, you can set a new password for a staff member yourself in *Authentication > Users*.
- **Free projects pause after a week without activity.** While paused, the shop shows its saved product list and the admin panel can't save. Restore the project from the Supabase dashboard, or keep it busy with a scheduled request (for example a GitHub Actions job that reads one category twice a week).
- **Backups.** The free plan keeps no backups you can download. Now and then, export the `products` and `categories` tables as CSV from the *Table Editor*.

### Developing the admin panel locally

With Docker running, `npx supabase start` gives a full local Supabase (database, login, photo storage, and a test inbox for reset emails at http://127.0.0.1:54324). Load `supabase/schema.sql` and `supabase/seed.sql` into it, create a user, add them to `admins`, and point `config.js` at `http://127.0.0.1:54321` with the local publishable key while you test. Don't commit those local values.

## How enquiries work

Enquiries don't go through the database. The contact form, the "Ask on WhatsApp" buttons and the enquiry list each open WhatsApp (to 88706 39863) with the message already written. The visitor only has to press send.

## Logo

All logo files were made from the logo image the client sent on WhatsApp (a JPEG of the wooden "AAA" mark on a white disc).

- `assets/img/logo.webp`: the logo as sent, cropped to its white disc with a transparent background. Used in the header and footer.
- `assets/img/logo-mark.svg`: a flat vector trace of the mark, in the logo's wood colour. The same shape is in `draw.js` (`logoMark()`) and is used on the Premium banner slide and the "All products" tile.
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
