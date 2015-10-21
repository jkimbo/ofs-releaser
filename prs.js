/* eslint-disable no-console */
import commandLineArgs from 'command-line-args';
import GitHubApi from "github";

import {
  defer,
} from './utils';

import {
  GITHUB_TOKEN,
  GITHUB_USER,
  GITHUB_REPO,
} from './config';

const github = new GitHubApi({
  // required
  version: "3.0.0",
});
github.authenticate({
  type: "oauth",
  token: GITHUB_TOKEN,
});

function getPRNumber(url) {
  const regex = /https:\/\/github.com\/(.*)\/(.*)\/pull\/(\d+)/i;
  if (!regex.test(url)) {
    throw new Error(`Unrecognised url: ${url}`);
  }
  const matches = url.match(regex);
  if (matches.length !== 4) {
    throw new Error(`Unrecognised url: ${url}`);
  }
  return matches[3];
}

function getPR(number) {
  const deferred = defer();

  github.pullRequests.get({
    user: GITHUB_USER,
    repo: GITHUB_REPO,
    number,
  }, (error, data) => {
    if (error) {
      deferred.reject(error);
      return false;
    }
    deferred.resolve(data);
  });
  return deferred.promise;
}

const cli = commandLineArgs([
  { name: "prs", type: String, multiple: true, defaultOption: true },
]);

const options = cli.parse();

if (!options.prs) {
  throw new Error('No pull requests defined');
}

const prNumbers = options.prs.map(getPRNumber);

Promise.all(prNumbers.map(getPR)).then((prs) => {
  // check that all prs are mergeable
  prs.forEach((pr) => {
    if (pr.mergeable !== true) {
      throw new Error(`PR is not mergeable: ${pr.html_url}`);
    }
  });

  // create release notes
  const prNotes = prs.map((pr) => {
    return `* ${pr.html_url} - ${pr.title}`;
  }).join("\n");
  console.log("Release notes:\n");
  console.log(prNotes);

  console.log("\n");
  console.log("Branches:\n");

  const branches = prs.map((pr) => {
    return pr.head.ref;
  }).join(" ");
  console.log(branches);
}).catch((error) => {
  throw error;
});

// get all pr information
