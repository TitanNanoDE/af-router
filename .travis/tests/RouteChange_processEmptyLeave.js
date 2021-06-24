/* global testContext */

(() => {
    const { items, path } = testContext;

    global.testResult = processEmptyLeaveActions(items, path);
})();
