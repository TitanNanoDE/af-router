/* global Router */

(() => {
    Router.backupPath(global.toBeBackedUp);
    Router.restore();
})();
