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

  items.forEach(({ value, label }) => {
    const item = document.createElement('div');
    item.className = 'stats-item';
    item.innerHTML = `<div class="stats-value">${value}</div><div class="stats-label">${label}</div>`;
    grid.append(item);
  });

  block.append(grid);
}
