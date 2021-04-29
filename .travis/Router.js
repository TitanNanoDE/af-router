/* eslint-env mocha */

const { expect, use } = require('chai');
const istanbulVM = require('./istanbulVM');
const chaiSubset = require('chai-subset');

use(chaiSubset);

describe('Router', () => {
    const triggerTracker = [false, false, false];
    let triggerTracker3 = false;
    const trackParentEnter = [false, false];

    const vm = istanbulVM({
        testActions: [{
            path: '/home/pages/p1',
            onEnter() { triggerTracker[0] = 'enter_0'; },
            onLeave() { triggerTracker[0] = 'leave_0'; },
            isPersistent: false,
        }, {
            path: '/home/pages/p1/info',
            onEnter() { triggerTracker[1] = 'enter_1'; },
            onLeave() { triggerTracker[1] = 'leave_1'; },
            onEnterParent() { trackParentEnter[1] = 'enter_1'; },
            onExitParent() { trackParentEnter[1] = 'exit_1'; },
            isPersistent: true,
        }, {
            path: ['/', '/home'],
            onEnter() { triggerTracker[2] = 'enter_2'; },
            onLeave() { triggerTracker[2] = 'leave_2'; },
            isPersistent: false,
        }, {
            path: '/home/pages/p1/info//edit/{id}/view',
            onEnter() { triggerTracker3 = 'enter_3'; },
            onLeave() { triggerTracker3 = 'leave_3'; },
        }],

        Event: function() {},

        window: {
            location: {
                host: 'www.localhost.local',
                protocol: 'https:',
                pathname: '/',
                hash: '#!/start',
                history: [],
                replace(url) {
                    if (url.startsWith('#')) {
                        this.hash = url;
                    }

                    throw new Error('replace is not fully implemented!');
                }
            },
            localStorage: {
                store: {},
                setItem(key, value) {
                    this.store[key] = value;
                },

                getItem(key) {
                    return this.store[key];
                }
            },

            eventDispatched: false,

            dispatchEvent() { this.eventDispatched = true; },

            addEventListener(name, fn) {
                this[name] = fn;
            }
        }
    });

    describe('init', () => {
        it('should init all submitted states', () => {
            vm.runModule('../testable/lib/Router');
            const result = vm.runModule('./tests/Router/init');

            expect(result.Router.state.actions).to.have.lengthOf(5);
            expect(result.window.hashchange).to.be.a('function');
        });
    });

    describe('add', () => {
        it('should create a new state action', () => {
            const routeParams = { path: '/test/124', onEnter() {}, onLeave() {}, };

            vm.updateContext({ testResult: null, testContext: { routeParams } });

            const { testContext } = vm.runModule('./tests/Router/add');
            const lastAction = testContext.RouterState.actions[testContext.RouterState.actions.length - 1];

            expect(lastAction.path).to.equal(routeParams.path);
            expect(lastAction.enter).to.equal(routeParams.onEnter);
            expect(lastAction.exit).to.equal(routeParams.onLeave);
            expect(lastAction.persistenceBoundary).to.equal(0);
        });

        it('should throw if there are too many boundaries', () => {
            const routeParams = { path: '/test//124/ab//next', onEnter() {}, onLeave() {}, };

            vm.updateContext({ testResult: null, testContext: { routeParams } });

            const { testResult } = vm.runModule('./tests/Router/add');

            expect(testResult).to.be.an('error');
        });

        it('should create a new state action with a persistence boundary', () => {
            const routeParams = { path: '/test/124//hot/stuff', onEnter() {}, onLeave() {}, };

            vm.updateContext({ testResult: null, testContext: { routeParams } });

            const { testContext } = vm.runModule('./tests/Router/add');
            const lastAction = testContext.RouterState.actions[testContext.RouterState.actions.length - 1];

            expect(lastAction.path).to.equal('/test/124/hot/stuff');
            expect(lastAction.enter).to.equal(routeParams.onEnter);
            expect(lastAction.exit).to.equal(routeParams.onLeave);
            expect(lastAction.persistenceBoundary).to.equal(2);
        });

        it('should emit a warning when using both persistence boundary and property', () => {
            const routeParams = { path: '/test/warn//persistent/sub', isPersistent: true, onEnter() {}, onLeave() {}, };

            vm.updateContext({ testResult: null, testContext: { routeParams } });

            const { testContext, testResult, console: { stats: consoleStats } } = vm.runModule('./tests/Router/add');
            const lastAction = testContext.RouterState.actions[testContext.RouterState.actions.length - 1];

            expect(lastAction.path).to.equal('/test/warn/persistent/sub');
            expect(lastAction.enter).to.equal(routeParams.onEnter);
            expect(lastAction.exit).to.equal(routeParams.onLeave);
            expect(lastAction.persistenceBoundary).to.equal(2);
            expect(consoleStats.warn).to.equal(2, 'warning count is off');
        });
    });

    describe('addRoutable', () => {
        it('should add a new Routable object', () => {
            const result = vm.runModule('./tests/Router/addRoutable');

            expect(result.Router.state.actions[result.Router.state.actions.length - 1].path)
                .to.be.equal('/home/routable/page/1');
        });
    });

    describe('down', () => {
        it('should append a new segment to the path', () => {
            expect(vm._context.window.location.hash).to.be.equal('#!/start');

            const result = vm.runModule('./tests/Router/down');

            expect(result.window.location.hash).to.be.equal('#!/start/second');
        });
    });

    describe('replaceWith', () => {
        it('should replace the current history entry with a new one', () => {
            expect(vm._context.window.location.hash).to.be.equal('#!/start/second');

            const result = vm.runModule('./tests/Router/replaceWith');

            expect(result.window.location.hash).to.be.equal('#!/start/third');
        });
    });

    describe('remove', () => {
        it('should remove the action at the given id', () => {
            const before = vm._context.Router.state.actions.length;
            const result = vm.runModule('./tests/Router/remove');

            expect(result.Router.state.actions).to.have.lengthOf(before - 1);
        });
    });

    describe('routeChanged', () => {
        it('should enter the first and third state', () => {
            vm.runModule('./tests/Router/routeChanged_1');

            expect(triggerTracker).to.be.eql(['enter_0', false, 'enter_2']);
        });

        it('should leave the first state when navigating up', () => {
            triggerTracker[0] = triggerTracker[1] = triggerTracker[2] = false;

            vm.runModule('./tests/Router/routeChanged_2');

            expect(triggerTracker).to.be.eql(['leave_0', false, false]);
        });

        it('should not leave persistent states', () => {
            vm.runModule('./tests/Router/routeChanged_3');

            triggerTracker[0] = triggerTracker[1] = triggerTracker[2] = false;

            vm.runModule('./tests/Router/routeChanged_2');

            expect(triggerTracker).to.be.eql(['leave_0', false, false]);
        });

        it('should redirect when trying to navigate into an overwritten state', () => {
            triggerTracker[0] = triggerTracker[1] = triggerTracker[2] = false;

            expect(vm._context.window.location.hash).to.be.equal('#!/home');

            vm.runModule('./tests/Router/routeChanged_1');
            const result = vm.runModule('./tests/Router/routeChanged_4');

            expect(triggerTracker).to.be.eql(['enter_0', false, false]);
            expect(result.window.location.hash).to.be.equal('#!/home/pages/p1/info');
        });

        it('should leave a persistent state if we actively navigate out of it', () => {
            triggerTracker[0] = triggerTracker[1] = triggerTracker[2] = false;

            vm.runModule('./tests/Router/routeChanged_1');

            expect(triggerTracker).to.be.eql([false, 'leave_1', false]);
        });

        it('should not leave a persistent state with a boundary greater than 1', () => {
            vm.updateContext({ testResult: null, testContext: { path: '/home/pages/p1/info/edit/2/view' } });
            vm.runModule('./tests/Router/routeChanged');

            triggerTracker3 = false;

            vm.updateContext({ testResult: null, testContext: { path: '/home/pages' } });
            vm.runModule('./tests/Router/routeChanged');

            expect(triggerTracker3).to.be.eql(triggerTracker3);
        });

        it('should redirect when trying to navigate into an overwritten state from a boundary greater than 1', () => {
            expect(vm.getContext().window.location.hash).to.be.equal('#!/home/pages');

            triggerTracker[0] = triggerTracker[1] = triggerTracker[2] = triggerTracker3 = false;

            vm.updateContext({ testResult: null, testContext: { path: '/home/pages/p1/info' } });
            const result = vm.runModule('./tests/Router/routeChanged');

            expect(triggerTracker).to.be.eql([false, false, false]);
            expect(triggerTracker3).to.be.false;
            expect(result.window.location.hash).to.be.equal('#!/home/pages/p1/info/edit/2/view');
        });

        it('should backup "/" if the internal path is "/root"', () => {
            expect(vm.getContext().window.location.hash).to.be.equal('#!/home/pages/p1/info/edit/2/view');

            triggerTracker[0] = triggerTracker[1] = triggerTracker[2] = triggerTracker3 = false;

            vm.updateContext({ testResult: null, testContext: { path: '/' } });
            const result = vm.runModule('./tests/Router/routeChanged');

            expect(result.window.localStorage.store['af.router.backup']).to.be.equal('/');
        });

        it('should notify if parent was left without leaving child', () => {
            triggerTracker[1] = false;
            trackParentEnter[1] = false;

            vm.updateContext({ testResult: null, testContext: { path: '/home/pages/p1/info/edit/124/view' } });
            vm.runModule('./tests/Router/routeChanged');

            expect(vm.getContext().window.location.hash).to.be.equal('#!/home/pages/p1/info/edit/124/view');

            vm.updateContext({ testResult: null, testContext: { path: '/home' } });

            const result = vm.runModule('./tests/Router/routeChanged');

            expect(result.window.location.hash).to.be.equal('#!/home');
            expect(triggerTracker[1]).to.be.false;
            expect(trackParentEnter[1]).to.be.equal('exit_1');
        });

        it('should notify if child was entered via parent', () => {
            triggerTracker[1] = false;
            trackParentEnter[1] = false;

            vm.updateContext({ testResult: null, testContext: { path: '/home' } });
            vm.runModule('./tests/Router/routeChanged');

            expect(vm.getContext().window.location.hash).to.be.equal('#!/home');

            vm.updateContext({ testResult: null, testContext: { path: '/home/pages/p1/info/edit/124/view' } });

            const result = vm.runModule('./tests/Router/routeChanged');

            expect(result.window.location.hash).to.be.equal('#!/home/pages/p1/info/edit/124/view');
            expect(triggerTracker[1]).to.be.false;
            expect(trackParentEnter[1]).to.be.equal('enter_1');
        });
    });

    describe('up', () => {
        it('should dop the lowest element in the path', () => {
            vm._context.window.location.hash = '#!/home/pages/p2';

            const result = vm.runModule('./tests/Router/up');

            expect(result.window.location.hash).to.be.equal('#!/home/pages');
        });
    });

    describe('validateRoutePath', () => {
        it('should throw if the hash path is invalid', () => {
            const result = vm.runModule('./tests/Router/validateRoutePath');

            expect(result.console.stats.error).to.be.equal(1);
        });
    });

    describe('switchTo', () => {
        it('should switch to the given path', () => {
            const result = vm.runModule('./tests/Router/switchTo');

            expect(result.window.location.hash).to.be.equal('#!/test/path');
        });
    });

    describe('restore', () => {
        it('should restore the last path if no path is currently set', () => {
            vm._context.window.location.hash = '';
            vm._context.toBeBackedUp = ['backed', 'path', 'in', 'storage'];

            const result = vm.runModule('./tests/Router/restore');

            expect(result.window.location.hash).to.be.equal('#!/backed/path/in/storage');
        });

        it('should not restore from backup if there is already a path set', () => {
            vm._context.window.location.hash = '#!/test/path/a1';

            const result = vm.runModule('./tests/Router/restore');

            expect(result.window.eventDispatched).to.be.true;
        });

        it('should just simply trigger if there is no backup', () => {
            vm._context.window.location.hash = '';
            vm._context.window.localStorage.store = {};
            vm._context.window.eventDispatched = false;

            let result = vm.runModule('./tests/Router/restore_no_backup');

            expect(result.window.location.hash).to.be.empty;
            expect(result.window.eventDispatched).to.be.true;

            result = vm.runModule('./tests/Router/getCurrentPath');

            expect(result.currentPath).to.be.eql(['#!', 'root']);
        });
    });

    describe('triggerGoogleAnalytics', () => {
        it('should trigger google analytics if available', () => {
            vm._context.window.location = {
                protocol: 'https:',
                host: 'example.org',
                pathname: '/test/',
                search: '?test=1',
                hash: '#test'
            };

            vm._context.window.ga = function() { vm._context.window.ga.triggered = true; };

            const result = vm.runModule('./tests/Router/triggerGoogleAnalytics');

            expect(result.window.ga.triggered).to.be.true;
        });
    });

    describe('diffPaths', () => {
        it('should leave similarly named children of unrelated parents', () => {
            vm.updateContext({ testResult: null, testContext: {
                from: '/home/pages/p1/info/edit/124/view',
                to: '/home/pages/p1/info/edit/53422/view'
            } });

            const { testResult, RouteChangeType } = vm.runModule('./tests/Router/diffPaths');

            expect(testResult).to.have.property('lost')
                .which.is.an('array')
                .and.has.lengthOf(2)
                .and.to.containSubset([
                    {
                        type: RouteChangeType.LOST,
                        path: '/home/pages/p1/info/edit/124/view',
                    }, {
                        type: RouteChangeType.LOST,
                        path: '/home/pages/p1/info/edit/124'
                    }
                ]);

            expect(testResult).to.have.property('added')
                .which.is.an('array')
                .and.has.lengthOf(2)
                .and.to.containSubset([
                    {
                        type: RouteChangeType.ADD,
                        path: '/home/pages/p1/info/edit/53422',
                    }, {
                        type: RouteChangeType.ADD,
                        path: '/home/pages/p1/info/edit/53422/view'
                    }
                ]);
        });
    })
});
