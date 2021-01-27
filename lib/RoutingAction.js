const RoutingAction = {
    /** @type {string} **/
    path : '',

    /** @type {Function} **/
    enter() {},

    /** @type {Function} **/
    exit() {},

    /** @type {Function} **/
    enterParent() {},

    /** @type {Function} **/
    exitParent() {},

    persistenceBoundary: 0,

    /** @type {boolean} **/
    active : false,
};

export default RoutingAction;
