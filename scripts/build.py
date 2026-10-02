#!/usr/bin/env python3
"""Build web images + project data for the Craftwork v2 site.

Single source of truth for the portfolio. Edit PROJECTS below, then run:

    python3 scripts/build.py

Reads full-res originals from raw/ and source/ (not committed) and writes
resized, compressed WebP files to assets/img/<slug>/ plus assets/js/projects.js.
Requires Pillow.
"""
import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT_IMG = ROOT / "assets" / "img"
OUT_JS = ROOT / "assets" / "js" / "projects.js"

LONG_EDGES = (1000, 1800)  # srcset sizes by longest side; never upscaled
QUALITY = 70

RAW_HOUSE = "raw/Low Res/KarenHarmelin2026-{}T.jpg"
RAW_FURN = "raw/Craftwork furniture update/Craftwork_Card1_{}.jpg"
SITE = "source/craftworkhome/{}"
HOUZZ = "source/houzz/{}"

CATEGORIES = [
    ("new-construction", "New Construction"),
    ("renovation", "Renovation"),
    ("kitchens", "Kitchens"),
    ("baths", "Baths"),
    ("built-ins", "Cabinetry & Built-ins"),
    ("furniture", "Furniture"),
]

# Names marked (placeholder) are working titles until the client confirms.
PROJECTS = [
    {
        "slug": "2327-house",
        "title": "Carriage House",
        "year": "2026",
        "location": "Philadelphia, PA",
        "categories": ["new-construction", "built-ins", "kitchens", "baths"],
        "scope": "New construction, general contracting, cabinetry, built-ins, concrete",
        "summary": "A brick carriage house rebuilt as a light-filled family home. Behind the original garage doors: a wood-lined interior, an open stair rising over an interior garden, and a kitchen, bath and casework built entirely in our shop.",
        "photographer": "Karen Harmelin",
        "images": [RAW_HOUSE.format(n) for n in (
            "4610", "5042", "4553", "4575", "4554", "4569", "4600", "4591",
            "4559", "4674", "4646", "4663", "4672", "4927", "5026")],
        "featured": True,
    },
    {
        "slug": "live-edge-bed",
        "title": "Live-Edge Platform Bed",
        "placeholder": True,
        "year": "2026",
        "location": "Philadelphia, PA",
        "categories": ["furniture"],
        "scope": "Custom furniture",
        "summary": "A low platform bed with a single figured slab for a headboard, its natural edge left intact. The base is joined without visible hardware and sits just off the floor.",
        "images": [RAW_FURN.format(n) for n in (
            "0128", "0010", "0029", "0019", "0049", "0031", "0041", "0044",
            "0134", "0006", "0016", "0091")],
        "featured": True,
    },
    {
        "slug": "i-beam-bench",
        "title": "I-Beam Bench",
        "placeholder": True,
        "year": "2026",
        "location": "Philadelphia, PA",
        "categories": ["furniture"],
        "scope": "Custom furniture",
        "summary": "Salvaged structural steel paired with a slab top stitched together with butterfly keys. Industrial material, finished with a cabinetmaker's hand.",
        "images": [RAW_FURN.format(n) for n in ("0237", "0196", "0220", "0223", "0219", "0253")],
        "featured": True,
    },
    {
        "slug": "cone-table",
        "title": "Cone Side Table",
        "placeholder": True,
        "year": "2026",
        "location": "Philadelphia, PA",
        "categories": ["furniture"],
        "scope": "Custom furniture",
        "summary": "A spalted maple top balanced on a turned and ebonized cone.",
        "images": [RAW_FURN.format(n) for n in ("0147", "0068", "0148", "0152")],
    },
    {
        "slug": "oak-side-table",
        "title": "Oak Side Table",
        "placeholder": True,
        "year": "2026",
        "location": "Philadelphia, PA",
        "categories": ["furniture"],
        "scope": "Custom furniture",
        "summary": "Softened edges and heavy legs in solid oak. The top is laid up from end-grain blocks.",
        "images": [RAW_FURN.format(n) for n in ("0140", "0086", "0107", "0096", "0110")],
    },
    {
        "slug": "painted-stools",
        "title": "Painted Stools",
        "placeholder": True,
        "year": "2026",
        "location": "Philadelphia, PA",
        "categories": ["furniture"],
        "scope": "Custom furniture",
        "summary": "Sculptural stools carved from solid timber and finished in layered, worn-through color.",
        "images": [RAW_FURN.format(n) for n in ("0162", "0164", "0170", "0176")],
    },
    {
        "slug": "hawthorne-house",
        "title": "Hawthorne House",
        "year": "2018",
        "location": "Philadelphia, PA",
        "categories": ["renovation", "kitchens", "baths"],
        "scope": "Whole-home renovation, kitchen, baths, stair",
        "summary": "A full renovation of a Philadelphia row home. We opened the plan, exposed the brick and built a new stair, kitchen and two baths.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"hawthorne-house/{f}") for f in (
            "02-_dsc8454.jpg", "01-_dsc8458.jpg", "04-1912-1-1691.jpg", "05-1912-1-1709.jpg",
            "06-1912-1-1719.jpg", "07-_dsc8559.jpg", "08-_dsc8577.jpg", "09-_dsc8550.jpg",
            "03-1912-1-1687.jpg")],
        "featured": True,
    },
    {
        "slug": "parish-house",
        "title": "Parish House",
        "year": "2020",
        "location": "Philadelphia, PA",
        "categories": ["renovation", "kitchens", "baths", "built-ins"],
        "scope": "Renovation, kitchen, bar, baths, workshop",
        "summary": "Reclaimed barn wood, cast concrete and heart pine throughout a renovated home: a kitchen and bar, two baths, and a surfboard workshop in the basement.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"parish-house/{f}") for f in (
            "01-craftwork-2020--24.jpg", "02-craftwork-2020--27.jpg", "03-craftwork-2020--29.jpg",
            "04-craftwork-2020--32.jpg", "05-craftwork-2020--31.jpg", "06-craftwork-2020--33.jpg",
            "07-craftwork-2020--35.jpg")] + [SITE.format("custom-home-elements/03-craftwork-2020--36.jpg")],
        "featured": True,
    },
    {
        "slug": "mochis-house",
        "title": "Mochi's House",
        "year": "2020",
        "location": "Philadelphia, PA",
        "categories": ["kitchens"],
        "scope": "Kitchen design and build, cabinetry, concrete",
        "summary": "Deep green shaker cabinetry with unlacquered brass, a fireclay sink and poured concrete counters.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"mochis-house/{f}") for f in (
            "04-craftwork-2020-6911.jpg", "01-craftwork-2020-6885.jpg", "02-craftwork-2020-6805.jpg",
            "03-craftwork-2020-6913.jpg", "05-craftwork-2020-6799.jpg", "06-craftwork-2020-6918.jpg",
            "07-craftwork-2020-6945.jpg", "08-craftwork-2020-6921.jpg")],
        "featured": True,
    },
    {
        "slug": "mcpherson-street",
        "title": "McPherson Street",
        "year": "2020",
        "location": "Philadelphia, PA",
        "categories": ["kitchens", "baths"],
        "scope": "Kitchen, powder room, cabinetry, concrete",
        "summary": "A birch kitchen with walnut pulls and glass-inlaid concrete counters, plus a powder room with an integral concrete sink.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"mcpherson-street/{f}") for f in (
            "07-craftwork-2020--3.jpg", "01-craftwork-2020--4.jpg", "02-craftwork-2020-6528.jpg",
            "03-craftwork-2020--5.jpg", "04-craftwork-2020-6408.jpg", "06-craftwork-2020-6417.jpg",
            "08-craftwork-2020--7.jpg", "09-craftwork-2020--8.jpg")],
    },
    {
        "slug": "cumberland-street",
        "title": "Cumberland Street",
        "year": "2014",
        "location": "Philadelphia, PA",
        "categories": ["renovation", "built-ins"],
        "scope": "Whole-home renovation, built-ins, concrete",
        "summary": "Our own home and studio. It's where we test ideas: window seats, reclaimed floors, concrete counters with fossil and tile inlays.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"cumberland-street/{f}") for f in (
            "04-912craftwork-013.jpg", "01-912craftwork-001.jpg", "06-912craftwork-014.jpg",
            "10-912craftwork-027.jpg", "08-912craftwork-020.jpg", "09-912craftwork-021.jpg",
            "03-912craftwork-003.jpg", "07-912craftwork-009.jpg")],
    },
    {
        "slug": "dauphin-street-loft",
        "title": "Dauphin Street Loft",
        "year": "2016",
        "location": "Philadelphia, PA",
        "categories": ["renovation", "kitchens", "baths"],
        "scope": "Loft renovation, kitchen relocation, baths",
        "summary": "An expanded sleeping loft, a relocated kitchen and a new half-bath in a Fishtown loft, anchored by a board-formed concrete sink.",
        "images": [HOUZZ.format(f"dauphin-street-loft/{f}") for f in (
            "01-38b1582408c6c975_9-4494.jpg", "02-a2c14e1108c6c97e_9-4494.jpg",
            "04-db91445a08c6c98d_9-4494.jpg")] + [SITE.format("custom-home-elements/18-cw1-17-w-8457.jpg")],
    },
    {
        "slug": "reading-nook",
        "title": "Library Built-in",
        "placeholder": True,
        "year": "2020",
        "location": "Philadelphia, PA",
        "categories": ["built-ins"],
        "scope": "Built-in shelving, bench seating, storage",
        "summary": "Wall-to-wall shelving, a daybed-depth bench and a desk made as one piece of millwork.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"custom-home-elements/{f}") for f in (
            "02-craftwork-2020--18.jpg", "01-craftwork-2020--17.jpg")],
    },
    {
        "slug": "erdenheim",
        "title": "Erdenheim",
        "year": "2020",
        "location": "Erdenheim, PA",
        "categories": ["kitchens", "baths"],
        "scope": "Kitchen, bath, cabinetry, concrete",
        "summary": "Lacquered cabinetry, figured maple and poured concrete in a suburban kitchen and bath.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"custom-home-elements/{f}") for f in (
            "09-_dsc3602.jpg", "06-_dsc3569.jpg", "15-_dsc3458.jpg")],
    },
    {
        "slug": "shackamaxon",
        "title": "Shackamaxon",
        "year": "2020",
        "location": "Philadelphia, PA",
        "categories": ["kitchens", "baths"],
        "scope": "Kitchen, bath, concrete",
        "summary": "A loft kitchen beneath exposed joists and a bath with a trough-style concrete sink.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"custom-home-elements/{f}") for f in (
            "19-shackamaxon-2881.jpg", "10-shackamaxon-2926.jpg")],
    },
    {
        "slug": "chancellor-street",
        "title": "Chancellor Street",
        "year": "2016",
        "location": "Philadelphia, PA",
        "categories": ["kitchens"],
        "scope": "Kitchen, cabinetry, concrete",
        "summary": "Steel-grey concrete with an integral drainboard and a walnut towel bar, set on maple cabinetry.",
        "images": [HOUZZ.format(f"chancellor-street/{f}") for f in (
            "03-57e1653908c6c8db_9-8390.jpg", "01-3f91139d08c6c8cf_9-8390.jpg",
            "02-3ce1faee08c6c8d6_9-8390.jpg", "04-0dd159cb08c6c8e0_9-8390.jpg")],
    },
    {
        "slug": "key-kitchen",
        "title": "Key Kitchen",
        "year": "2013",
        "location": "Philadelphia, PA",
        "categories": ["kitchens"],
        "scope": "Kitchen, cabinetry, open shelving, concrete",
        "summary": "Colored laminate fronts, cherry open shelving and a concrete sink run with a drainboard.",
        "photographer": "Isaac Turner",
        "images": [SITE.format("custom-home-elements/11-cw13-9846.jpg")] + [HOUZZ.format(f"key-kitchen/{f}") for f in (
            "01-d521800102619e9d_9-6042.jpg", "02-9981797102619ea2_9-6042.jpg",
            "04-bf51eed602619eb9_9-6042.jpg")],
    },
    {
        "slug": "mammoth-coffee",
        "title": "Mammoth Coffee",
        "year": "2016",
        "location": "Philadelphia, PA",
        "categories": ["built-ins"],
        "scope": "Commercial millwork, service counter, concrete",
        "summary": "A service counter for a Northern Liberties café, built from reclaimed wood and poured concrete with glass and tile inlays.",
        "images": [HOUZZ.format(f"mammoth-coffee-shop/{f}") for f in (
            "01-80a1dbed08c6c7e5_9-4775.jpg", "05-83b1172208c6c806_9-4775.jpg",
            "04-b5f1249908c6c800_9-4775.jpg", "02-4851c86808c6c7f0_9-4493.jpg")],
    },
    {
        "slug": "studio-furniture",
        "title": "Studio Furniture",
        "year": "2012–2020",
        "location": "Philadelphia, PA",
        "categories": ["furniture"],
        "scope": "Tables, seating, storage, vanities",
        "summary": "Earlier pieces from the shop: reclaimed-wood tables, a railroad-tie bench, a purpleheart-banded bookshelf and a concrete vanity.",
        "photographer": "Isaac Turner",
        "images": [SITE.format(f"furniture/{f}") for f in (
            "08-fin-_dsc7359.jpg", "01-cw1-17-w-8366.jpg", "02-cw1-17-w-8236.jpg",
            "05-912craftwork-033.jpg", "06-cw12-16.jpg", "04-craftwork-holiday-15-061.jpg",
            "09-craftwork-holiday-15-003.jpg", "07-912craftwork-030.jpg")],
    },
]


def slugify(stem: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")


def build_image(src: Path, dest_dir: Path, name: str):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    w, h = im.size
    files = []
    for edge in LONG_EDGES:
        tw = min(w, round(w * edge / max(w, h)))
        if files and tw == files[-1][1]:
            continue
        out = dest_dir / f"{name}-{min(edge, max(w, h))}.webp"
        if not out.exists():
            im.resize((tw, round(h * tw / w)), Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=5)
        files.append((out.relative_to(ROOT).as_posix(), tw))
    return {"src": files[0][0], "srcset": ", ".join(f"{p} {tw}w" for p, tw in files),
            "w": w, "h": h}


def main():
    live = {p["slug"] for p in PROJECTS}
    if OUT_IMG.exists():
        for d in OUT_IMG.iterdir():
            if d.is_dir() and d.name not in live:
                shutil.rmtree(d)
    data = []
    for p in PROJECTS:
        dest = OUT_IMG / p["slug"]
        dest.mkdir(parents=True, exist_ok=True)
        images = [build_image(ROOT / src, dest, slugify(Path(src).stem)) for src in p["images"]]
        keep = {Path(im["src"]).parent / Path(f.split(" ")[0]).name
                for im in images for f in im["srcset"].split(", ")}
        for f in dest.iterdir():
            if f.relative_to(ROOT) not in keep:
                f.unlink()
        data.append({**{k: v for k, v in p.items() if k != "images"}, "images": images})
        print(f"{p['slug']}: {len(images)} images")
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "// Generated by scripts/build.py — edit PROJECTS there, not here.\n"
        f"window.CATEGORIES = {json.dumps(dict(CATEGORIES), indent=2)};\n"
        f"window.PROJECTS = {json.dumps(data, indent=2, ensure_ascii=False)};\n")


if __name__ == "__main__":
    main()
