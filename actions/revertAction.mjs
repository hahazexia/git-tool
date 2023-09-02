import simpleGit from 'simple-git';
import inquirer from 'inquirer';
import chalk from 'chalk';
import inquirerPrompt from 'inquirer-autocomplete-prompt';
import fuzzy from 'fuzzy';

inquirer.registerPrompt('autocomplete', inquirerPrompt);

// 提取 "Merge branch 'feature/logo' into 'master' (merge request !4102)" 字符串中 into 前后的两个分支名
function extractBranchNames(s) {
  const pattern = /'([^']*)'\s+into\s+'([^']*)'/;
  const match = pattern.exec(s);

  if (match) {
    return [match[1], match[2]];
  } else {
    return null;
  }
}

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

    const typeOptions = ['revert', 'other'];
    inquirer
      .prompt({
        name: 'type',
        type: 'list',
        message: `choose which commit type you want to revert`,
        choices: typeOptions,
      })
      .then(async (answer) => {
        const commitType = answer.type;
        let options;
        let revertCommitsObj;
        let otherCommitsObj;

        // {
        //   hash: 'xxxxxxxx',
        //   date: '2023-08-07T17:38:50+08:00',
        //   message: 'xxxxx',
        //   refs: '',
        //   body: '',
        //   author_name: 'xxxx',
        //   author_email: 'xxxx'
        // }
        if (commitType === 'revert') {
          // 获取 master 的所有 revert log
          const logs = await git.log();
          const revertCommits = logs.all.filter(commit => commit.message.includes('Revert'));
          revertCommitsObj = revertCommits.reduce((acc, i) => {
            acc[`${chalk.bgRed.bold(i.hash.slice(0, 8))}____${chalk.yellow(i.date)}____${chalk.green(i.message)}____${chalk.blue(i.refs)}____${chalk.white(i.author_name)}`] = i;
            return acc;
          }, {});
          options = Object.keys(revertCommitsObj);
        } else {
          // 获取 master 的所有 other log
          const logs = await git.log();
          const otherCommits = logs.all.filter(commit => !commit.message.includes('Revert'));
          otherCommitsObj = otherCommits.reduce((acc, i) => {
            acc[`${chalk.bgRed.bold(i.hash.slice(0, 8))}____${chalk.yellow(i.date)}____${chalk.green(i.message)}____${chalk.blue(i.refs)}____${chalk.white(i.author_name)}`] = i;
            return acc;
          }, {});
          options = Object.keys(otherCommitsObj);
        }

        await git.checkout(currentBranch);
        await git.submoduleUpdate(['--init', '--recursive']);
        console.log(`now on branch ${currentBranch}`);

        function searchCommit(answers, input = '') {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(fuzzy.filter(input, options).map((el) => el.original));
              // resolve(options.filter(i => i.includes(input)));
            }, Math.random() * 470 + 30);
          });
        }

        inquirer
        .prompt({
          name: 'revert',
          type: 'autocomplete',
          message: `choose which commit you want to revert`,
          searchText: `search the commit you want`,
          emptyText: `nothing found!`,
          pageSize: 8,
          source: searchCommit,
          validate(val) {
            return val ? true : 'Type something!';
          },
        })
        .then(async (answers) => {
          const res = answers.revert;
          if (!res) {
            console.log(`\n`);
            console.log(`there is nothing will be revert`);
            process.exit();
          } else {
            const commitId = commitType === 'revert' ? revertCommitsObj[res].hash : otherCommitsObj[res].hash;
            try {
              await git.revert(commitId);
              console.log(`revert ${commitId} is successful!`);
            } catch (err) {
              // console.log(err, 'revert err');
              // console.log(err.message, 'err.message');
              if (err.message.includes('commit with multiple parents') || err.message.includes('-m option')) {
                console.log('\n'.repeat(1));
                console.error(`${chalk.red('error')}: commit ${chalk.bgRed.bold(String(commitId).slice(0, 8))} is a merge but no ${chalk.green('-m option')} was given`);
                const mergeCommitMsg = await git.raw([
                  'log',
                  '--merges',
                  '--pretty=format:%h %p',
                  '-n',
                  '1',
                  commitId,
                ]);
                const mergeCommitMsgArr = mergeCommitMsg.split(' ');

                const commitObj = commitType === 'revert' ? revertCommitsObj[res] : otherCommitsObj[res];
                const merge2Branch = extractBranchNames(commitObj.message);

                console.log('\n'.repeat(1));
                console.log(`${chalk.red.bgYellow('now here is the three commit hash:')}`);
                console.log(`${chalk.yellow('merge commit')}: ${chalk.bgRed.bold(mergeCommitMsgArr[0])}`);
                console.log(`${chalk.yellow('parent commit 1')}: ${chalk.bgRed.bold(mergeCommitMsgArr[1])} ${merge2Branch?.[1] ? `, corresponding branch is ${chalk.green(merge2Branch[1])}` : ''}`);
                console.log(`${chalk.yellow('parent commit 2')}: ${chalk.bgRed.bold(mergeCommitMsgArr[2])} ${merge2Branch?.[0] ? `, corresponding branch is ${chalk.green(merge2Branch[0])}` : ''}`);
                console.log('\n'.repeat(1));

                const dashMOptionsObj = {
                  [`${chalk.red('-m 1')} aka ${chalk.red('parent commit 1')}: ${chalk.green(merge2Branch[1])}`]: mergeCommitMsgArr[1],
                  [`${chalk.red('-m 2')} aka ${chalk.red('parent commit 2')}: ${chalk.green(merge2Branch[0])}`]: mergeCommitMsgArr[2],
                };
                const dashMOptions = Object.keys(dashMOptionsObj);

                inquirer
                  .prompt({
                    name: 'dashM',
                    type: 'list',
                    message: `choose which parent commit you want to revert，1 or 2`,
                    choices: dashMOptions,
                  }).then(async (answer) => {
                    if (answer.dashM === dashMOptions[0]) {
                      await git.raw(['revert', '-m 1', mergeCommitMsgArr[0]]);
                    } else {
                      await git.raw(['revert', '-m 2', mergeCommitMsgArr[0]]);
                    }

                    console.log('\n'.repeat(1));
                    console.log(`revert ${mergeCommitMsgArr[0]} success`);
                    console.log('\n'.repeat(1));
                  }).catch(err => {
                    console.log(err, 'err');
                    process.exit();
                  });
              } else if (err.message.includes('conflict')) {
                console.log('\n'.repeat(2));
                console.error(`${chalk.red('error')}: please resolve the ${chalk.bgRed.bold('conflicts')}`);
                console.log('\n'.repeat(2));
              } else {
                console.log('\n'.repeat(2));
                console.error(`${chalk.red('error')}: unknown error`);
                console.error(`${chalk.red(err.message)}: ${err.message}`);
                console.log('\n'.repeat(2));
              }
            }
          }
        })
        .catch((error) => {
          console.log(error, 'error');
          process.exit();
        });
      });
  } else {
    // 当前分支状态有未处理的文件，退出流程
    console.log(`\n`);
    console.log(`working tree not clean, please make sure all your changes is commited`);
    process.exit();
  }
};

export default revertAction;
