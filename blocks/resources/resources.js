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
  const cards = [...block.children].map((row) => {
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
  observeRise(block);
}
