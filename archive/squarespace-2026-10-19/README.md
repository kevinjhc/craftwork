# Squarespace site backup — 2026-10-19

A snapshot of the old craftworkhome.com (Squarespace), taken before the domain
moved to GitHub Pages. Not linked from the live site; `/archive/` is disallowed
in `robots.txt`.

```
site/www.craftworkhome.com/   every page as HTML (28 pages, incl. 8 not in the sitemap)
site/<squarespace hosts>/     the CSS, JS and fonts those pages load
images/                       all 110 images at original upload resolution
images/manifest.json          each image's original URL and the pages that use it
json/                         Squarespace's ?format=json for each page: text, captions, image URLs
```

## Viewing

Serve the repo (`python3 scripts/serve.py`) and open
http://localhost:8123/archive/squarespace-2026-10-19/site/www.craftworkhome.com/index.html.
Image links are rewritten to `images/`, so pages render without Squarespace.
Shop and cart buttons don't work.

Jayme's personal email address is replaced with `email-removed@example.com` /
`[email removed]`, since this repo is public.

## Pages

Home/Project Galleries (`index`, `home`), `work`, `about`, `our-story`,
`new-page-1` (Contact), `read-me-forte`, `blog`, `gallery`, `furniture`,
`project-4` (Custom Home Elements), `project-3`, `products`, `shop` and its 6
products, `7th-st`, `19-photographs`, `19-photographs-1`, and the project
galleries `hawthorne-house`, `mochis-house`, `mcpherson-street`,
`cumberland-street`, `parish-house`.
