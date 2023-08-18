import simpleGit from 'simple-git';
import inquirer from 'inquirer';

const updSubmodAction = async () => {
  // 初始化 git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });

  await git.submoduleUpdate(['--init', '--recursive']);
  console.log('submodule already up to date');
};

export default updSubmodAction;
