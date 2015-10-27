#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit */
import program from 'commander';
import Promise from 'lie';

import {
  execCommand,
  excecuteSerial,
  defer,
  parseRemote,
  formatPR,
} from './utils';

import {
  getReadyPRs,
  getPullRequest,
  createPullRequest,
} from './github';

program
  .option('--name <name>', 'name of rc')
  .option('--dry-run', 'Dry run')
  .parse(process.argv);

if (!program.name) {
  console.error('Please specify a name for this release');
  program.outputHelp();
  process.exit(1);
}

const { name, dryRun } = program;
let owner;
let project;
let releaseNotes = '';

// ensure we are in a github repo
execCommand('git rev-parse --git-dir > /dev/null 2>&1')
  .then(() => {
    const deferred = defer();

    // try and get owner and project from git remote url
    execCommand('git config --get remote.origin.url')
      .then((remote) => {
        const details = parseRemote(remote);
        owner = details.owner;
        project = details.project;
        deferred.resolve();
      })
      .catch(deferred.reject);

    return deferred.promise;
  })
  // fetch all branches
  .then(execCommand.bind(null, 'git fetch --all', dryRun))
  .then(execCommand.bind(null, `git checkout -b ${name}`, dryRun))
  .then(() => {
    // get all pull requests that are ready
    return getReadyPRs(owner, project);
  })
  // get actual pr object
  .then((readyPrs) => {
    return Promise.all(readyPrs.map((pr) => {
      return getPullRequest(owner, project, pr.number);
    }));
  })
  .then((readyPrs) => {
    // check that all prs are mergeable
    readyPrs.forEach((pr) => {
      if (pr.mergeable !== true) {
        throw new Error(`PR is not mergeable: ${pr.html_url}`);
      }
    });

    const length = readyPrs.length;
    console.log(`>>> Found ${length} pull request${length !== 1 ? 's' : ''}`);

    releaseNotes = readyPrs.map((pr) => {
      return `* ${formatPR(pr)}`;
    }).join("\n");
    return Promise.resolve(readyPrs);
  })
  // merge in pull requests
  .then((readyPrs) => {
    const branches = readyPrs.map((pr) => pr.head.ref);

    console.log('>>> Merging branches');

    const commands = branches.map((branch) => {
      return execCommand.bind(null, `git merge --no-ff origin/${branch}`, dryRun);
    });

    return excecuteSerial(commands);
  })
  .then(execCommand.bind(null, `git push origin ${name}`, dryRun))
  // create pull request
  .then(() => {
    console.log('>>> Creating pull request');

    return createPullRequest(owner, project, {
      'title': name,
      'body': releaseNotes,
      'base': 'master',
      'head': name,
    }, dryRun);
  })
  .then((response) => {
    console.log(`>>> Pull request ${response.number} created:`);
    console.log(response['html_url']);
    console.log();

    console.log("Release notes:\n");
    console.log(releaseNotes);
    console.log();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
