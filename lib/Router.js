import State from './State';
import RoutingAction from './RoutingAction';
import RouteChange from './RouteChange';
import RouteChangeType from './RouteChangeType';

const Router = {

    state: State,

    add({ path, onEnter: enter, onLeave: exit, onEnterParent: enterParent, onExitParent: exitParent, isPersistent: persistent }) {
        if (!Array.isArray(path)) {
            path = [path];
        }

        path.forEach((item) => {
            let persistenceBoundary = 0;

            if (item.split('//').length > 2) {
                throw new Error(`route path "${item}" contains more than one persistance boundary, but there can be only one!`);
            }

            if (item.search('//') > -1) {
                const [preBoundary, postBoundary] = item.split('//');

                if (persistent) {
                    console.warn(`path "${item}" is using a persistence boundary and the deprecated isPersistent property. Consider removing the property!`);
                }

                persistenceBoundary = postBoundary.split('/').length;
                item = `${preBoundary}/${postBoundary}`;
            }

            if (persistent && persistenceBoundary === 0) {
                console.warn('the isPersistent and isRoutedPeristently properties are deprecated and can cause unexpected behavior. Considere using the persistence boundary path syntax.');
                persistenceBoundary = 1;
            }

            let action = {
                path : item,
                enter : enter,
                exit : exit,
                persistenceBoundary,

                __proto__: RoutingAction
            };

            if (enterParent) {
                action.enterParent = enterParent;
            }

            if (exitParent) {
                action.exitParent = exitParent;
            }

            this.state.actions.push(action);
        });
    },

    addRoutable(path, routable) {
        this.add({
            path: path,
            onEnter: routable.onRouteEnter.bind(routable),
            onLeave: routable.onRouteLeave.bind(routable),
            isPersistent: routable.isRoutedPeristently,
        });
    },

    remove(id) {
        this.state.actions.splice(id, 1);
    },

    down(...newElement) {
        const currentPath = window.location.hash.replace(/\/$/, '');

        window.location.hash = `${currentPath}/${newElement.join('/')}`;
    },

    up(count=1) {
        let hash = window.location.hash
            .split('/')
            .slice(1, -count);

        window.location.hash = '#!/' + hash.join('/');
    },

    switchTo(path) {
        window.location.hash = '#!' + path;
    },

    replaceWith(path) {
        window.location.replace('#!' + path);
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
        const path = (window.location.hash === '') ? ('#!/').split('/') : window.location.hash.split('/');

        if (path.length === 2 && path[1] === '') {
            path[1] = 'root';
        }

        return path;
    },

    validateRoutePath(path) {
        if (path[0] != '#!'){
            throw `error in your hash path! ${path}`;
        }
    },

    findLostStates(currentPath, lost) {
        let path = '';
        let diverged = false;

        this.state.path.forEach((item, i) => {
            path += '/' + this.state.path[i];

            if (!diverged && this.state.path[i] === currentPath[i]) {
                return;
            }

            diverged = true;
            lost.push(Object.create(RouteChange).constructor(RouteChangeType.LOST, path, this.state));
        });

        if (lost.length > 0) {
            lost[lost.length - 1].isLeaf = true;
            lost.reverse();
        }
    },

    findAddedStates(currentPath, added) {
        let path = '';
        let diverged = false;

        currentPath.forEach((item, index) => {
            path+= `/${item}`;

            if(!diverged && item === this.state.path[index]) {
                return;
            }

            diverged = true;
            added.push(Object.create(RouteChange).constructor(RouteChangeType.ADD, path, this.state));
        });

        if (added.length > 0) {
            added[added.length - 1].isLeaf = true;
        }
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
        if (currentPath[0] === 'root') {
            currentPath = [''];
        }

        window.localStorage.setItem('af.router.backup', `/${currentPath.join('/')}`);
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
