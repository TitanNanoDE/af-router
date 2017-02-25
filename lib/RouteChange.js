import RouteChangeType from './RouteChangeType';

const transfromPathToRegExp = function(path) {
    const paramWildCard = '([^\/#?]+)';
    const paramMatcher = /\{[\w\-\_]+\}/;
    let itemPath = path;
    const stateParams = {};

    let param = null;

    while ((param = itemPath.match(paramMatcher))) {
        param = param[0];
        stateParams[param.substring(1, param.length - 1)] = null;

        itemPath = itemPath.replace(param, paramWildCard);
    }

    itemPath = '^' + itemPath.replace(/\//g, '\/').replace(/\$/, '\$').replace(/\^/, '\^') + '$';

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
    return regExp.test(path) && item.enter && (!item.persistent || !item.active);
};

const routeItemWasLost = function(regExp, path, item) {
    return regExp.test(path) && item.exit;
};

const processEnterActions = function(items, path) {
    items.forEach((item) => {
        const { regExp, paramsCollector } = transfromPathToRegExp(item.path);

        if (routeItemWasEntered(regExp, path, item)) {
            const params = populateStateParamValues(regExp, path, paramsCollector);

            item.enter(path, params);

            if (item.persistent) {
                item.active = true;
            }
        }
    });
};

const processLeaveActions = function(items, path, count) {
    items.forEach((item) => {
        const { regExp, paramsCollector } = transfromPathToRegExp(item.path);

        if (routeItemWasLost(regExp, path, item)) {

            if (!item.persistent || count === 1) {
                const params = populateStateParamValues(regExp, path, paramsCollector);

                item.exit(path, params);

                if (item.persistent) {
                    path = path.split('/');
                    path.pop();
                    delete this.state.overrides[path.join('/')];
                    item.active = false;
                }

            } else {
                path = path.split('/');
                path.pop();
                this.state.overrides[path.join('/')] = path;
            }
        }
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

    constructor(type, path, state){
        this.type = type;
        this.path = path;
        this.state = state;

        return this;
    },

    trigger(count) {
        let path= this.path;

        let type = Object.values(RouteChangeType).find(type => type === this.type);

        if (type) {
            processingMap.get(type)(this.state.actions, path, count);

        } else {
            console.error('[AF-Router]', 'unknown RouteChangeType!', this.type);
        }
    }
};

export default RouteChange;
