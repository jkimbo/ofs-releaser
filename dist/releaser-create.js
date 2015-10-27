#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _lie = require('lie');

var _lie2 = _interopRequireDefault(_lie);

var _utils = require('./utils');

var _github = require('./github');

_commander2['default'].option('--name <name>', 'name of rc').option('--dry-run', 'Dry run').parse(process.argv);

if (!_commander2['default'].name) {
  console.error('Please specify a name for this release');
  _commander2['default'].outputHelp();
  process.exit(1);
}

var name = _commander2['default'].name;
var dryRun = _commander2['default'].dryRun;

var owner = undefined;
var project = undefined;
var releaseNotes = '';

// ensure we are in a github repo
(0, _utils.execCommand)('git rev-parse --git-dir > /dev/null 2>&1').then(function () {
  var deferred = (0, _utils.defer)();

  // try and get owner and project from git remote url
  (0, _utils.execCommand)('git config --get remote.origin.url').then(function (remote) {
    var details = (0, _utils.parseRemote)(remote);
    owner = details.owner;
    project = details.project;
    deferred.resolve();
  })['catch'](deferred.reject);

  return deferred.promise;
})
// fetch all branches
.then(_utils.execCommand.bind(null, 'git fetch --all', dryRun)).then(_utils.execCommand.bind(null, 'git checkout -b ' + name, dryRun)).then(function () {
  // get all pull requests that are ready
  return (0, _github.getReadyPRs)(owner, project);
})
// get actual pr object
.then(function (readyPrs) {
  return _lie2['default'].all(readyPrs.map(function (pr) {
    return (0, _github.getPullRequest)(owner, project, pr.number);
  }));
}).then(function (readyPrs) {
  // check that all prs are mergeable
  readyPrs.forEach(function (pr) {
    if (pr.mergeable !== true) {
      throw new Error('PR is not mergeable: ' + pr.html_url);
    }
  });

  var length = readyPrs.length;
  console.log('>>> Found ' + length + ' pull request' + (length !== 1 ? 's' : ''));

  releaseNotes = readyPrs.map(function (pr) {
    return '* ' + (0, _utils.formatPR)(pr);
  }).join("\n");
  return _lie2['default'].resolve(readyPrs);
})
// merge in pull requests
.then(function (readyPrs) {
  var branches = readyPrs.map(function (pr) {
    return pr.head.ref;
  });

  console.log('>>> Merging branches');

  var commands = branches.map(function (branch) {
    return _utils.execCommand.bind(null, 'git merge --no-ff origin/' + branch, dryRun);
  });

  return (0, _utils.excecuteSerial)(commands);
}).then(_utils.execCommand.bind(null, 'git push origin ' + name, dryRun))
// create pull request
.then(function () {
  console.log('>>> Creating pull request');

  return (0, _github.createPullRequest)(owner, project, {
    'title': name,
    'body': releaseNotes,
    'base': 'master',
    'head': name
  }, dryRun);
}).then(function (response) {
  console.log('>>> Pull request ' + response.number + ' created:');
  console.log(response['html_url']);
  console.log();

  console.log("Release notes:\n");
  console.log(releaseNotes);
  console.log();
})['catch'](function (error) {
  console.error(error);
  process.exit(1);
});