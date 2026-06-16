import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Splits a body cell into logical lines, regardless of whether the author's
 * editor produced separate <p>/<h*> elements or wrapped everything in one
 * element with <br> line breaks (descends into block elements so inner
 * <br>s still split correctly).
 * @param {Element} bodyCell The body cell element
 * @returns {Element[]} One wrapper element per line, in document order
 */
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

/**
 * Builds a report record from one authored row. The body cell's first line
 * is always the title; remaining lines are matched by a "Date:"/"Tag:"
 * prefix, a link, or otherwise treated as description text.
 * @param {Element} row The row element
 * @returns {{title: string, description: string, date: string, tag: string,
 *   link: string, linkText: string, picture: Element}}
 */
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

/**
 * Renders a single report card.
 * @param {object} report A report record from parseReportRow
 * @returns {Element} The card <li> element
 */
function renderCard(report) {
  const li = document.createElement('li');
  li.className = 'reports-card';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'reports-card-image';
  if (report.picture) imageWrapper.append(report.picture);
  li.append(imageWrapper);

  const body = document.createElement('div');
  body.className = 'reports-card-body';

  const tag = document.createElement('span');
  tag.className = 'reports-card-tag';
  tag.textContent = report.tag;
  body.append(tag);

  const title = document.createElement('h3');
  title.textContent = report.title;
  body.append(title);

  if (report.description) {
    const description = document.createElement('p');
    description.className = 'reports-card-description';
    description.textContent = report.description;
    body.append(description);
  }

  const meta = document.createElement('div');
  meta.className = 'reports-card-meta';
  if (report.date) {
    const date = document.createElement('span');
    date.className = 'reports-card-date';
    date.textContent = report.date;
    meta.append(date);
  }
  if (report.link) {
    const link = document.createElement('a');
    link.className = 'reports-card-link';
    link.href = report.link;
    link.textContent = report.linkText;
    meta.append(link);
  }
  body.append(meta);

  li.append(body);
  return li;
}

/**
 * loads and decorates the reports block
 * @param {Element} block The reports block element
 */
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
  tags.forEach((tag) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'reports-filter-chip';
    chip.textContent = tag;
    chip.dataset.tag = tag;
    filterWrapper.append(chip);
    chips.push(chip);
  });

  toolbar.append(searchWrapper, filterWrapper);

  const grid = document.createElement('ul');
  grid.className = 'reports-grid';

  const emptyState = document.createElement('p');
  emptyState.className = 'reports-empty';
  emptyState.textContent = 'No reports match your search.';

  const cards = reports.map((report) => ({ report, card: renderCard(report) }));

  let activeTag = '';

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;
    cards.forEach(({ report, card }) => {
      const matchesQuery = !query
        || report.title.toLowerCase().includes(query)
        || report.description.toLowerCase().includes(query);
      const matchesTag = !activeTag || report.tag === activeTag;
      const visible = matchesQuery && matchesTag;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    emptyState.hidden = visibleCount > 0;
  }

  searchInput.addEventListener('input', applyFilters);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeTag = chip.dataset.tag;
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
      applyFilters();
    });
  });

  cards.forEach(({ card }) => grid.append(card));
  applyFilters();

  block.append(toolbar, grid, emptyState);
}
