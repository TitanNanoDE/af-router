/* eslint-env mocha */
const VM = require('application-frame/node/vm');
const callsite = require('callsite');
const Path = require('path');
const { expect } = require('chai');
const RouteChangeType = require('../testable/lib/RouteChangeType').default;

describe('RouteChange', () => {
    const validTestRegExp = /^\/test\/([^\/#?]+)\/page\/([^\/#?]+)\/dialog\/([^\/#?]+)$/;

    const vm = Object.create(VM).constructor({
        require(path) {
            let cwd = callsite()[1].getFileName();
            cwd = Path.dirname(cwd);
            path = Path.resolve(cwd, path);

            return require(path);
        },
        exports: {},
        global: {},
    });

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

        it('should not enter if the path matches, is persistent and active', () => {
            result = vm.runModule('./tests/RouteChange_routeItemWasEntered_3');

            expect(result.global.result).to.not.be.ok;
        });
    });

    describe('::routeItemWasLost', () => {
        it('should be lost if the path matches', () => {
            result = vm.runModule('./tests/RouteChange_routeItemWasLost_1');

            expect(result.global.result).to.be.ok;
        });
    });

    const executedActions = [false, false, false];

    const state = { actions : [{
        path: '/home/rooms/place/1',
        persistent: false,
        active: false,
        enter() { executedActions[0] = 'enter_0'; },
        leave() { executedActions[0] = 'leave_0'; }
    }, {
        path: '/home/rooms/place/1/info',
        persistent: true,
        active: false,
        enter() { executedActions[1] = 'enter_1'; },
        leave() { executedActions[1] = 'leave_1'; },
    }, {
        path: '/work/about',
        persistent: true,
        active: true,
        enter() { executedActions[2] = 'enter_2'; },
        leave() { executedActions[2] = 'leave_2'; },
    }], overrides : {}, };

    describe('constructor', () => {
        const type = RouteChangeType.ADD;
        const path = '/home/rooms/place/1';

        vm._context.global.params = { type: type, path : path, state: state };

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

            vm.runModule('./tests/routeChange_trigger_1.js');

            expect(executedActions).to.be.eql(['enter_0', false, false]);
        });

        it('should enter the persistent state, but not if it already active', () => {
            const path = '/home/rooms/place/1/info';

            vm._context.global.routeChange.path = path;
            executedActions[0] = executedActions[1] = executedActions[2] = false;

            vm.runModule('./tests/RouteChange_trigger_1.js');

            expect(executedActions).to.be.eql([false, 'enter_1', false]);
        });

        it('should not enter a persistent and already active state', () => {
            const path = '/home/rooms/place/1/info';
            executedActions[0] = executedActions[1] = executedActions[2] = false;

            vm._context.global.routeChange.path = path;
            vm.runModule('./tests/routeChange_trigger_1.js');

            expect(executedActions).to.be.eql([false, false, false]);
        });
    });
});
