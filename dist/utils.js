/* eslint-disable no-console */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getGithubToken = getGithubToken;
exports.defer = defer;
exports.execCommand = execCommand;
exports.excecuteSerial = excecuteSerial;
exports.formatPR = formatPR;
exports.parseRemote = parseRemote;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _lie = require('lie');

var _lie2 = _interopRequireDefault(_lie);

function getGithubToken() {
  var token = process.env.GITHUB_TOKEN;
  console.log(process.env);

  if (!token) {
    throw new Error('Env variable GITHUB_TOKEN is not set');
  }
  return token;
}

function defer() {
  var deferred = {};
  var promise = new _lie2['default'](function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  deferred.promise = promise;
  return deferred;
}

function execCommand(command) {
  var dry = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  console.log('>>> ' + command);

  if (dry) {
    return _lie2['default'].resolve();
  }

  var deferred = defer();
  (0, _child_process.exec)(command, function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error) {
      deferred.reject(error);
      return;
    }
    deferred.resolve(stdout);
  });
  return deferred.promise;
}

function excecuteSerial(functions) {
  return functions.reduce(function (cur, next) {
    return cur.then(next);
  }, _lie2['default'].resolve());
}

function formatPR(pr) {
  return pr.html_url + ' - ' + pr.title;
}

function parseRemote(remote) {
  // git url: git@github.com:nodejs/node.git
  // http url: https://github.com/nodejs/node.git
  var matches = remote.match(/.*github\.com(\/|:)(\w+)\/(\w+)\.git/i);
  if (!matches) {
    throw new Error('Cannot extract information from: ' + remote);
  }
  return {
    owner: matches[2],
    project: matches[3]
  };
}