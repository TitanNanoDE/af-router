/* global Router, testContext */

(() => {
    Router.state.path = testContext.from.split('/').slice(1);

    global.testResult = Router.diffPaths(testContext.to.split('/').slice(1));
    global.RouteChangeType = _RouteChangeType.default;
})();
