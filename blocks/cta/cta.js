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
  const heading = rows[0]?.querySelector('h1,h2,h3,h4')?.textContent.trim() || rows[0]?.textContent.trim();
  const desc = rows[1]?.textContent.trim();
  const linkEls = [...(rows[2]?.querySelectorAll('a[href]') || [])];

  block.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'cta-inner rise';

  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading;
    inner.append(h2);
  }

  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc;
    inner.append(p);
  }

  if (linkEls.length) {
    const btnRow = document.createElement('div');
    btnRow.className = 'cta-btns';
    linkEls.forEach((a, i) => {
      const btn = document.createElement('a');
      btn.href = a.href;
      btn.textContent = a.textContent;
      btn.className = `cta-btn ${i === 0 ? 'cta-btn-white' : 'cta-btn-outline'}`;
      btnRow.append(btn);
    });
    inner.append(btnRow);
  }

  block.append(inner);
  observeRise(block);
}
