import { createOptimizedPicture } from '../../scripts/aem.js';

function observeRise(root) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll('.rise').forEach((el) => io.observe(el));
  }));
}

function buildMockup() {
  const wrap = document.createElement('div');
  wrap.className = 'spotlight-mockup';
  wrap.innerHTML = `
    <div class="spotlight-titlebar">
      <div class="spotlight-tab-label">
        <span class="spotlight-tab-dot"></span>EDS Reports
      </div>
      <div class="spotlight-win-controls">
        <span class="spotlight-win-btn">&#x2013;</span>
        <span class="spotlight-win-btn">&#x25A1;</span>
        <span class="spotlight-win-btn spotlight-win-close">&#x2715;</span>
      </div>
    </div>
    <div class="spotlight-toolbar">
      <div class="spotlight-search">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        Search reports by title…
      </div>
      <div class="spotlight-chips">
        <button class="spotlight-chip on" data-tag="" type="button">All</button>
        <button class="spotlight-chip" data-tag="Annual" type="button">Annual</button>
        <button class="spotlight-chip" data-tag="Monthly" type="button">Monthly</button>
        <button class="spotlight-chip" data-tag="Quarterly" type="button">Quarterly</button>
      </div>
    </div>
    <div class="spotlight-cards">
      <div class="spotlight-card" data-tag="Annual">
        <div class="spotlight-card-img" style="background:#eef2f6"><span class="spotlight-card-badge">Annual</span></div>
        <div class="spotlight-card-body"><div class="sph"></div><div class="sph s"></div><div class="sph xs"></div></div>
      </div>
      <div class="spotlight-card" data-tag="Monthly">
        <div class="spotlight-card-img" style="background:#f2f2f6"><span class="spotlight-card-badge">Monthly</span></div>
        <div class="spotlight-card-body"><div class="sph"></div><div class="sph s"></div><div class="sph xs"></div></div>
      </div>
      <div class="spotlight-card" data-tag="Quarterly">
        <div class="spotlight-card-img" style="background:#f0f4f0"><span class="spotlight-card-badge">Quarterly</span></div>
        <div class="spotlight-card-body"><div class="sph"></div><div class="sph s"></div><div class="sph xs"></div></div>
      </div>
      <div class="spotlight-card" data-tag="Annual">
        <div class="spotlight-card-img" style="background:#f5f2ee"><span class="spotlight-card-badge">Annual</span></div>
        <div class="spotlight-card-body"><div class="sph"></div><div class="sph s"></div><div class="sph xs"></div></div>
      </div>
    </div>
    <div class="spotlight-pager">
      <span class="spotlight-pg">‹</span>
      <span class="spotlight-pg on">1</span>
      <span class="spotlight-pg">2</span>
      <span class="spotlight-pg">›</span>
    </div>`;
  return wrap;
}

export default function decorate(block) {
  const rows = [...block.children];

  let heading = '';
  let desc = '';
  let imgEl = null;
  let ctaLink = null;

  // rows are read by content type (heading / image / link-only / text), not
  // by fixed position, so authors can add an image row anywhere in the block.
  rows.forEach((row) => {
    const img = row.querySelector('img');
    const h = row.querySelector('h1,h2,h3,h4');
    if (img) {
      imgEl = img;
      return;
    }
    if (h) {
      heading = h.textContent.trim();
      return;
    }
    const link = row.querySelector('a[href]');
    if (link && row.textContent.trim() === link.textContent.trim()) {
      ctaLink = link;
      return;
    }
    const text = row.textContent.trim();
    if (text) desc = desc ? `${desc} ${text}` : text;
  });

  block.textContent = '';

  const mediaCol = document.createElement('div');
  mediaCol.className = 'spotlight-media';
  if (imgEl) {
    mediaCol.append(createOptimizedPicture(imgEl.src, imgEl.alt, false, [
      { media: '(min-width: 900px)', width: '900' },
      { width: '600' },
    ]));
  } else {
    mediaCol.append(buildMockup());
  }

  const textCol = document.createElement('div');
  textCol.className = 'spotlight-text';
  textCol.innerHTML = `
    <h2>${heading}</h2>
    <p>${desc}</p>
    ${ctaLink ? `<a href="${ctaLink.href}" class="spotlight-btn">${ctaLink.textContent}</a>` : ''}`;

  const inner = document.createElement('div');
  inner.className = 'spotlight-inner rise';
  inner.append(mediaCol, textCol);
  block.append(inner);

  mediaCol.querySelectorAll('.spotlight-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const { tag } = chip.dataset;
      mediaCol.querySelectorAll('.spotlight-chip').forEach((c) => c.classList.toggle('on', c === chip));
      mediaCol.querySelectorAll('.spotlight-card').forEach((card) => {
        card.style.display = !tag || card.dataset.tag === tag ? '' : 'none';
      });
    });
  });

  observeRise(block);
}
