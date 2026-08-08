# Working in this repo

`streamrD/homepage` — the personal home page at todd.up.railway.app, plus
four separate sites served as folders under it. Railway builds from `main`
with an nginx Dockerfile that copies the repo into the web root, so **a push
to `main` is a deploy**, live in about half a minute, and everything
committed here is publicly served. Nothing secret belongs in the repo.

Several of these projects are worked on independently and often at the same
time — `jimmy/`, `jshimron/`, `moore/` and `moore/moore-template/` are all
live. Stage the paths you touched — `git add <path>` — rather than `git add
-A`, and check `git status` before committing, or you will sweep up someone
else's half-finished work. Assume the tree holds changes that are not yours.

## Read this before editing any file

Two of the five folders are **copies of a source that lives outside this
repo**. They look like ordinary parts of the repo and are not.

| Folder | Edit here? | Source of truth |
| --- | --- | --- |
| `index.html`, `favicon*`, `make-favicon.py` | yes | this repo |
| `jshimron/` | **no — generated** | `~/AgenticAI/yonat/2026/src` |
| `moore/` | see below | hand-synced with `~/AgenticAI/moore/Flash/web` |
| `moore/moore-template/` | **no — rebuilt wholesale** | `moore/` + `tools/`, via `make template` |
| `jimmy/` | yes | this repo |
| `loupe/` | yes | this repo |

### `jshimron/` — one-way generated, and it will eat your work

Built by `package.py`, which **deletes the destination first**
(`shutil.rmtree`). Edits made only here survive until the next release and
then vanish without trace.

```sh
cd ~/AgenticAI/yonat/2026/src
python3 tools/package.py --target deploy   # writes straight into this repo
# then commit and push here, and commit in ~/AgenticAI/yonat too
```

`yonat` is a **separate git repo with no remote** — it is the only copy of
that source, so a commit there is the only thing protecting it.

`assets/css/site.css` and `assets/js/site.js` are copied verbatim
(`shutil.copy2`), so a byte-identical port in either direction is safe if
you discover you edited the wrong copy. The HTML is built from
`data/photos.json` by `build.py` and must never be hand-edited in either
place. Docs live in the source repo — `yonat/2026/README.md` ("Notes on
fidelity" tracks interaction details closely) and `yonat/2026/HANDOFF.md`
(numbered acceptance checks). Both quote specific pixel values, so a change
to hover or fade behaviour usually touches both.

### `moore/` — two copies, kept in step by hand

`~/AgenticAI/moore/Flash/web/` holds the same tree and the `tools/` and
`Makefile` that this repo does not. As of 2026-08-07 the two are identical.

Unlike `jshimron/` there is **no script that copies one to the other** — no
deploy target, no rsync — so nothing here gets overwritten behind your back.
Note which way the safety runs: the source side is *not a git repo*, so the
copy in this repo is the version-controlled one. Change both, and check
`cmp` before assuming they agree.

### `moore/moore-template/` — fully rebuilt by `make template`

The same design with the family removed. Every file in it is regenerated:

```make
rm -rf moore-template/assets moore-template/[0-9a-z]*.html
cp -R assets moore-template/assets
cp *.html moore-template/ && rm -f moore-template/README.md
python template_images.py     # blanks the photographs to palette swatches
python template_text.py       # rewords it and swaps the typography
```

So an edit made in `moore-template/` is wiped by the next `make template`.
Note where the leverage actually is: `template.css` is **not** a file of the
template's own — it lives in `moore/assets/css/` and is copied in, which is
what stopped the `rm -rf` deleting it. Placeholder colours and substitute
type come from the two scripts, so that is where a change to them belongs.

The Makefile and `tools/` are only in `~/AgenticAI/moore/Flash/web`, so
rebuilding means working in the copy that is not under version control.

## The projects

Each has its own README, and they are good — read the one for the folder you
are in before changing anything. `loupe/ARCHITECTURE.md` is the deepest of
them.

- **`index.html`** — the home page. Styles inline, no dependencies. Its hero
  photograph is served from Backblaze, not from here.
- **`jshimron/`** — a 2005 Flash photography site rebuilt in plain
  HTML/CSS/JS, reproduced pixel-for-pixel from the decompiled SWF. Its 80
  photographs come from the `stabley-homepage` bucket.
- **`moore/`** — a 2004 Flash site, likewise rebuilt from the SWF binaries.
- **`jimmy/`** — five long exposures, full-bleed. Serves its own images out
  of the repo (~3 MB), and carries its own favicon and share card. `v1/`
  keeps the first design working, sharing images with the live page.
- **`loupe/`** — the gallery pattern from `jimmy/`, generalised: one engine,
  fifteen themes, no build step. A theme is a block of CSS custom properties
  and nothing else. Its 441 test tiles are git-ignored; until a bucket
  exists the deployed pages borrow the `/jimmy/` photographs.

## Traps worth knowing

- **Run git from the repo root**, `~/AgenticAI/todd`, so paths carry the
  site prefix. Several sites have identically-named files — `assets/css/site.css`
  exists three times — and a path without its prefix can stage or show the
  wrong one while looking entirely correct.
- **These are reproductions.** In `jshimron/` and `moore/`, oddities are
  usually deliberate and measured out of the original: a thumbnail a few
  pixels off its grid, a wordmark colour that differs between galleries, an
  empty caption. Check the README before "fixing" one.
- **No build step** for the home page, `jimmy/` or `loupe/`; serve over HTTP
  rather than opening `file://`, which breaks relative asset paths.
