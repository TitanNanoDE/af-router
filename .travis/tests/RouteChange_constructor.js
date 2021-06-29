/* global global RouteChange */
(() => {
    global.routeChange = Object.create(RouteChange)
        .constructor(global.params.type, global.params.path, global.params.state, global.params.isLeaf);
})();
