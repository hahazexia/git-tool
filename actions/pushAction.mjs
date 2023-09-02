import simpleGit from 'simple-git';

const pushAction = async () => {
  // 初始化 git
  const git = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
  });

  const branch = await git.branch();
  const currentBranch = branch.current;

  try {
    await git.push();
  } catch(err) {
    await git.push(['--set-upstream', 'origin', currentBranch]);
  }
  console.log('push success');
};

export default pushAction;
