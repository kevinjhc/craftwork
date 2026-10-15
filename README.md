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
