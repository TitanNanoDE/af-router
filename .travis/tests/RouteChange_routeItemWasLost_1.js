/* global global routeItemWasLost */

(() => {
    const regExp = /\/home\/page\/items/;
    const path = '/home/page/items';

    const item = {
        path: path,
        enter() {},
        exit() {},
        persistent: false,
        active: false,
    };

    global.result = routeItemWasLost(regExp, path, item);
})();
