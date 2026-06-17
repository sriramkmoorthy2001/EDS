import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const cards = [...block.children].map((row) => {
    const [imageCell, textCell] = row.children;
    const picture = imageCell?.querySelector('picture') || null;
    const lines = [...(textCell?.querySelectorAll('h1,h2,h3,h4,p') || [])];
    const title = lines[0]?.textContent.trim() || '';
    const desc = lines.slice(1).map((el) => el.textContent.trim()).join(' ');
    return { picture, title, desc };
  }).filter((c) => c.title);

  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]),
    );
  });

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'capabilities-grid';

  cards.forEach(({ picture, title, desc }, i) => {
    const card = document.createElement('div');
    card.className = 'capabilities-card rise';
    card.style.transitionDelay = `${i * 70}ms`;

    const bg = document.createElement('div');
    bg.className = 'capabilities-card-bg';
    if (picture) {
      const img = picture.querySelector('img');
      if (img) bg.style.backgroundImage = `url('${img.src}')`;
    }
    card.append(bg);

    const content = document.createElement('div');
    content.className = 'capabilities-card-content';
    content.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    card.append(content);

    grid.append(card);
  });

  block.append(grid);
}
