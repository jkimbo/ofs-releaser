#!/usr/bin/env node
/* eslint-disable no-console */
import program from 'commander';

program
  .version('0.0.1')
  .command('create [name]', 'create a new release')
  .command('check', 'check for pull requests that are ready to be released');

program.parse(process.argv);
