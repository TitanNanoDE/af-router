/* global Router, testContext */

(() => {
    try {
        global.testResult = Router.add(testContext.routeParams);

        testContext.RouterState = Router.state;
    } catch(e) {
        global.testResult = e;
    }
})();
