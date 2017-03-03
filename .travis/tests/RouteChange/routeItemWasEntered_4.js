/* global global routeItemWasEntered */

(() => {
    const regExp = /^.*\/modal$/;
    const path = '/test/page/modal';
    const path2 = '/modal';
    const path3 = '/castle/12141/room/4324/window/12/modal';

    const item = {
        path: path,
        enter: () => {},
        persistent: false,
        active: false,
    };

    global.currentResult = [
        routeItemWasEntered(regExp, path, item),
        routeItemWasEntered(regExp, path2, item),
        routeItemWasEntered(regExp, path3, item)
    ];
})();
