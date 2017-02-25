/* global global transfromPathToRegExp */

const testPath = '/test/{param1}/page/{param2}/dialog/{param3}';

global.result = transfromPathToRegExp(testPath);
