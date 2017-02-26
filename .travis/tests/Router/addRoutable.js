/* global Router */

(() => {
    const routable = {
        onRouteEnter() { },
        onRouteLeave() { },
        isRoutedPeristently: false,
    };

    Router.addRoutable('/home/routable/page/1', routable);
})();
