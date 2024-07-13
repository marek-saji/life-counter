/**
 * Literal string tag that does nothing.
 *
 * Only here to get nice syntax highlighting, autocompletion and stuff
 * for strings with HTML in them.
 *
 * @param {Array<string>} partsA
 * @param {Array<string | number>} ...partsB
 */
export default (partsA, ...partsB) => partsA
    .flatMap((a, idx) => [a, partsB[idx]])
    .join('');
