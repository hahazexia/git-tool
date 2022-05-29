#!/usr/bin/env node

const { program } = require('commander');
const simpleGit = require('simple-git');

const testAction = async (name) => {
  // 检查用户输入的 test 分支名是否合法
  if (!name || !/^test\/[a-zA-Z0-9\-]+/g.test(name)) {
    console.log(`your test branch name is invalid, please use correct test branch name`);
    process.exit();
  }
  // 初始化 git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });

  // git status 查看当前分支状态
  const currentStatus = await git.status();

  console.log(currentStatus, 'currentStatus')
  if (currentStatus.isClean()) { // 当前分支状态干净，可以继续后续流程
    console.log(currentStatus, 'currentStatus');
    if (currentStatus.current === 'master') { // 当前是 master 分支，直接新建 test 分支
      const checkoutRes = await git.checkout(['-b', `${name}`]);
      console.log(checkoutRes, 'master checkoutRes');
    } else { // 当前不是 master 分支，切换到 master 分支后再新建 test 分支
      const checkoutRes = await git.checkout(`master`);
      console.log(checkoutRes, 'master checkoutRes 2');
    }
  } else { // 当前分支状态有未处理的文件，退出流程
    console.log(`working tree not clean, please make sure all your changes is commited`);
    process.exit();
  }
};

// 查看版本号
program.version(require('./package.json').version);

program.on('--help', () => {
    console.log('this is all help')
});

program.command('test <name>')
  .description('base on master to make a new test branch, then merge current branch into this new test branch')
  .action(testAction);

// 解析终端输入的参数
program.parse(process.argv);

