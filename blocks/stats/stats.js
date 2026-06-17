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
}
