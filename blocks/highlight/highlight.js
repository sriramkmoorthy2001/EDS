import { createOptimizedPicture } from '../../scripts/aem.js';

function buildSlide(row) {
  const [imageCell, contentCell] = row.children;

  const slide = document.createElement('div');
  slide.className = 'highlight-slide';

  const media = document.createElement('div');
  media.className = 'highlight-media';
  const img = imageCell?.querySelector('img');
  if (img) {
    media.append(createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '1920' },
      { width: '750' },
    ]));
  }
  slide.append(media);

  const content = document.createElement('div');
  content.className = 'highlight-content';

  const heading = contentCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.className = 'highlight-heading';
    content.append(heading);
  }

  contentCell?.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('a.button, a')) {
      const link = p.querySelector('a');
      if (link && p.children.length === 1 && p.textContent.trim() === link.textContent.trim()) {
        link.className = 'highlight-cta';
        content.append(link);
        return;
      }
    }
    p.className = 'highlight-desc';
    content.append(p);
  });

  slide.append(content);
  return slide;
}

export default function decorate(block) {
  const rows = [...block.children];
  const slides = rows.map(buildSlide);

  block.textContent = '';

  const track = document.createElement('div');
  track.className = 'highlight-track';
  slides.forEach((slide) => track.append(slide));
  block.append(track);

  if (slides.length <= 1) {
    slides[0]?.classList.add('is-active');
    return;
  }

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Highlights');

  const AUTOPLAY_MS = 6000;
  const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>';

  let current = 0;
  let autoplayId = null;
  let isPlaying = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dotsNav = document.createElement('div');
  dotsNav.className = 'highlight-dots';
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'highlight-dot';
    dot.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    dotsNav.append(dot);
    return dot;
  });

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'highlight-arrow highlight-arrow-prev';
  prev.setAttribute('aria-label', 'Previous highlight');
  prev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'highlight-arrow highlight-arrow-next';
  next.setAttribute('aria-label', 'Next highlight');
  next.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  const playPause = document.createElement('button');
  playPause.type = 'button';
  playPause.className = 'highlight-playpause';

  const goToInternal = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  };

  const stopAutoplay = () => {
    clearInterval(autoplayId);
    autoplayId = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayId = setInterval(() => goToInternal(current + 1), AUTOPLAY_MS);
  };

  const setPlaying = (playing) => {
    isPlaying = playing;
    playPause.innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
    playPause.setAttribute('aria-label', isPlaying ? 'Pause autoplay' : 'Play autoplay');
    if (isPlaying) startAutoplay();
    else stopAutoplay();
  };

  const goTo = (index) => {
    goToInternal(index);
    if (isPlaying) startAutoplay();
  };

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  playPause.addEventListener('click', () => setPlaying(!isPlaying));

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  const controls = document.createElement('div');
  controls.className = 'highlight-controls';
  controls.append(playPause, dotsNav);

  block.append(prev, next, controls);
  goToInternal(0);
  setPlaying(isPlaying);
}
