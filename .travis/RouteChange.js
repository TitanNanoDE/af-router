/* eslint-env mocha */
const { expect } = require('chai');
const istanbulVM = require('./istanbulVM');
const RouteChangeType = require('../testable/lib/RouteChangeType').default;

describe('RouteChange', () => {
    const validTestRegExp = /^\/test\/([^/#?]+)\/page\/([^/#?]+)\/dialog\/([^/#?]+)$/;
    const vm = istanbulVM();
    let result = null;

    describe('::transfromPathToRegExp', () => {

        it('should return an object', () => {
            vm.runModule('../testable/lib/RouteChange');
            result = vm.runModule('./tests/RouteChange_transformPathToRegExp');

            expect(result.global.result).to.have.property('regExp');
            expect(result.global.result).to.have.property('paramsCollector');
        });

        it('should return the right regEx', () => {
            expect(result.global.result.regExp.source)
                .to.be.equal(validTestRegExp.source);
        });

        it('should collect all params', () => {
            expect(Object.keys(result.global.result.paramsCollector)).to.have.lengthOf(3, 3);
        });

        it('should correctly transform a modal path', () => {
            result = vm.runModule('./tests/RouteChange/transformPathToRegExp_2');

            expect(result.currentResult.regExp.source).to.be.equal(/^.*\/modal$/.source);
        });
    });

    describe('::populateStateParamValues', () => {
        it('should populate the route params', () => {
            result = vm.runModule('./tests/RouteChange_populateStateParamValues_1');

            expect(result.global.result).to.have.property('param1', '108978234');
            expect(result.global.result).to.have.property('param2', 'id-24397876');
            expect(result.global.result).to.have.property('param3', 'BigWhiteThing');
        });

        it('should work fine if there are no params to collect', () => {
            result = vm.runModule('./tests/RouteChange_populateStateParamValues_2');

            expect(result.global.result).to.be.empty;
        });
    });

    describe('::routeItemWasEntered', () => {
        it('should not enter if the path doesn\'t match!', () => {
            result = vm.runModule('./tests/RouteChange_routeItemWasEntered_1');

            expect(result.global.result).to.not.be.ok;
        });

        it('should enter if the path matches', () => {
            result = vm.runModule('./tests/RouteChange_routeItemWasEntered_2');

            expect(result.global.result).to.be.ok;
        });

        it('should correctly match a modal state', () => {
            result = vm.runModule('./tests/RouteChange/routeItemWasEntered_4');

            expect(result.currentResult).to.be.eql([true, true, true]);
        });
    });

    describe('::routeItemWasLost', () => {
        it('should be lost if the path matches', () => {
            result = vm.runModule('./tests/RouteChange_routeItemWasLost_1');

            expect(result.global.result).to.be.ok;
        });
    });

    describe('::processEmptyEnterActions', () => {
        it('should trigger an entry for ::not-found', () => {
            let entries = [];

            const items = [{
                path: '/app/listing/details',
                persistenceBoundary: 0,
                active: false,
                enter() { entries.push('Details'); },
                exit() {},
                enterParent() {},
                exitParent() {},
            }, {
                path: '/app/listing/{id}',
                persistenceBoundary: 0,
                active: false,
                enter() { entries.push('listing'); },
                exit() {},
                enterParent() {},
                exitParent() {},
            }, {
                path: '::not-found',
                persistenceBoundary: 0,
                active: false,
                enter() { entries.push('not-found'); },
                exit() {},
                enterParent() {},
                exitParent() {},
            }];

            vm.updateContext({ testContext: { items, path: '/random/test/path' } });
            vm.runModule('./tests/RouteChange_processEmptyEnter');

            expect(entries).to.be.deep.equal(['not-found']);
        });
    });

    describe('::processEmptyLeaveActions', () => {
        it('should trigger an exit for ::not-found', () => {
            let exits = [];

            const items = [{
                path: '/app/listing/details',
                persistenceBoundary: 0,
                active: false,
                enter() {},
                exit() { exits.push('Details'); },
                enterParent() {},
                exitParent() {},
            }, {
                path: '/app/listing/{id}',
                persistenceBoundary: 0,
                active: false,
                enter() {},
                exit() { exits.push('listing'); },
                enterParent() {},
                exitParent() {},
            }, {
                path: '::not-found',
                persistenceBoundary: 0,
                active: false,
                enter() {},
                exit() { exits.push('not-found'); },
                enterParent() {},
                exitParent() {},
            }];

            vm.updateContext({ testContext: { items, path: '/random/test/path' } });
            vm.runModule('./tests/RouteChange_processEmptyLeave');

            expect(exits).to.be.deep.equal(['not-found']);
        });
    });

    const executedActions = [false, false, false, false];

    const state = { actions : [{
        path: '/home/rooms/place/1',
        persistenceBoundary: 0,
        active: false,
        enter() { executedActions[0] = 'enter_0'; },
        exit() { executedActions[0] = 'leave_0'; },
        enterParent() {},
        exitParent() {},
    }, {
        path: '/home/rooms/place/1/info',
        persistenceBoundary: 1,
        active: false,
        enter() { executedActions[1] = 'enter_1'; },
        exit() { executedActions[1] = 'leave_1'; },
        enterParent() {},
        exitParent() {},
    }, {
        path: '/work/about',
        persistenceBoundary: 1,
        active: true,
        enter() { executedActions[2] = 'enter_2'; },
        exit() { executedActions[2] = 'leave_2'; },
        enterParent() {},
        exitParent() {},
    }, {
        path: '::not-found',
        persistenceBoundary: 0,
        active: false,
        enter() { executedActions[3] = 'enter_not_found'; },
        exit() { executedActions[3] = 'leave_not_found'; },
        enterParent() {},
        exitParent() {},
    }], overrides : {}, };

    describe('constructor', () => {
        const type = RouteChangeType.ADD;
        const path = '/home/rooms/place/1';

        vm._context.global.params = { type: type, path : path, state: state, isLeaf: true };

        it('should construct a new RouteChange object', () => {
            result = vm.runModule('./tests/RouteChange_constructor');

            expect(result.global.routeChange).to.have.property('type', type);
            expect(result.global.routeChange).to.have.property('path', path);
            expect(result.global.routeChange).to.have.property('state', state);
        });
    });

    describe('trigger', () => {
        it('should enter the action that matches the current path', () => {
            executedActions[0] = executedActions[1] = executedActions[2] = false;

            vm.runModule('./tests/RouteChange_trigger_1');

            expect(executedActions).to.be.eql(['enter_0', false, false, false]);
        });

        it('should enter the persistent state, but not if it already active', () => {
            const path = '/home/rooms/place/1/info';

            vm._context.global.routeChange.path = path;
            executedActions[0] = executedActions[1] = executedActions[2] = false;

            vm.runModule('./tests/RouteChange_trigger_1');

            expect(executedActions).to.be.eql([false, 'enter_1', false, false]);
        });

        it('should not enter a persistent and already active state', () => {
            const path = '/home/rooms/place/1/info';
            executedActions[0] = executedActions[1] = executedActions[2] = false;

            vm._context.global.routeChange.path = path;
            vm.runModule('./tests/RouteChange_trigger_1');

            expect(executedActions).to.be.eql([false, false, false, false]);
        });

        it('should error if an invalid change type was set', () => {
            const path = '/home/rooms/place/1';
            executedActions[0] = executedActions[1] = executedActions[2] = false;

            vm._context.routeChange.type = 123;
            vm._context.routeChange.path = path;
            result = vm.runModule('./tests/RouteChange_trigger_1');

            expect(executedActions).to.be.eql([false, false, false, false]);
            expect(result.console.stats.error).to.be.equal(1);
        });

        it('should enter ::not-found if no matching item was found', () => {
            const path = '/categories/types';
            executedActions[0] = executedActions[1] = executedActions[2] = executedActions[3] = false;

            vm._context.routeChange.type = RouteChangeType.ADD;
            vm._context.routeChange.path = path;
            debugger;
            result = vm.runModule('./tests/RouteChange_trigger_1');

            expect(executedActions).to.be.eql([false, false, false, 'enter_not_found']);
        });

        it('should exit ::not-found when switching to a known item', () => {
            const path = '/categories/types';
            executedActions[0] = executedActions[1] = executedActions[2] = executedActions[3] = false;

            vm._context.routeChange.type = RouteChangeType.LOST;
            vm._context.routeChange.path = path;
            debugger;
            result = vm.runModule('./tests/RouteChange_trigger_1');

            expect(executedActions).to.be.eql([false, false, false, 'leave_not_found']);
        });
    });
});
