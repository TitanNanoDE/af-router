/* global Router */

(() => {
    try {
        Router.validateRoutePath('/stuff happens here!');
    } catch (e) {
        console.error(e);
    }
})();
