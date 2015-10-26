#!/usr/bin/env node

/* eslint-disable no-console */
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

_commander2['default'].version('0.0.1').command('create [name]', 'create a new release').command('check', 'check for pull requests that are ready to be released');

_commander2['default'].parse(process.argv);