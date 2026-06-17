import { createOptimizedPicture } from '../../scripts/aem.js';

const PAGE_SIZE = 8;

function getLines(bodyCell) {
  const lines = [];
  let buffer = [];
  const flush = () => {
    const wrapper = document.createElement('div');
    buffer.forEach((node) => wrapper.append(node.cloneNode(true)));
    if (wrapper.textContent.trim() || wrapper.querySelector('a')) lines.push(wrapper);
    buffer = [];
  };
  const isBlock = (node) => node.nodeType === Node.ELEMENT_NODE
    && /^(P|H1|H2|H3|H4|H5|H6|DIV)$/.test(node.nodeName);
  const walk = (node) => {
    if (node.nodeName === 'BR') {
      flush();
    } else if (isBlock(node)) {
      flush();
      [...node.childNodes].forEach(walk);
      flush();
    } else {
      buffer.push(node);
    }
  };
  [...bodyCell.childNodes].forEach(walk);
  flush();
  return lines;
}

function parseReportRow(row) {
  const [imageCell, bodyCell] = row.children;
  const picture = imageCell?.querySelector('picture') || null;

  const lines = getLines(bodyCell);
  const [titleLine, ...rest] = lines;
  const title = titleLine?.textContent.trim() || '';

  let date = '';
  let tag = '';
  let link = '';
  let linkText = '';
  const descriptionParts = [];

  rest.forEach((line) => {
    const linkEl = line.querySelector('a[href]');
    const text = line.textContent.trim();
    if (linkEl) {
      link = linkEl.href;
      linkText = linkEl.textContent.trim() || 'View report';
    } else if (/^date:/i.test(text)) {
      date = text.replace(/^date:\s*/i, '');
    } else if (/^tag:/i.test(text)) {
      tag = text.replace(/^tag:\s*/i, '');
    } else if (text) {
      descriptionParts.push(text);
    }
  });

  return {
    title,
    description: descriptionParts.join(' '),
    date,
    tag: tag || 'Uncategorized',
    link,
    linkText: linkText || 'View report',
    picture,
  };
}

function renderCard(report) {
  const li = document.createElement('li');
  li.className = 'reports-card';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'reports-card-image';
  if (report.picture) imageWrapper.append(report.picture);
  li.append(imageWrapper);

  const body = document.createElement('div');
  body.className = 'reports-card-body';

  const tagEl = document.createElement('span');
  tagEl.className = 'reports-card-tag';
  tagEl.textContent = report.tag;
  body.append(tagEl);

  const titleEl = document.createElement('h3');
  titleEl.textContent = report.title;
  body.append(titleEl);

  if (report.description) {
    const description = document.createElement('p');
    description.className = 'reports-card-description';
    description.textContent = report.description;
    body.append(description);
  }

  const meta = document.createElement('div');
  meta.className = 'reports-card-meta';
  if (report.date) {
    const dateEl = document.createElement('span');
    dateEl.className = 'reports-card-date';
    dateEl.textContent = report.date;
    meta.append(dateEl);
  }
  if (report.link) {
    const linkEl = document.createElement('a');
    linkEl.className = 'reports-card-link';
    linkEl.href = report.link;
    linkEl.textContent = report.linkText;
    meta.append(linkEl);
  }
  body.append(meta);

  li.append(body);
  return li;
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const core = new Set([1, total]);
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i += 1) {
    core.add(i);
  }
  const sorted = [...core].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, idx) => {
    result.push(p);
    if (idx < sorted.length - 1 && sorted[idx + 1] - p > 1) result.push('…');
  });
  return result;
}

export default function decorate(block) {
  const reports = [...block.children].map(parseReportRow);

  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '375' }]),
    );
  });

  block.textContent = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'reports-toolbar';

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'reports-search';
  const searchLabel = document.createElement('label');
  searchLabel.htmlFor = 'reports-search-input';
  searchLabel.textContent = 'Search reports';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.id = 'reports-search-input';
  searchInput.placeholder = 'Search reports by title or description…';
  searchWrapper.append(searchLabel, searchInput);

  const tags = [...new Set(reports.map((r) => r.tag))];
  const filterWrapper = document.createElement('div');
  filterWrapper.className = 'reports-filters';
  filterWrapper.setAttribute('role', 'group');
  filterWrapper.setAttribute('aria-label', 'Filter reports by tag');

  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'reports-filter-chip is-active';
  allButton.textContent = 'All';
  allButton.dataset.tag = '';
  filterWrapper.append(allButton);

  const chips = [allButton];
  tags.forEach((t) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'reports-filter-chip';
    chip.textContent = t;
    chip.dataset.tag = t;
    filterWrapper.append(chip);
    chips.push(chip);
  });

  toolbar.append(searchWrapper, filterWrapper);

  const grid = document.createElement('ul');
  grid.className = 'reports-grid';

  const emptyState = document.createElement('p');
  emptyState.className = 'reports-empty';
  emptyState.textContent = 'No reports match your search.';
  emptyState.hidden = true;

  const pagination = document.createElement('nav');
  pagination.className = 'reports-pagination';
  pagination.setAttribute('aria-label', 'Report pages');
  pagination.hidden = true;

  const cards = reports.map((report) => ({ report, card: renderCard(report) }));
  let activeTag = '';
  let currentPage = 1;

  const renderPagination = (current, total, onNavigate) => {
    pagination.innerHTML = '';
    if (total <= 1) { pagination.hidden = true; return; }
    pagination.hidden = false;

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'reports-page-btn';
    prev.setAttribute('aria-label', 'Previous page');
    prev.textContent = '‹';
    prev.disabled = current === 1;
    prev.addEventListener('click', () => onNavigate(current - 1));
    pagination.append(prev);

    getPageNumbers(current, total).forEach((page) => {
      if (page === '…') {
        const span = document.createElement('span');
        span.className = 'reports-page-ellipsis';
        span.textContent = page;
        pagination.append(span);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `reports-page-btn${page === current ? ' is-active' : ''}`;
        if (page === current) btn.setAttribute('aria-current', 'page');
        btn.textContent = page;
        btn.addEventListener('click', () => onNavigate(page));
        pagination.append(btn);
      }
    });

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'reports-page-btn';
    next.setAttribute('aria-label', 'Next page');
    next.textContent = '›';
    next.disabled = current === total;
    next.addEventListener('click', () => onNavigate(current + 1));
    pagination.append(next);
  };

  const applyFilters = (resetPage = false) => {
    if (resetPage) currentPage = 1;
    const query = searchInput.value.trim().toLowerCase();
    const filtered = cards.filter(({ report }) => {
      const matchesQuery = !query
        || report.title.toLowerCase().includes(query)
        || report.description.toLowerCase().includes(query);
      const matchesTag = !activeTag || report.tag === activeTag;
      return matchesQuery && matchesTag;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageCards = filtered.slice(start, start + PAGE_SIZE);

    grid.innerHTML = '';
    pageCards.forEach(({ card }) => grid.append(card));

    emptyState.hidden = filtered.length > 0;
    renderPagination(currentPage, totalPages, (page) => {
      currentPage = page;
      applyFilters();
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  searchInput.addEventListener('input', () => applyFilters(true));
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeTag = chip.dataset.tag;
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
      applyFilters(true);
    });
  });

  applyFilters();
  block.append(toolbar, grid, emptyState, pagination);
}
