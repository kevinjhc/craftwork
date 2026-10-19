# Craftwork Home

The website for Craftwork, a design-build studio in Philadelphia. Plain static
HTML, CSS and JavaScript: no framework and no build step. Edit a file, reload,
push. GitHub Pages serves the repo as is.

## Layout

```
index.html  work.html  services.html  process.html  contact.html
work/<project>.html   one page per project
assets/css/site.css   all site styles (alt.css: home page only)
assets/js/site.js     menu, carousel, filters, form UI (alt.js: home page only)
assets/img/<project>/ photos, as WebP
assets/og/            1200×630 images for link previews
assets/logo/          logo, favicon
sitemap.xml  robots.txt  llms.txt  404.html
archive/              earlier home page versions (not indexed)
v1/                   the original one-page site
```

The header, menu and footer are repeated in every page. To change one, use
find-and-replace across all the `.html` files.

## Preview locally

```bash
python3 scripts/serve.py
```

Then open http://localhost:8123. It's a plain file server with caching turned off,
so a normal reload always shows your latest edits.

## Adding or editing a project

1. **Photos.** Export each photo as WebP at three sizes by its longest side (600, 1000
   and 1800 px), named `name-600.webp`, `name-1000.webp`, `name-1800.webp`, into
   `assets/img/<project>/`. Any image tool works (for example squoosh.app);
   quality around 70 keeps files small.
2. **Page.** Copy an existing page in `work/`, rename it `<project>.html`, then update
   the title, description, canonical and `og:` tags in the `<head>`, the facts, and
   the gallery images. Fix the Previous / Next links on it and on its neighbours.
3. **Share image (optional).** Save a 1200×630 JPEG as `assets/og/<project>.jpg`.
4. **Work page.** In `work.html`, copy a card in the grid and a row in the index list.
   `data-cats` sets which filters match, using the values from the filter checkboxes.
   Update the counts beside the filter checkboxes.
5. **Home page (optional).** The three featured cards and the "N projects" tile are in
   `index.html`.
6. **Sitemap.** Add the page's URL to `sitemap.xml`.

## SEO

Canonical links, Open Graph tags, the sitemap and structured data (the JSON-LD
`<script>` blocks in each `<head>`) use `https://craftworkhome.com`. If the domain
changes, find-and-replace it across the repo.

## Domain and email

The domain is registered at GoDaddy, which also hosts its DNS (GoDaddy → Domain
Portfolio → craftworkhome.com → DNS). GitHub Pages serves the site: the `CNAME` file
holds the domain, and these records point at GitHub:

```
A      @    185.199.108.153
A      @    185.199.109.153
A      @    185.199.110.153
A      @    185.199.111.153
CNAME  www  kevinjhc.github.io
```

### Email forwarding: ImprovMX

Addresses at craftworkhome.com forward to personal Gmail inboxes through
[ImprovMX](https://app.improvmx.com) (free plan: forwarding only, no mailbox). The
ImprovMX account is Jayme's.

| Address | Forwards to |
|---|---|
| `jayme@craftworkhome.com` | Jayme's Gmail |
| anything else (`*`) | Jayme's Gmail |

It relies on these records in GoDaddy DNS. Don't remove them:

```
MX   @  10  mx1.improvmx.com
MX   @  20  mx2.improvmx.com
TXT  @      v=spf1 include:spf.improvmx.com ~all
```

- **Checking delivery:** ImprovMX → craftworkhome.com → Logs lists every message it
  forwarded.
- **Testing:** send from an address other than the one the alias forwards to. Gmail
  silently drops a forwarded copy of mail you sent yourself, so a self-test looks lost.
- **Replying as jayme@:** in Gmail, Settings → Accounts → "Send mail as", using
  `smtp.gmail.com` with an app password, and choose "Reply from the same address the
  message was sent to".

### Contact form: Web3Forms

The form on `contact.html` posts to [Web3Forms](https://app.web3forms.com) from
`assets/js/site.js` (the "Contact form" block). Free plan: 250 submissions a month.

- **Recipient:** set in the Web3Forms dashboard, not in code: the "Craftwork Home"
  form → Settings → Email Configuration → Recipient Emails (add the address under
  Linked Emails first).
- **Access key:** `ACCESS_KEY` in `site.js`. It's meant to be public.
- **The email:** subject "New inquiry from {name}", one line per entry in `rows` in
  `site.js`, and Reply goes to the visitor's address. Edit `rows` to change what's
  included.
- **Spam:** a hidden `botcheck` field; submissions that fill it are dropped.

### Analytics: Cloudflare Web Analytics

Page views are counted by [Cloudflare Web Analytics](https://dash.cloudflare.com)
(free, no cookies, so no consent banner). The Cloudflare account is Jayme's: Analytics →
Web analytics → craftworkhome.com. DNS stays at GoDaddy; Cloudflare only receives
page-view beacons.

Every page except `archive/` and `v1/` has this just before `</head>`. It only loads
the beacon on `craftworkhome.com`, so local previews aren't counted:

```html
<!-- Cloudflare Web Analytics: live site only, so local previews aren't counted --><script>if (location.hostname === "craftworkhome.com") { const s = document.createElement("script"); s.src = "https://static.cloudflareinsights.com/beacon.min.js"; s.dataset.cfBeacon = '{"token": "95efc175faf7465f9f318ae6e1c417db"}'; document.head.append(s); }</script>
```

The token is public. When you add a page, copy the line from an existing one.
