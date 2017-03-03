/* global global transfromPathToRegExp */

(() => {
    const testPath = '*/modal';

    global.currentResult = transfromPathToRegExp(testPath);
})();
