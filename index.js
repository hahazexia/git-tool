#!/usr/bin/env node

const { program } = require('commander');
const simpleGit = require('simple-git');
const inquirer = require('inquirer');

const inquirerMerge = (name, git, branches) => {
  inquirer
    .prompt({
      name: 'willMergeBranches',
      type: 'checkbox',
      message: `choose which branches will merge into ${name}`,
      choices: branches
    })
    .then(async (answers) => {
      const res = answers.willMergeBranches.filter(i => i !== 'master' && i !== `${name}`);
      if (res.length === 0) {
        console.log(`there is nothing will be merged in ${name}`);
        process.exit();
      } else {
        for (const b of res) {
          const mergeRes = await git.merge([b]);
          if (mergeRes.result === 'success' && mergeRes.conflicts.length === 0) {
            console.log('merge is success and no conflicts');
          } else {
            console.log('something is wrong, please check manually');
            process.exit();
          }
        }
      }
    })
    .catch((error) => {
      console.log(error, 'error');
      process.exit();
    });
};

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

  if (currentStatus.isClean()) { // 当前分支状态干净，可以继续后续流程
    if (branches.current === name) { // 当前已经是 name 分支
      console.log(`already on ${name}`);
      const filterBranches = branches.all.filter(i => !i.includes('remotes'));
      inquirerMerge(name, git, filterBranches);
      
    } else if (branches.all.includes(name)) { // 本地已存在 name 分支
      console.log(`there has ${name}`);
      await git.checkout([`${name}`]);
      const filterBranches = branches.all.filter(i => !i.includes('remotes'));
      inquirerMerge(name, git, filterBranches);
    } else { // 本地还没有 name 分支
      console.log(`there is no ${name}`);
      await git.checkout(`master`);
      await git.checkout(['-b', `${name}`]);
      const branches = await git.branch();
      const filterBranches = branches.all.filter(i => !i.includes('remotes'));
      inquirerMerge(name, git, filterBranches);
    }
  } else { // 当前分支状态有未处理的文件，退出流程
    console.log(`working tree not clean, please make sure all your changes is commited`);
    process.exit();
  }
};

const deleteAction = async (options) => {
  // 初始化 git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });
  const branches = await git.branch();
  const filterBranches = branches.all.filter(i => !i.includes('remotes'))
    .map(i => {
      return {
        name: i,
        disabled: i === 'master' || i === branches.current
      }
    });

  inquirer
    .prompt({
      name: 'willDeleteBranches',
      type: 'checkbox',
      message: `choose which branches will be deleted`,
      choices: filterBranches
    })
    .then(async (answers) => {
      const res = answers.willDeleteBranches;
      if (res.length === 0) {
        console.log(`there is nothing will be deleted`);
        process.exit();
      } else {
        for (const b of res) {
          try {
            let firstParam = '-d';
            if (options.D) {
              firstParam = '-D';
            }
            const deleteRes = await git.branch([firstParam, b]);
            if (deleteRes.success) {
              console.log(`delete ${deleteRes.branch} is success`);
            } else {
              console.log('something is wrong, please check manually');
              process.exit();
            }
          } catch (err) {
            console.log(`delete failed, the branch ${b} is not fully merged`)
          }
        }
      }
    })
    .catch((error) => {
      console.log(error, 'error');
      process.exit();
    });
};

const checkAction = async () => {
  // 初始化 git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });
  const branches = await git.branch();
  const filterBranches = branches.all.filter(i => !i.includes('remotes'))
    .map(i => {
      return {
        name: i,
        disabled: i === branches.current
      }
    });

  
  inquirer
    .prompt({
      name: 'willCheckBranches',
      type: 'list',
      message: `choose which branches you want to checkout`,
      choices: filterBranches
    })
    .then(async (answers) => {
      const res = answers.willCheckBranches;
      if (!res) {
        console.log(`there is nothing will be checkout`);
        process.exit();
      } else {
        try {
          const checkRes = await git.checkout([res]);
          console.log(`${checkRes}`);
        } catch (err) {
          console.log(`checkout failed, the branch ${res}, err: ${err}`)
        }

        const branches = await git.branch();
        const filterBranches = branches.all.filter(i => !i.includes('remotes'));

        console.log(filterBranches.reduce((acc, i) => {
          return `${acc}\n${branches.current === i ? '*' : ''} ${i}`;
        }, ``));
      }
    })
    .catch((error) => {
      console.log(error, 'error');
      process.exit();
    });
};

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

