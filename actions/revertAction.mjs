import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import chalk from 'chalk';

const revertAction = async () => {
  // 初始化 git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });

  // git status 查看当前分支状态
  const currentStatus = await git.status();
  const branchSummary = await git.branch();
  const currentBranch = branchSummary.current;

  if (currentStatus.isClean()) {
    // 检出master分支
    await git.checkout('master');
    // 拉取最新代码
    await git.pull();
    await git.submoduleUpdate(['--init', '--recursive']);
    console.log(`already pull master branch up to date`);

    // 获取 master 的所有 revert log
    const logs = await git.log();
    const revertCommits = logs.all.filter(commit => commit.message.includes('Revert'));
    const revertCommitsObj = revertCommits.reduce((acc, i) => {
      acc[`${chalk.bgRed.bold(i.hash.slice(0, 8))}____${chalk.yellow(i.date)}____${chalk.green(i.message)}____${chalk.blue(i.refs)}____${chalk.white(i.author_name)}`] = i;
      return acc;
    }, {});
    const options = Object.keys(revertCommitsObj);
    // {
    //   hash: 'xxxxxxxx',
    //   date: '2023-08-07T17:38:50+08:00',
    //   message: 'xxxxx',
    //   refs: '',
    //   body: '',
    //   author_name: 'xxxx',
    //   author_email: 'xxxx'
    // }

    await git.checkout(currentBranch);
    await git.submoduleUpdate(['--init', '--recursive']);
    console.log(`now on branch ${currentBranch}`);

    inquirer
      .prompt({
        name: 'revert',
        type: 'list',
        message: `choose which commit you want to revert`,
        choices: options
      })
      .then(async (answers) => {
        const res = answers.revert;
        if (!res) {
          console.log(`\n`);
          console.log(`there is nothing will be revert`);
          process.exit();
        } else {
          const commitId = revertCommitsObj[res].hash;
          await git.revert(commitId);
          console.log(`revert ${commitId} is successful!`);
        }
      })
      .catch((error) => {
        console.log(error, 'error');
        process.exit();
      });

  } else {
    // 当前分支状态有未处理的文件，退出流程
    console.log(`\n`);
    console.log(`working tree not clean, please make sure all your changes is commited`);
    process.exit();
  }
};

export default revertAction;
