import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the media-text block
 * @param {Element} block The block element
 *
 * Expected authored structure (one row, two cells):
 *   | media-text            |
 *   | (image) | heading + text + link |
 *
 * Add the `reverse` option to the block name (e.g. "media-text (reverse)")
 * to flip the layout: content on the left, image on the right.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  [...row.children].forEach((cell) => {
    if (cell.querySelector('picture')) {
      cell.classList.add('media-text-image');
    } else {
      cell.classList.add('media-text-content');
    }
  });

  // optimize images
  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });
}
