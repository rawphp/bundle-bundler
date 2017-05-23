import Promise from 'bluebird';
import walk from 'walk';

/**
 * Creates a walker.
 *
 * @param {*[]} args list of args
 *
 * @returns {Object} walker instance
 */
export default function getWalker(...args) {
  const walker = walk.walk(...args);

  walker.end = () => new Promise((resolve, reject) => {
    walker.on('error', reject);
    walker.on('end', resolve);
  });

  return walker;
}
