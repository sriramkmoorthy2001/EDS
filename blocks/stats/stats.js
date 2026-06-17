function observeRise(root) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  root.querySelectorAll('.rise').forEach((el) => io.observe(el));
}

export default function decorate(block) {
  const items = [...block.children].map((row) => {
    const cells = [...row.children];
    return {
      value: cells[0]?.textContent.trim() || '',
      label: cells[1]?.textContent.trim() || '',
    };
  });

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  items.forEach(({ value, label }, i) => {
    const item = document.createElement('div');
    item.className = 'stats-item rise';
    item.style.transitionDelay = `${i * 80}ms`;
    item.innerHTML = `<div class="stats-value">${value}</div><div class="stats-label">${label}</div>`;
    grid.append(item);
  });

  block.append(grid);
  observeRise(block);
}
