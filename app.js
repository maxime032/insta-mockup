const posts = window.POSTS || [];
let currentPost = 0;
let postAudio = null;

function stopPostAudio() {
  if (postAudio) {
    postAudio.pause();
    postAudio = null;
  }
}

const grid = document.getElementById('grid');
const viewer = document.getElementById('viewer');
const carousel = document.getElementById('carousel');
const dots = document.getElementById('dots');

function mediaEl(item, { autoplay = false, sound = false, controls = false } = {}) {
  if (item.type === 'video') {
    const v = document.createElement('video');
    v.src = item.src;
    v.playsInline = true;
    v.loop = true;
    v.controls = controls;
    v.muted = !sound;
    if (autoplay) {
      v.play().catch(() => {
        // autoplay avec son bloqué par le navigateur : retenter en muet
        v.muted = true;
        v.play().catch(() => {});
      });
    }
    return v;
  }
  const img = document.createElement('img');
  img.src = item.src;
  return img;
}

function renderGrid() {
  grid.innerHTML = '';

  if (posts.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      Aucun post trouvé.<br><br>
      Mets tes photos/vidéos dans <b>_mockup/posts/</b>, nommées <b>1.jpg</b>, <b>2.jpg</b>...<br>
      (1 = plus ancien). Pour un carrousel : <b>9A.jpg</b>, <b>9B.jpg</b>...<br><br>
      Puis relance <b>generate.command</b>.
    </div>`;
    return;
  }

  posts.forEach((post, i) => {
    const cell = document.createElement('div');
    cell.className = 'grid-item';
    cell.appendChild(mediaEl(post.items[0]));
    if (post.items.length > 1) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = '⧉';
      cell.appendChild(b);
    } else if (post.items[0].type === 'video') {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = '▶';
      cell.appendChild(b);
    }
    cell.addEventListener('click', () => openViewer(i));
    grid.appendChild(cell);
  });
}

function getRatio(item) {
  return new Promise((resolve) => {
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => resolve(v.videoWidth / v.videoHeight || 4 / 5);
      v.onerror = () => resolve(4 / 5);
      v.src = item.src;
    } else {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 4 / 5);
      img.onerror = () => resolve(4 / 5);
      img.src = item.src;
    }
  });
}

function renderCaptionText(text) {
  const frag = document.createDocumentFragment();
  const parts = text.split(/(@[a-zA-Z0-9._]+)/g);
  parts.forEach((part) => {
    if (part.startsWith('@')) {
      const mention = document.createElement('span');
      mention.className = 'mention';
      mention.textContent = part;
      frag.appendChild(mention);
    } else {
      frag.appendChild(document.createTextNode(part));
    }
  });
  return frag;
}

async function openViewer(postIndex) {
  stopPostAudio();
  currentPost = postIndex;
  const post = posts[postIndex];

  const ratio = await getRatio(post.items[0]);
  carousel.style.aspectRatio = ratio;

  if (currentPost !== postIndex) return; // user already navigated elsewhere

  carousel.innerHTML = '';
  dots.innerHTML = '';

  const isCarousel = post.items.length > 1;
  const hasCustomAudio = !!post.audio;

  post.items.forEach((item) => {
    const wrap = document.createElement('div');
    wrap.className = 'carousel-item';
    // avec une piste audio dédiée, les vidéos restent muettes (visuel seul) : le son
    // vient uniquement de post.audio, qui joue en continu sans jamais redémarrer entre les diapos
    wrap.appendChild(mediaEl(item, { autoplay: true, sound: !isCarousel && !hasCustomAudio, controls: !isCarousel }));
    carousel.appendChild(wrap);
  });

  if (hasCustomAudio) {
    postAudio = new Audio(post.audio);
    postAudio.loop = true;
    postAudio.play().catch(() => {});
  } else if (isCarousel) {
    let activeIdx = -1;
    const syncCarouselSound = () => {
      const idx = Math.round(carousel.scrollLeft / carousel.clientWidth);
      if (idx === activeIdx) return; // ne re-toggle le son qu'au vrai changement de diapo (évite le glitch)
      activeIdx = idx;
      carousel.querySelectorAll('video').forEach(v => { v.muted = true; });
      const wrap = carousel.children[idx];
      const v = wrap && wrap.querySelector('video');
      if (v) v.muted = false;
    };
    syncCarouselSound();
    carousel.addEventListener('scroll', syncCarouselSound);
  }

  if (isCarousel) {
    post.items.forEach((_, idx) => {
      const d = document.createElement('span');
      d.className = 'dot' + (idx === 0 ? ' active' : '');
      dots.appendChild(d);
    });
    carousel.addEventListener('scroll', updateDots);
  }

  document.getElementById('prevBtn').style.display = post.items.length > 1 ? 'flex' : 'none';
  document.getElementById('nextBtn').style.display = post.items.length > 1 ? 'flex' : 'none';
  dots.style.display = post.items.length > 1 ? 'flex' : 'none';

  document.getElementById('postLikes').textContent = post.likes;

  const captionEl = document.getElementById('postCaption');
  captionEl.innerHTML = '';
  const u = document.createElement('b');
  u.textContent = '_maxime_rousseau';
  captionEl.appendChild(u);
  captionEl.appendChild(renderCaptionText(post.caption || ''));

  viewer.classList.add('open');
  viewer.scrollTop = 0;
  carousel.scrollLeft = 0;
}

function updateDots() {
  const idx = Math.round(carousel.scrollLeft / carousel.clientWidth);
  [...dots.children].forEach((d, i) => d.classList.toggle('active', i === idx));
}

function closeViewer() {
  viewer.classList.remove('open');
  carousel.querySelectorAll('video').forEach(v => v.pause());
  stopPostAudio();
}

document.getElementById('closeViewer').addEventListener('click', closeViewer);
document.getElementById('prevBtn').addEventListener('click', () => {
  carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
});
document.getElementById('nextBtn').addEventListener('click', () => {
  carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
});

renderGrid();
