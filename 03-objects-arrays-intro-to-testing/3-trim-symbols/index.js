/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {

    if (size === undefined) {
        return string.slice();
    }

    //this check is optional,
    //but it speeds up the function when the size is 0 - the string is not iterated
    if (size === 0) {
        return '';
    }

    let newString = '';
    let previousCharacter;
    let currentSize;
    for(const currentCharacter of string) {
        if (currentCharacter !== previousCharacter) {
            previousCharacter = currentCharacter;
            currentSize = 1;
        } else if (currentCharacter === previousCharacter) {
            currentSize++;
        }

        if (currentSize <= size) {
            newString += currentCharacter;
        }
    }

    return newString;
}
