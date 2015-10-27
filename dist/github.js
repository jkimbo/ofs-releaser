'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getPullRequests = getPullRequests;
exports.getPullRequest = getPullRequest;
exports.getIssueLabels = getIssueLabels;
exports.getReadyPRs = getReadyPRs;
exports.createPullRequest = createPullRequest;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _github = require("github");

var _github2 = _interopRequireDefault(_github);

var _lie = require('lie');

var _lie2 = _interopRequireDefault(_lie);

var _utils = require('./utils');

var GITHUB_TOKEN = (0, _utils.getGithubToken)();

var github = new _github2['default']({
  // required
  version: "3.0.0"
});
//debug: true,
github.authenticate({
  type: "oauth",
  token: GITHUB_TOKEN
});

exports['default'] = github;

function cbToPromise(promise) {
  return function (error, data) {
    if (error) {
      promise.reject(error);
      return false;
    }
    promise.resolve(data);
  };
}

function getPullRequests(user, project) {
  var deferred = (0, _utils.defer)();

  github.pullRequests.getAll({
    'user': user,
    'repo': project,
    'state': 'open',
    'sort': 'created',
    'direction': 'asc'
  }, cbToPromise(deferred));

  return deferred.promise;
}

function getPullRequest(user, project, number) {
  var deferred = (0, _utils.defer)();

  github.pullRequests.get({
    user: user,
    repo: project,
    number: number
  }, cbToPromise(deferred));
  return deferred.promise;
}

function getIssueLabels(user, project, issue) {
  var deferred = (0, _utils.defer)();

  github.issues.getIssueLabels({
    'user': user,
    'repo': project,
    'number': issue
  }, cbToPromise(deferred));

  return deferred.promise;
}

function getReadyPRs(user, project) {
  var readyLabel = arguments.length <= 2 || arguments[2] === undefined ? 'ready' : arguments[2];

  return getPullRequests(user, project).then(function (prs) {
    var deferred = (0, _utils.defer)();

    // get PR labels
    _lie2['default'].all(prs.map(function (_ref) {
      var number = _ref.number;
      return getIssueLabels(user, project, number);
    })).then(function (labels) {
      // zip up pull requests
      if (labels.length !== prs.length) {
        throw Error('Length of labels doesn\'t match length of prs');
      }

      var _prs = prs.reduce(function (memo, pr, index) {
        pr.labels = labels[index];
        memo.push(pr);
        return memo;
      }, []);
      deferred.resolve(_prs);
    })['catch'](function (error) {
      return deferred.reject(error);
    });

    return deferred.promise;
  }).then(function (pulls) {
    // get prs with label 'ready'
    var readyPrs = pulls.reduce(function (memo, pr) {
      if (pr.labels.findIndex(function (label) {
        return label.name === readyLabel;
      }) > -1) {
        memo.push(pr);
      }
      return memo;
    }, []);
    return _lie2['default'].resolve(readyPrs);
  });
}

function createPullRequest(user, project, options) {
  var dry = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

  var deferred = (0, _utils.defer)();

  if (dry) {
    return _lie2['default'].resolve({
      'html_url': '<GITHUB_PULL_REQUEST_URL>'
    });
  }

  github.pullRequests.create(Object.assign({
    'user': user,
    'repo': project
  }, options), cbToPromise(deferred));

  return deferred.promise;
}