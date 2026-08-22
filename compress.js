// Compresse posts/ -> posts_web/ pour rester sous ~50 Mo au total (repo git).
// Images : redimensionnées + JPEG qualité réduite. Vidéos : H.264 720p max, bitrate réduit. Audio : AAC 96kbps.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MOCKUP_DIR = __dirname;
const SRC_DIR = path.join(MOCKUP_DIR, 'posts');
const OUT_DIR = path.join(MOCKUP_DIR, 'posts_web');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.aac', '.ogg']);

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(SRC_DIR).filter(f => !f.startsWith('.'));

for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  const base = path.basename(f, path.extname(f));
  const srcPath = path.join(SRC_DIR, f);

  if (IMAGE_EXT.has(ext)) {
    const outPath = path.join(OUT_DIR, base + '.jpg');
    execFileSync('ffmpeg', ['-y', '-i', srcPath, '-vf', "scale='min(1080,iw)':-2", '-q:v', '5', outPath], { stdio: 'ignore' });
    console.log(`image  ${f} -> ${path.basename(outPath)}`);
  } else if (VIDEO_EXT.has(ext)) {
    const outPath = path.join(OUT_DIR, base + '.mp4');
    execFileSync('ffmpeg', ['-y', '-i', srcPath,
      '-vf', "scale='min(720,iw)':-2",
      '-c:v', 'libx264', '-crf', '30', '-preset', 'veryfast',
      '-c:a', 'aac', '-b:a', '96k',
      '-movflags', '+faststart',
      outPath], { stdio: 'ignore' });
    console.log(`video  ${f} -> ${path.basename(outPath)}`);
  } else if (AUDIO_EXT.has(ext)) {
    const outPath = path.join(OUT_DIR, base + '.m4a');
    execFileSync('ffmpeg', ['-y', '-i', srcPath, '-c:a', 'aac', '-b:a', '96k', outPath], { stdio: 'ignore' });
    console.log(`audio  ${f} -> ${path.basename(outPath)}`);
  }
}

console.log('✔ Compression terminée -> posts_web/');
