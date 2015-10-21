/* eslint-disable no-console */
import commandLineArgs from 'command-line-args';

import {
  execCommand,
  excecuteSerial,
} from './utils';

const cli = commandLineArgs([
  { name: "branches", type: String, multiple: true, defaultOption: true },
]);

const options = cli.parse();

if (!options.branches) {
  throw new Error('No branches defined');
}

execCommand('git fetch --all').then(() => {
  // merge in branches
  const commands = options.branches.map((branch) => {
    return execCommand.bind(null, `git merge --no-ff origin/${branch}`);
  });

  return excecuteSerial(commands);
}).then(() => {
  console.log('finished');
}).catch((error) => {
  console.error(error);
  throw error;
});
