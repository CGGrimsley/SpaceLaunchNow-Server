#!/bin/bash
# Builds the line-up + 3D viewer bundle for the launch vehicle page and the standalone mockup.
#   npm install && ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
ROOT=../..
OUT=$ROOT/src/static/lineup
npx esbuild src/vehicle-entry.js --bundle --minify --format=iife --target=es2020 --outfile=$OUT/lineup.js --log-level=warning
cp src/lineup.css $OUT/lineup.css
npx esbuild src/mockup-entry.js --bundle --minify --format=iife --target=es2020 --outfile=dist/mockup.js --log-level=warning
python3 - <<'PY'
page = open('mockup.html').read()
js = open('dist/mockup.js').read().replace('</script', '<\\/script')
page = page.replace('<!--MODULE-->', open('module.html').read())
page = page.replace('<style>/*CSS*/</style>', '<style>' + open('src/lineup.css').read() + '</style>')
page = page.replace('<script>/*APP*/</script>',
                    '<script>window.LINEUP_MODEL_BASE="../../../src/static/lineup/models/";</script>\n<script>' + js + '</script>')
open('../../docs/mockups/rocket-lineup-3d/index.html', 'w').write(page)
PY
ls -la $OUT/lineup.js $OUT/lineup.css ../../docs/mockups/rocket-lineup-3d/index.html
