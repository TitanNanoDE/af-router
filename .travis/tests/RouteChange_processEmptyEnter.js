/* global testContext */

(() => {
    const { items, path } = testContext;

    global.testResult = processEmptyEnterActions(items, path);
})();
