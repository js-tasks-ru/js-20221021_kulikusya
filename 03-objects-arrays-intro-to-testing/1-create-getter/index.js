/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {

    return function(obj) {

        const pathArr = path.split('.');
                
        let tmpResult = obj;
        for (const pathStep of pathArr) {
            if (!Object.hasOwn(tmpResult, pathStep)) {
                return;
            }
            tmpResult = tmpResult[pathStep];
        }
        return tmpResult;
    }

}
