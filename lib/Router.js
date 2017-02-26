import State from './State';
import RoutingAction from './RoutingAction';
import RouteChange from './RouteChange';
import RouteChangeType from './RouteChangeType';

const Router = {

    state: State,

    add({ path, onEnter: enter, onLeave: exit, isPersistent: persistent }){
        if (!Array.isArray(path)) {
            path = [path];
        }

        path.forEach((item) => {
            let action = {
                path : item,
                enter : enter,
                exit : exit,
                persistent : persistent,

                __proto__: RoutingAction
            };

            this.state.actions.push(action);
        });
    },

    addRoutable(path, { onRouteEnter, onRouteLeave, isRoutedPeristently }) {
        this.add({
            path: path,
            onEnter: onRouteEnter,
            onLeave: onRouteLeave,
            isPersistent: isRoutedPeristently,
        });
    },

    remove(id) {
        this.state.actions.splice(id, 1);
    },

    down(newElement) {
        window.location.hash += `/${newElement}`;
    },

    up() {
        let hash = window.location.hash.split('/');
        hash.shift();
        hash.pop();
        window.location.hash = '#!/' + hash.join('/');
    },

    swichTo(path) {
        window.location.hash = '#!' + path;
    },

    trigger() {
        let e = new Event('hashchange');
        window.dispatchEvent(e);
    },

    restore() {
        let route = window.localStorage.getItem('af.router.backup');
        let fullRoute = '#!' + route;

        if(route && window.location.hash === '')
            window.location.hash = fullRoute;
        else
			this.trigger();
    },

    routeChanged() {
        let currentPath = this.getCurrentPath();

        this.validateRoutePath(currentPath);

        // remove first item, we don't need it
        currentPath.shift();

        let { added, lost } = this.diffPaths(currentPath);

        //trigger lost events first
        lost.forEach((item) => {
            item.trigger(lost.length);
        });

        // check for overrides
        let path = '/' + currentPath.join('/');

        if(this.state.overrides[path]){
            window.location.hash = '#!' + this.state.overrides[path].join('/');
            return;
        }

        // we didn't have any overrides so we are good to carry on
        added.forEach((item) => {
            item.trigger(added.length);
        });

        // store the new path
        this.state.path = currentPath;
        this.backupPath(currentPath);

        // trigger google analytics
        this.triggerGoogleAnalytics();
    },

    /**
     *
     * @return {string[]} - array of all parts of the current route
     */
    getCurrentPath() {
        return (window.location.hash === '') ? ('#!/').split('/') : window.location.hash.split('/');
    },

    validateRoutePath(path) {
        if (path[0] != '#!'){
            throw `error in your hash path! ${path}`;
        }
    },

    findLostStates(currentPath, lost) {
        let difference = false;
        let path = '';

        this.state.path.forEach((item, i) => {
            path += '/' + this.state.path[i];

            if (this.state.path[i] === currentPath[i]) {
                return;
            } else {
                difference = true;
            }

            if (difference) {
                lost.push(Object.create(RouteChange).constructor(RouteChangeType.LOST, path, this.state));
            }
        });

        lost.reverse();
    },

    findAddedStates(currentPath, added) {
        let path = '';
        let difference = false;

        currentPath.forEach((item, index) => {
            path+= `/${item}`;

            if(item === this.state.path[index]) {
                return;
            } else {
                difference = true;
            }

            if (difference) {
                added.push(Object.create(RouteChange).constructor(RouteChangeType.ADD, path, this.state));
            }
        });
    },

    diffPaths(currentPath) {
        // compare old and new paths
        let lost = [];
        let added = [];

        this.findLostStates(currentPath, lost);
        this.findAddedStates(currentPath, added);

        return { lost: lost, added: added };
    },

    backupPath(currentPath) {
        window.localStorage.setItem('af.hash.backup', `/${currentPath.join('/')}`);
    },

    triggerGoogleAnalytics() {
        // Google Analytics Support (only analytics.js)
        if(window.ga){
            let location = `${window.location.protocol}//${window.location.hostname}${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.ga('send', 'pageview', location);
        }
    },

    init(actionList = []) {
        window.addEventListener('hashchange', this.routeChanged.bind(this));

        actionList.forEach(this.add.bind(this));
    }
};

export default Router;
