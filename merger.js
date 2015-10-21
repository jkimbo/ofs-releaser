/* eslint-disable no-console */
import { exec } from 'child_process';
import commandLineArgs from 'command-line-args';
import Promise from 'lie';

function defer() {
  const deferred = {};
  const promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  deferred.promise = promise;
  return deferred;
}

function execCommand(command) {
  console.log(`>>> ${command}`);
  const deferred = defer();
  exec(command, (error, stdout, stderr) => {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error) {
      deferred.reject(error);
      return;
    }
    deferred.resolve();
  });
  return deferred.promise;
}

function excecuteSerial(functions) {
  return functions.reduce((cur, next) => {
    return cur.then(next);
  }, Promise.resolve());
}

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
