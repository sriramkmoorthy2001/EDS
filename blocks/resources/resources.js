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

export default function decorate(block) {
  const rows = [...block.children];
  let cardStart = 0;
  let headingEl = null;
  let descEl = null;

  // A row with a single cell containing a heading = section heading
  if (rows[0]?.children.length === 1 && rows[0].querySelector('h1,h2,h3,h4,h5,h6')) {
    headingEl = rows[0].querySelector('h1,h2,h3,h4,h5,h6');
    cardStart = 1;
  }

  // Next single-cell row with only a paragraph = section description
  if (cardStart === 1 && rows[1]?.children.length === 1 && !rows[1].querySelector('h1,h2,h3,h4,h5,h6')) {
    descEl = rows[1].querySelector('p') || rows[1].children[0];
    cardStart = 2;
  }

  const cards = rows.slice(cardStart).map((row) => {
    const cells = [...row.children];
    const title = cells[0]?.querySelector('h1,h2,h3,h4,p,strong')?.textContent.trim()
      || cells[0]?.textContent.trim() || '';
    const desc = cells[1]?.textContent.trim() || '';
    const linkEl = cells[2]?.querySelector('a[href]') || row.querySelector('a[href]');
    return {
      title, desc, href: linkEl?.href || '#', linkText: linkEl?.textContent.trim() || 'Learn more',
    };
  }).filter((c) => c.title);

  block.textContent = '';

  if (headingEl || descEl) {
    const header = document.createElement('div');
    header.className = 'resources-heading rise';
    if (headingEl) header.append(headingEl);
    if (descEl) header.append(descEl);
    block.append(header);
  }

  const grid = document.createElement('div');
  grid.className = 'resources-grid';

  cards.forEach(({
    title, desc, href, linkText,
  }, i) => {
    const card = document.createElement('div');
    card.className = 'resources-card rise';
    card.style.transitionDelay = `${i * 80}ms`;
    card.innerHTML = `
      <div class="resources-card-body">
        <h3>${title}</h3>
        <p>${desc}</p>
        <a href="${href}" class="resources-link">${linkText} →</a>
      </div>`;
    grid.append(card);
  });

  block.append(grid);
  block.closest('.section')?.classList.add('resources-container');
  observeRise(block);
}
