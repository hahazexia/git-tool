
const showBranches = async (git) => {
  const branches = await git.branch();
  const filterBranches = branches.all.filter(i => !i.includes('remotes'));

  console.log(filterBranches.reduce((acc, i) => {
    return `${acc}\n${branches.current === i ? '*' : ' '} ${i}`;
  }, ``));
};

export default showBranches;
