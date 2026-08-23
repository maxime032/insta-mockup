#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "→ Compression posts/ → posts_web/ ..."
node compress.js
echo "→ Génération manifest.js (posts_web) ..."
node generate.js
echo "→ Envoi vers GitHub ..."
git add -A
git commit -m "Update mockup $(date '+%Y-%m-%d %H:%M')" || echo "(rien à commit)"
git push origin master
echo "✔ En ligne : https://maxime032.github.io/insta-mockup/"
