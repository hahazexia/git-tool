#!/usr/bin/env node

const { program } = require('commander');
const simpleGit = require('simple-git');
const inquirer = require('inquirer');

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
  const branches = await git.branch();

  // if (currentStatus.isClean()) { // 当前分支状态干净，可以继续后续流程
    if (branches.current === name) { // 当前已经是 name 分支
      console.log(`already on ${name}`);
      const filterBranches = branches.all.filter(i => !i.includes('remotes'));
      inquirer
        .prompt({
          name: 'willMergeBranches',
          type: 'checkbox',
          message: `choose which branches will merge into ${name}`,
          choices: filterBranches
        })
        .then(async (answers) => {
          const res = answers.willMergeBranches.filter(i => i !== 'master' && i !== `${name}`);
          if (res.length === 0) {
            console.log(`there is nothing will be merged in ${name}`);
            process.exit();
          } else {
            for (const b of res) {
              const mergeRes = await git.merge(b);
              console.log(mergeRes, b, 'mergeRes b');
              console.log('哈哈哈');
            }
          }
        })
        .catch((error) => {
          console.log(error, 'error');
          process.exit();
        });
    } else if (branches.all.includes(name)) { // 本地已存在 name 分支
      console.log(`there has ${name}`);
      await git.checkout([`${name}`]);

    } else { // 本地还没有 name 分支
      console.log(`there is no ${name}`);
      await git.checkout(`master`);
      await git.checkout(['-b', `${name}`]);

    }
  // } else { // 当前分支状态有未处理的文件，退出流程
  //   console.log(`working tree not clean, please make sure all your changes is commited`);
  //   process.exit();
  // }
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

