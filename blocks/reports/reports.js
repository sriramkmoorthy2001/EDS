import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Builds a report record from one authored row.
 * Expected body cell content, in order: heading, description paragraph,
 * a "Date:" paragraph, a "Tag:" paragraph, and a link. Date/tag are optional.
 * @param {Element} row The row element
 * @returns {{title: string, description: string, date: string, tag: string,
 *   link: string, linkText: string, picture: Element, element: Element}}
 */
function parseReportRow(row) {
  const [imageCell, bodyCell] = row.children;
  const picture = imageCell?.querySelector('picture') || null;

  const heading = bodyCell.querySelector('h1, h2, h3, h4, h5, h6');
  const title = heading?.textContent.trim() || '';

  const paragraphs = [...bodyCell.querySelectorAll('p')].filter((p) => !p.querySelector('a'));
  let date = '';
  let tag = '';
  const descriptionParts = [];
  paragraphs.forEach((p) => {
    const text = p.textContent.trim();
    if (/^date:/i.test(text)) date = text.replace(/^date:\s*/i, '');
    else if (/^tag:/i.test(text)) tag = text.replace(/^tag:\s*/i, '');
    else descriptionParts.push(text);
  });

  const linkEl = bodyCell.querySelector('a[href]');

  return {
    title,
    description: descriptionParts.join(' '),
    date,
    tag: tag || 'Uncategorized',
    link: linkEl?.href || '',
    linkText: linkEl?.textContent.trim() || 'View report',
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
