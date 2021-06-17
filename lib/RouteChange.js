import RouteChangeType from './RouteChangeType';

const transfromPathToRegExp = function(path) {
    const wildcard = '.*';
    const wildcardMatcher = /^\*/;
    const paramWildcard = '([^/#?]+)';
    const paramMatcher = /\{[\w\-_]+\}/;
    let itemPath = (path === '/') ? '/root' : path;
    const stateParams = {};
    let param = null;

    itemPath = itemPath.replace(wildcardMatcher, wildcard);

    while ((param = itemPath.match(paramMatcher))) {
        param = param[0];
        stateParams[param.substring(1, param.length - 1)] = null;

        itemPath = itemPath.replace(param, paramWildcard);
    }

    itemPath = '^' + itemPath.replace(/\//g, '/').replace(/\$/, '$').replace(/\^/, '^') + '$';

    return { regExp: new RegExp(itemPath), paramsCollector: stateParams };
};

const populateStateParamValues = function(regExp, path, params) {
    const values = regExp.exec(path);

    values.shift();

    Object.keys(params).forEach((key, index) => {
        params[key] = values[index];
    });

    return params;
};

const routeItemWasEntered = function(regExp, path, item) {
    return regExp.test(path) && !!item.enter;
};

const routeItemWasLost = function(regExp, path, item) {
    return regExp.test(path) && !!item.exit;
};

const isPersistent = function(routingAction) {
    return routingAction.persistenceBoundary > 0;
};

const getRedirectFromBoundary = function(path, boundary) {
    const parsedPath = path.split('/');
    const origin = parsedPath.slice(0, -boundary);
    const target = parsedPath;

    return [origin, target];
};

const processEnterActions = function(items, path, count, state, isLeaf) {
    let hasMatches = false;

    items.forEach((item) => {
        const { regExp, paramsCollector } = transfromPathToRegExp(item.path);

        if (!routeItemWasEntered(regExp, path, item)) {
            return;
        }

        const params = populateStateParamValues(regExp, path, paramsCollector);

        if (isPersistent(item) && item.active) {
            item.enterParent(path, params);
            return;
        }

        item.enter(path, params);
        hasMatches = true;

        if (isPersistent(item)) {
            item.active = true;
        }
    });

    if (!hasMatches && isLeaf) {
        processEmptyEnterActions(items, path, count);
    }
};

const processEmptyEnterActions = function(items, path) {
    items.forEach(item => {
        const { regExp } = transfromPathToRegExp(item.path);

        if (!routeItemWasEntered(regExp, '::not-found', item)) {
            return;
        }

        item.enter(path, {});
    });
};

const processLeaveActions = function(items, path, count, state, isLeaf) {
    let hasMatches = false;

    items.forEach((item) => {
        const { regExp, paramsCollector } = transfromPathToRegExp(item.path);

        if (!routeItemWasLost(regExp, path, item)) {
            return;
        }

        const params = populateStateParamValues(regExp, path, paramsCollector);

        if (isPersistent(item) && count > item.persistenceBoundary) {
            const [origin, target] = getRedirectFromBoundary(path, item.persistenceBoundary);

            state.overrides[origin.join('/')] = target;
            item.exitParent(target, params);

            return;
        }

        if (isPersistent(item)) {
            const [origin] = getRedirectFromBoundary(path, item.persistenceBoundary);

            delete state.overrides[origin.join('/')];
            item.active = false;
        }

        item.exit(path, params);
        hasMatches = true;
    });

    if (!hasMatches && isLeaf) {
        processEmptyLeaveActions(items, path);
    }
};

const processEmptyLeaveActions = function(items, path) {
    items.forEach(item => {
        const { regExp } = transfromPathToRegExp(item.path);

        if (!routeItemWasLost(regExp, '::not-found', item)) {
            return;
        }

        item.exit(path, {});
    });
};

const processingMap = new Map([
    [RouteChangeType.ADD, processEnterActions],
    [RouteChangeType.LOST, processLeaveActions]
]);

const RouteChange = {

    type: null,
    path: '',
    state: null,
    isLeaf: false,

    constructor(type, path, state, isLeaf = false) {
        this.type = type;
        this.path = path;
        this.state = state;
        this.isLeaf = isLeaf;

        return this;
    },

    trigger(count) {
        const path = this.path;
        const typeKey = Object.keys(RouteChangeType).find(typeKey => RouteChangeType[typeKey] === this.type);
        const type = RouteChangeType[typeKey];

        if (type) {
            processingMap.get(type)(this.state.actions, path, count, this.state, this.isLeaf);

        } else {
            console.error('[AF-Router]', 'unknown RouteChangeType!', this.type);
        }
    }
};

export default RouteChange;
