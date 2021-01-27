/* global Router, testContext */

(() => {
    window.location.hash = `#!${testContext.path}`;

    global.testResult = Router.routeChanged();
})();
