#!/usr/bin/env babel-node
/* eslint-disable no-console, no-process-exit */
import program from 'commander';

import {
  formatPR
} from './utils';

import {
  getReadyPRs,
} from './github';

program
  .option('--owner <owner>', 'project github owner')
  .option('--project <project>', 'project name')
  .parse(process.argv);

if (!program.owner || !program.project) {
  console.error('Github project name and owner required');
  program.outputHelp();
  process.exit(1);
}

console.log('>>> Checking for pull requests that are ready');

const { owner, project } = program;

getReadyPRs(owner, project)
  .then((readyPrs) => {
    const length = readyPrs.length;
    console.log(`>>> Found ${length} pull request${length !== 1 ? 's' : ''}:`);
    console.log();

    readyPrs.forEach((pr) => {
      console.log(formatPR(pr));
    });
    console.log();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
