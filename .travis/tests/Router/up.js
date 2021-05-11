/* global Router, testContext */

(() => {
    global.window.location.hash = testContext.hash;

    Router.up(testContext.steps);
})();
