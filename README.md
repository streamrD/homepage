# todd.up.railway.app

Personal home page: one photograph, a list of links, no build step.

## Deploying

Railway builds from GitHub (`streamrD/homepage`, `main`) using the
Dockerfile — `nginx:alpine` with the repo copied into the web root:

```dockerfile
COPY . /usr/share/nginx/html
```

So **push to `main` and it is live** in about half a minute. It also means
everything committed here is publicly served, including this README. Nothing
secret belongs in the repo.

## Layout

```
index.html            the page — styles inline, no dependencies
favicon.ico           TS monogram, 16/32/48 packed
favicon-32.png        \  referenced from index.html
apple-touch-icon.png  /
make-favicon.py       regenerates the three icon files
jshimron/             a separate site — see below
jimmy/                a separate site — see below
moore/                a separate site — see moore/README.md
loupe/                the gallery pattern jimmy is built on — see below
```

`jshimron/` and `moore/` are copies of sources that live outside this repo;
`CLAUDE.md` has the table of which folders are safe to edit in place.

The page loads the hero photograph — Detroit, c. 1964, from Moore Archives —
from Backblaze, at `stabley-homepage.s3.us-east-005.backblazeb2.com/detroit750.jpg`.
No copy is kept in this repo. `make-favicon.py` does not need one: the two
colours it uses were sampled by hand once and are hardcoded as `CREAM` and
`SALMON`. To re-sample them, pull the file from the bucket.

Nothing in this repo serves an image. The Shimron galleries under `jshimron/`
take their 80 photographs from the same bucket, under `jshimron/`.

## The favicon

A two-tone TS monogram — cream T over salmon S — echoing the lettering in
the photograph, where "Todd Stabley" sits in cream above "home" in salmon.
Both colours are sampled from the image. It is set in Rockwell Bold Italic,
the closest slab serif available to that oblique lettering; the photograph's
own type is baked into the JPEG, so there were no outlines to reuse.

```sh
python3 make-favicon.py
```

Needs macOS and Chrome, since it renders type in a local font. `favicon.ico`
carries 16/32/48 as embedded PNGs so the root request browsers make blindly
is answered without depending on the `<link>` tags.

## `jshimron/`

A rebuild of a 2005 Flash photography site, served at
[/jshimron](https://todd.up.railway.app/jshimron) as an interim home until
ourheroes.app can host bespoke designs.

> **Generated output — do not edit these files here.** They are built from a
> separate repo at `~/AgenticAI/yonat` and overwritten wholesale on each
> release — `package.py` deletes the destination before writing it:
>
> ```sh
> cd ~/AgenticAI/yonat/2026/src && python3 tools/package.py --target deploy
> ```
>
> Then commit and push here, and commit in `~/AgenticAI/yonat` too — it has
> no remote, so that commit is the only copy. Edits made directly in
> `jshimron/` are lost the next time that runs. See
> `~/AgenticAI/yonat/2026/README.md`.

Those pages carry `<base href="/jshimron/">`, so their relative links and
icons resolve within that folder and the URL works with or without a
trailing slash. They do not affect this page's own favicon.

## `jimmy/`

Five long exposures on 2¼-inch film by James Vincent Moore, Detroit, early
to mid 1960s — a full-bleed gallery at
[/jimmy](https://todd.up.railway.app/jimmy). Hand-written here, unlike
`jshimron/`, so it is safe to edit in place.

Unlike this page, it serves its own images out of the repo rather than the
bucket — `jimmy/img/` and `jimmy/thumbs/`, about 3 MB. The camera originals
are git-ignored. It also carries its own favicon and share card, cut from one
of the photographs, so `/jimmy` does not borrow the TS monogram. See
`jimmy/README.md` for how all of it is regenerated.

The first design is kept intact and working at
[/jimmy/v1](https://todd.up.railway.app/jimmy/v1) — three photographs bursting
from a small square to full bleed, then five thumbnails flying to a corner
rail. It shares `img/` and `thumbs/` with the live page rather than
duplicating them, and is marked `noindex`.

## `loupe/`

The gallery pattern extracted from `jimmy/` and generalised: one engine,
fifteen themes, an entry page and a section page, no build step and no
dependencies. Served at [/loupe](https://todd.up.railway.app/loupe) —
`themes.html` is the way in.

A theme is a block of CSS custom properties and nothing else; the engine
contains no appearance decisions. The gallery itself is a JSON manifest whose
`base` is the only thing that knows where the pictures live, which is the seam
a storage backend plugs into.

The 441 generated test tiles are **git-ignored** — about 21 MB of scaffolding
that `loupe/make-tiles.sh` rebuilds in a couple of minutes. Until a bucket
exists the deployed pages therefore show the Moore photographs from `/jimmy/`;
`loupe/assets/config.js` holds that switch.

`loupe/ARCHITECTURE.md` is the write-up: the decisions, the seams a hosted
platform would plug into, and the traps worth not re-treading.
