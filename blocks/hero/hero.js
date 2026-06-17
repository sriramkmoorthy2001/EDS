function buildMockup() {
  const win = document.createElement('div');
  win.className = 'hero-mockup';
  win.innerHTML = `
    <div class="hero-titlebar">
      <div class="hero-tab-label">
        <span class="hero-tab-dot"></span>EDS Reports
      </div>
      <div class="hero-win-controls">
        <span class="hero-win-btn">&#x2013;</span>
        <span class="hero-win-btn">&#x25A1;</span>
        <span class="hero-win-btn hero-win-close">&#x2715;</span>
      </div>
    </div>
    <div class="hero-url-bar">
      <span class="hero-url-text">main--eds--sriramkmoorthy2001.aem.live/reports</span>
    </div>
    <div class="hero-mockup-body">
      <div class="hero-page-meta">
        <div class="hero-ph lg"></div>
        <div class="hero-ph md"></div>
      </div>
      <div class="hero-toolbar">
        <div class="hero-search">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Search reports…
        </div>
        <button class="hero-chip on" data-tag="" type="button">All</button>
        <button class="hero-chip" data-tag="Annual" type="button">Annual</button>
        <button class="hero-chip" data-tag="Monthly" type="button">Monthly</button>
        <button class="hero-chip" data-tag="Quarterly" type="button">Quarterly</button>
      </div>
      <div class="hero-cards">
        <div class="hero-card" data-tag="Annual">
          <div class="hero-card-img" style="background:#eef2f6"><span class="hero-card-badge">Annual</span></div>
          <div class="hero-card-body"><div class="hero-ph"></div><div class="hero-ph short"></div></div>
        </div>
        <div class="hero-card" data-tag="Monthly">
          <div class="hero-card-img" style="background:#f0f0f5"><span class="hero-card-badge">Monthly</span></div>
          <div class="hero-card-body"><div class="hero-ph"></div><div class="hero-ph short"></div></div>
        </div>
        <div class="hero-card" data-tag="Quarterly">
          <div class="hero-card-img" style="background:#f0f4f0"><span class="hero-card-badge">Quarterly</span></div>
          <div class="hero-card-body"><div class="hero-ph"></div><div class="hero-ph short"></div></div>
        </div>
      </div>
    </div>`;
  return win;
}

export default function decorate(block) {
  const rows = [...block.children];
  const headingSource = rows[0]?.querySelector('h1,h2,h3,h4');
  const descSource = rows[1]?.querySelector('p');
  const linkEls = [...(rows[2]?.querySelectorAll('a[href]') || [])];

  block.textContent = '';

  const textCol = document.createElement('div');
  textCol.className = 'hero-text';

  if (headingSource) {
    const h = document.createElement('h1');
    h.className = 'hero-heading';
    h.innerHTML = headingSource.innerHTML;
    textCol.append(h);
  }

  if (descSource) {
    const p = document.createElement('p');
    p.className = 'hero-desc';
    p.textContent = descSource.textContent;
    textCol.append(p);
  }

  if (linkEls.length) {
    const row = document.createElement('div');
    row.className = 'hero-btns';
    linkEls.forEach((a, i) => {
      const btn = document.createElement('a');
      btn.href = a.href;
      btn.textContent = a.textContent;
      btn.className = `hero-btn ${i === 0 ? 'hero-btn-primary' : 'hero-btn-outline'}`;
      row.append(btn);
    });
    textCol.append(row);
  }

  const mockup = buildMockup();

  const inner = document.createElement('div');
  inner.className = 'hero-inner';
  inner.append(textCol, mockup);
  block.append(inner);

  mockup.querySelectorAll('.hero-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const { tag } = chip.dataset;
      mockup.querySelectorAll('.hero-chip').forEach((c) => c.classList.toggle('on', c === chip));
      mockup.querySelectorAll('.hero-card').forEach((card) => {
        card.style.display = !tag || card.dataset.tag === tag ? '' : 'none';
      });
    });
  });
}
