# Joseph Shimron — Photographs, 1962–1968

Served at https://todd.up.railway.app/jshimron/ by the nginx container in
this repo, whose Dockerfile copies the repo into the web root.

The photographs are NOT here. They live in the `stabley-homepage` Backblaze
bucket under `jshimron/`, and the HTML references them by absolute URL — so
this folder stays small and a Railway rebuild does not ship 3.4 MB of JPEGs.
To change the photographs, see `tools/sync-photos.sh` in the Shimron source.

The `<base href="/jshimron/">` in each page is what makes the URL work with
or without its trailing slash.

GENERATED — do not edit. Rebuilt by `tools/package.py --target deploy`.
