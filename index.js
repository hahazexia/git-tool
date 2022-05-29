#!/usr/bin/env node

const { program } = require('commander');
const simpleGit = require('simple-git');

const testAction = async () => {
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });

  const currentStatus = await git.status();
  if (currentStatus.isClean()) {
    
  } else {
    console.log(`working tree not clean, please make sure all your changes is commited`);
    process.exit();
  }
};

// 查看版本号
program.version(require('./package.json').version);

program.on('--help', () => {
    console.log('this is all help')
});

program.command('test')
  .description('base on master to make a new test branch, then merge current branch into this new test branch')
  .action(testAction);

// 解析终端输入的参数
program.parse(process.argv);

