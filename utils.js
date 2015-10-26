/* eslint-disable no-console */
import { exec } from 'child_process';
import Promise from 'lie';

export function defer() {
  const deferred = {};
  const promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  deferred.promise = promise;
  return deferred;
}

export function execCommand(command) {
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

export function excecuteSerial(functions) {
  return functions.reduce((cur, next) => {
    return cur.then(next);
  }, Promise.resolve());
}

export function formatPR(pr) {
  return `${pr.html_url} - ${pr.title}`;
}
