/* eslint-disable no-console, no-process-exit */
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _utils = require('./utils');

var _github = require('./github');

_commander2['default'].option('--owner <owner>', 'project github owner').option('--project <project>', 'project name').parse(process.argv);

if (!_commander2['default'].owner || !_commander2['default'].project) {
  console.error('Github project name and owner required');
  _commander2['default'].outputHelp();
  process.exit(1);
}

console.log('>>> Checking for pull requests that are ready');

var owner = _commander2['default'].owner;
var project = _commander2['default'].project;

(0, _github.getReadyPRs)(owner, project).then(function (readyPrs) {
  var length = readyPrs.length;
  console.log('>>> Found ' + length + ' pull request' + (length !== 1 ? 's' : '') + ':');
  console.log();

  readyPrs.forEach(function (pr) {
    console.log((0, _utils.formatPR)(pr));
  });
  console.log();
})['catch'](function (error) {
  console.error(error);
  process.exit(1);
});