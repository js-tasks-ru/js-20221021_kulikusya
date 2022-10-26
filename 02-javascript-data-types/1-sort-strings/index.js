/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
    const directions = new Map([['asc', 1], ['desc', -1]]);
    if (!directions.has(param)) {
        throw new Error(`Unknown parameter 'param': '${param}' !`);
    }

    return [...arr].sort((s1, s2) => {
        return directions.get(param) * s1.localeCompare(s2, ['ru', 'en'], {caseFirst: 'upper'})
    });
}