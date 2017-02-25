/* global global routeItemWasEntered */

(() => {
    const regExp = /\/home\/page\/items/;
    const path = '/home/page/items';

    const item = {
        path: path,
        enter: () => {},
        persistent: true,
        active: true,
    };

    global.result = routeItemWasEntered(regExp, path, item);
})();
