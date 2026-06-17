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
  const heading = rows[0]?.querySelector('h1,h2,h3,h4')?.textContent.trim() || rows[0]?.textContent.trim();
  const desc = rows[1]?.textContent.trim();
  const pillsText = rows[2]?.textContent.trim();
  const ctaLink = rows[3]?.querySelector('a[href]');

  block.textContent = '';

  const mockup = buildMockup();

  const pills = pillsText
    ? pillsText.split(',').map((p) => `<span class="spotlight-pill">${p.trim()}</span>`).join('')
    : '';

  const textCol = document.createElement('div');
  textCol.className = 'spotlight-text';
  textCol.innerHTML = `
    <h2>${heading}</h2>
    <p>${desc}</p>
    ${pills ? `<div class="spotlight-pills">${pills}</div>` : ''}
    ${ctaLink ? `<a href="${ctaLink.href}" class="spotlight-btn">${ctaLink.textContent} →</a>` : ''}`;

  const inner = document.createElement('div');
  inner.className = 'spotlight-inner rise';
  inner.append(mockup, textCol);
  block.append(inner);

  mockup.querySelectorAll('.spotlight-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const { tag } = chip.dataset;
      mockup.querySelectorAll('.spotlight-chip').forEach((c) => c.classList.toggle('on', c === chip));
      mockup.querySelectorAll('.spotlight-card').forEach((card) => {
        card.style.display = !tag || card.dataset.tag === tag ? '' : 'none';
      });
    });
  });

  observeRise(block);
}
