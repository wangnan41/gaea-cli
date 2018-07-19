#!/usr/bin/env node
const program = require('commander');

const package = require('../package.json')

program.version(package.version,'-v,--version')
		.usage('<command> [项目名称]')
		.command('init','init project')
		.parse(process.argv)      