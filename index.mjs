#!/usr/bin/env node

import { program } from 'commander';
import testAction from './actions/testAction.mjs';
import checkAction from './actions/checkAction.mjs';
import deleteAction from './actions/deleteAction.mjs';
import revertAction from './actions/revertAction.mjs';
import updSubmodAction from './actions/updSubmodAction.mjs';
import { promises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsonString = await promises.readFile(path.join(__dirname, './package.json'), 'utf8');
const packageJson = JSON.parse(jsonString);

// 查看版本号
program.version(packageJson.version);

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

program.command('revert')
  .description('pick a master branch history commit to revert')
  .action(revertAction);

program.command('upd-sub')
  .description('update submodule')
  .action(updSubmodAction)

// 解析终端输入的参数
program.parse(process.argv);

