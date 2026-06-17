export default function decorate(block) {
  const rows = [...block.children];
  const headingEl = rows[0]?.querySelector('h1,h2,h3,h4,h5,h6');
  const descEl = rows[1]?.querySelector('p') || rows[0]?.querySelector('p');

  block.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'areaheading-inner';

  if (headingEl) {
    inner.append(headingEl);
  }

  if (descEl) {
    inner.append(descEl);
  }

  block.append(inner);
  block.closest('.section')?.classList.add('areaheading-container');
}
