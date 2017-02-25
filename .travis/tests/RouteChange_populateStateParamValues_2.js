/* global global populateStateParamValues */

(() => {
    const regExp = /\/test\/house\/page\/1/;
    const path = '/test/house/page/1';

    global.result = populateStateParamValues(regExp, path, {});
})();
