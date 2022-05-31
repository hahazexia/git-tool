const simpleGit = require('simple-git');
const inquirer = require('inquirer');
const { showBranches } = require('./util');

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
        console.log(`\n`);
        console.log(`there is nothing will be checkout`);
        process.exit();
      } else {
        try {
          const checkRes = await git.checkout([res]);
          console.log(`\n`);
          console.log(`${checkRes}`);
        } catch (err) {
          console.log(`\n`);
          console.log(`checkout failed, the branch ${res}, err: ${err}`)
        }

        showBranches(git);
      }
    })
    .catch((error) => {
      console.log(error, 'error');
      process.exit();
    });
};

module.exports = checkAction;
