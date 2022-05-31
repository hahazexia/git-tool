const simpleGit = require('simple-git');
const inquirer = require('inquirer');
const { showBranches } = require('./util');

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
        console.log(`\n`);
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
            console.log(`delete failed, the branch ${b} is not fully merged. err: ${err}`)
          }
        }

        showBranches(git);
      }
    })
    .catch((error) => {
      console.log(error, 'error');
      process.exit();
    });
};

module.exports = deleteAction;
