function observeRise(root) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  root.querySelectorAll('.rise').forEach((el) => io.observe(el));
}

export default function decorate(block) {
  const rows = [...block.children];

  /* Expected structure:
   * Row 0: col-A heading | col-B heading
   * Row 1: col-A description | col-B description
   * Row 2+: col-A feature | col-B feature
   */
  const [headingRow, descRow, ...featureRows] = rows;
  const [headA, headB] = [...(headingRow?.children || [])].map((c) => c.textContent.trim());
  const [descA, descB] = [...(descRow?.children || [])].map((c) => c.textContent.trim());

  const featuresA = featureRows.map((r) => r.children[0]?.textContent.trim()).filter(Boolean);
  const featuresB = featureRows.map((r) => r.children[1]?.textContent.trim()).filter(Boolean);

  block.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'compare-wrap rise';
  wrap.innerHTML = `
    <div class="compare-col compare-col-std">
      <span class="compare-badge compare-badge-std">Standard AEM</span>
      <h3>${headA}</h3>
      <p>${descA}</p>
      <ul class="compare-list compare-list-std">
        ${featuresA.map((f) => `<li><span class="compare-icon"></span>${f}</li>`).join('')}
      </ul>
    </div>
    <div class="compare-col compare-col-plus">
      <span class="compare-badge compare-badge-plus">With Custom Blocks</span>
      <h3>${headB}</h3>
      <p>${descB}</p>
      <ul class="compare-list compare-list-plus">
        ${featuresB.map((f) => `<li><span class="compare-icon"></span>${f}</li>`).join('')}
      </ul>
    </div>`;

  block.append(wrap);
  observeRise(block);
}
