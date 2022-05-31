#!/usr/bin/env node

const { program } = require('commander');
const testAction = require('./actions/testAction');
const checkAction = require('./actions/checkAction');
const deleteAction = require('./actions/deleteAction');

// 查看版本号
program.version(require('./package.json').version);

program.on('--help', () => {
  console.log('this is all help')
});

program.command('test <name>')
  .description('base on master to make a new test branch, then pick some branches merge into this new test branch')
  .action(testAction);

program.command('delete')
  .description('pick some local branches to delete')
  .option('-D', 'force to delete')
  .action(deleteAction);

program.command('check')
  .description('pick some local branches to checkout')
  .action(checkAction);

// 解析终端输入的参数
program.parse(process.argv);

