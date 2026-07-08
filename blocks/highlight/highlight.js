import { createOptimizedPicture } from '../../scripts/aem.js';

// authors mark a word or phrase as `((accented text))(color)` in the heading,
// e.g. "This is my ((second)) heading" -> "This is my ((second))(red) heading"
// Matching happens against the heading's plain text (not innerHTML) so that bold/italic
// applied to part of the marked phrase in da.live doesn't break the marker adjacency.
const ACCENT_PATTERN = /\(\(([\s\S]+?)\)\)\(([^()]+)\)/g;
const SAFE_COLOR = /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}|[a-zA-Z]{2,20})$/;

function findTextPosition(root, targetOffset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let node = walker.nextNode();
  let last = null;
  while (node) {
    const len = node.textContent.length;
    if (consumed + len >= targetOffset) {
      return { node, offset: targetOffset - consumed };
    }
    consumed += len;
    last = node;
    node = walker.nextNode();
  }
  return last ? { node: last, offset: last.textContent.length } : null;
}

function rangeAt(root, start, end) {
  const startPos = findTextPosition(root, start);
  const endPos = findTextPosition(root, end);
  if (!startPos || !endPos) return null;
  const range = document.createRange();
  range.setStart(startPos.node, startPos.offset);
  range.setEnd(endPos.node, endPos.offset);
  return range;
}

function applyHeadingAccents(heading) {
  if (!heading) return;
  const text = heading.textContent;
  const matches = [...text.matchAll(ACCENT_PATTERN)].map((m) => ({
    fullStart: m.index,
    fullEnd: m.index + m[0].length,
    phraseStart: m.index + 2,
    phraseEnd: m.index + 2 + m[1].length,
    color: m[2].trim(),
  }));

  // process right-to-left so earlier offsets stay valid as later ones are mutated
  matches.reverse().forEach(({
    fullStart, fullEnd, phraseStart, phraseEnd, color,
  }) => {
    rangeAt(heading, phraseEnd, fullEnd)?.deleteContents(); // remove `))(color)`
    rangeAt(heading, fullStart, phraseStart)?.deleteContents(); // remove `((`
    if (!SAFE_COLOR.test(color)) return;
    const phraseRange = rangeAt(heading, phraseStart - 2, phraseEnd - 2);
    if (!phraseRange) return;
    const span = document.createElement('span');
    span.className = 'highlight-heading-accent';
    span.style.color = color;
    // extractContents (unlike surroundContents) tolerates the phrase boundary
    // falling inside another element - e.g. stray <code> tags some editors
    // insert around text that looks like markup - by splitting/cloning as needed.
    span.append(phraseRange.extractContents());
    phraseRange.insertNode(span);
  });
}

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
  content.className = 'highlight-card';

  const heading = contentCell?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.className = 'highlight-heading';
    applyHeadingAccents(heading);
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

  const progressNav = document.createElement('div');
  progressNav.className = 'highlight-progress';
  const segments = slides.map((_, i) => {
    const segment = document.createElement('button');
    segment.type = 'button';
    segment.className = 'highlight-progress-segment';
    segment.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    const fill = document.createElement('span');
    fill.className = 'highlight-progress-fill';
    segment.append(fill);
    progressNav.append(segment);
    return { segment, fill };
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

  const counter = document.createElement('span');
  counter.className = 'highlight-counter';

  const setFill = (fill, width, animated) => {
    fill.style.transition = animated ? `width ${AUTOPLAY_MS}ms linear` : 'none';
    fill.style.width = width;
  };

  const goToInternal = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    segments.forEach(({ segment, fill }, i) => {
      segment.classList.toggle('is-active', i === current);
      if (i < current) {
        setFill(fill, '100%', false);
      } else if (i > current) {
        setFill(fill, '0%', false);
      }
    });
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };

  const stopAutoplay = () => {
    clearInterval(autoplayId);
    autoplayId = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    const { fill } = segments[current];
    setFill(fill, '0%', false);
    requestAnimationFrame(() => setFill(fill, '100%', true));
    autoplayId = setInterval(() => goToInternal(current + 1), AUTOPLAY_MS);
  };

  const setPlaying = (playing) => {
    isPlaying = playing;
    playPause.innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
    playPause.setAttribute('aria-label', isPlaying ? 'Pause autoplay' : 'Play autoplay');
    if (isPlaying) {
      startAutoplay();
    } else {
      stopAutoplay();
      const { fill } = segments[current];
      const computedWidth = getComputedStyle(fill).width;
      setFill(fill, computedWidth, false);
    }
  };

  const goTo = (index) => {
    goToInternal(index);
    if (isPlaying) startAutoplay();
    else setFill(segments[current].fill, '0%', false);
  };

  segments.forEach(({ segment }, i) => segment.addEventListener('click', () => goTo(i)));
  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  playPause.addEventListener('click', () => setPlaying(!isPlaying));

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  const meta = document.createElement('div');
  meta.className = 'highlight-meta';
  meta.append(playPause, counter);

  const topbar = document.createElement('div');
  topbar.className = 'highlight-topbar';
  topbar.append(progressNav, meta);

  track.append(topbar, prev, next);
  goToInternal(0);
  setPlaying(isPlaying);
}
