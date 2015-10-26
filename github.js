import GitHubApi from "github";

import {
  defer,
} from './utils';

import {
  GITHUB_TOKEN,
} from './config';

const github = new GitHubApi({
  // required
  version: "3.0.0",
  //debug: true,
});
github.authenticate({
  type: "oauth",
  token: GITHUB_TOKEN,
});

export default github;

function cbToPromise(promise) {
  return (error, data) => {
    if (error) {
      promise.reject(error);
      return false;
    }
    promise.resolve(data);
  };
}

export function getPullRequests(user, project) {
  const deferred = defer();

  github.pullRequests.getAll({
    'user': user,
    'repo': project,
    'state': 'open',
    'sort': 'created',
    'direction': 'asc',
  }, cbToPromise(deferred));

  return deferred.promise;
}

export function getIssueLabels(user, project, issue) {
  const deferred = defer();

  github.issues.getIssueLabels({
    'user': user,
    'repo': project,
    'number': issue,
  }, cbToPromise(deferred));

  return deferred.promise;
}

export function getReadyPRs(user, project, readyLabel = 'ready') {
  return getPullRequests(user, project)
    .then((prs) => {
      const deferred = defer();

      // get PR labels
      Promise.all(prs.map(({ number }) => getIssueLabels(user, project, number)))
        .then((labels) => {
          // zip up pull requests
          if (labels.length !== prs.length) {
            throw Error(`Length of labels doesn't match length of prs`);
          }

          const _prs = prs.reduce((memo, pr, index) => {
            pr.labels = labels[index];
            memo.push(pr);
            return memo;
          }, []);
          deferred.resolve(_prs);
        }).catch((error) => deferred.reject(error));

      return deferred.promise;
    })
    .then((pulls) => {
      // get prs with label 'ready'
      const readyPrs = pulls.reduce((memo, pr) => {
        if (pr.labels.findIndex((label) => label.name === readyLabel) > -1) {
          memo.push(pr);
        }
        return memo;
      }, []);
      return Promise.resolve(readyPrs);
    });
}
