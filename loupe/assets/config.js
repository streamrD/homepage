/* loupe — where the imagery lives.
 *
 * One switch. The pages and the engine never name a host: a manifest's
 * `base` is built from this, so moving assets to a bucket is a change here
 * rather than an edit in three files.
 *
 *   ''                     alongside these pages — local development, and
 *                          what `make-tiles.sh` writes to
 *   'https://…/loupe/'     a bucket prefix — staging and beyond
 *
 * Load this before loupe.js. `?assets=<url>` overrides it for one request,
 * which is how you compare local against the bucket without editing
 * anything; `?assets=` (empty) forces local back on.
 *
 * The Moore photographs behind ?tiles=photographs are deliberately NOT
 * routed through this — they are served from /jimmy/ on the site itself and
 * stay put wherever the tiles go.
 */
window.LOUPE_CONFIG = (function () {
  var DEFAULT_ASSETS =
    'https://stabley-homepage.s3.us-east-005.backblazeb2.com/loupe/';

  // Which pictures a page shows when nothing overrides it.
  //
  //   'photographs'  the Moore light studies from /jimmy/
  //   'filler'       the generated test tiles, now served from the bucket
  //
  // ?tiles=photographs | filler overrides for one request.
  var DEFAULT_CONTENT = 'photographs';

  // Are the filler tiles reachable? They live in the bucket now rather than
  // the repo, so yes — but the flag stays, because the failure it guards
  // against (a switch that asks for pictures nobody deployed) is the kind
  // that comes back. ?assets= '' with ?filler=1 serves them locally instead.
  var FILLER_PRESENT = true;

  var q = new URLSearchParams(location.search).get('assets');
  var assets = q === null ? DEFAULT_ASSETS : q;

  // A prefix without a trailing slash silently concatenates into nonsense.
  if (assets && !/\/$/.test(assets)) assets += '/';

  var qs = new URLSearchParams(location.search);
  var filler = qs.get('filler') === '1' ? true : FILLER_PRESENT;

  var content = qs.get('tiles') || DEFAULT_CONTENT;
  // Never serve a request for pictures that are not there.
  if (content === 'filler' && !filler) content = 'photographs';

  return { assets: assets, content: content, filler: filler };
})();
