const fs = require('fs');
const path = require('path');

const MOCKUP_DIR = __dirname;
const POSTS_DIR = path.join(MOCKUP_DIR, 'posts_web');
const POSTS_URL_DIR = 'posts_web';
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const NAME_RE = /^(\d{1,3})([A-Za-z]?)\.(jpg|jpeg|png|webp|gif|mp4|mov|webm)$/i;
const AUDIO_RE = /^(\d{1,3})\.(wav|mp3|m4a|aac|ogg)$/i;

function formatDate(ms) {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function hashLikes(str) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 8 + (h % 60);
}

const CAPTIONS_PATH = path.join(MOCKUP_DIR, 'captions.json');
const captions = fs.existsSync(CAPTIONS_PATH)
  ? JSON.parse(fs.readFileSync(CAPTIONS_PATH, 'utf8'))
  : {};

const files = fs.readdirSync(POSTS_DIR);
const groups = new Map(); // number -> [{letter, file}]
const audioTracks = new Map(); // number -> file

for (const f of files) {
  const am = f.match(AUDIO_RE);
  if (am) {
    audioTracks.set(am[1], f);
    continue;
  }
  const m = f.match(NAME_RE);
  if (!m) continue;
  const [, number, letter, ext] = m;
  if (!groups.has(number)) groups.set(number, []);
  groups.get(number).push({ letter: letter.toUpperCase(), file: f, ext: ext.toLowerCase() });
}

const posts = [];

for (const [number, items] of groups) {
  items.sort((a, b) => a.letter.localeCompare(b.letter));
  const mtimes = items.map(it => fs.statSync(path.join(POSTS_DIR, it.file)).mtimeMs);
  const audioFile = audioTracks.get(number);
  posts.push({
    number: parseInt(number, 10),
    dateLabel: formatDate(Math.max(...mtimes)),
    likes: hashLikes(number),
    caption: captions[number] || '',
    audio: audioFile ? POSTS_URL_DIR + '/' + encodeURIComponent(audioFile) : null,
    items: items.map(it => ({
      src: POSTS_URL_DIR + '/' + encodeURIComponent(it.file),
      type: VIDEO_EXT.has('.' + it.ext) ? 'video' : 'image'
    }))
  });
}

posts.sort((a, b) => b.number - a.number); // most recent (24) first
posts.forEach(p => delete p.number);

const js = 'window.POSTS = ' + JSON.stringify(posts, null, 2) + ';\n';
fs.writeFileSync(path.join(MOCKUP_DIR, 'manifest.js'), js);
console.log(`✔ ${posts.length} post(s) trouvé(s) → manifest.js régénéré`);
