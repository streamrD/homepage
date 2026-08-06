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
  var DEFAULT_ASSETS = '';

  // Which pictures a page shows when nothing overrides it.
  //
  //   'photographs'  the Moore light studies from /jimmy/ — what ships,
  //                  because tiles/ is git-ignored and there is no bucket yet
  //   'filler'       the generated test tiles — local only, after
  //                  make-tiles.sh has been run
  //
  // ?tiles=photographs | filler overrides for one request.
  var DEFAULT_CONTENT = 'photographs';

  // Are the generated filler tiles actually present? They are git-ignored,
  // so on the deployed site they are not, and asking for them yields a page
  // of 404s rather than a gallery. Run loupe/make-tiles.sh and add ?filler=1
  // to use them locally; flip this to true once a bucket holds them.
  var FILLER_PRESENT = false;

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
