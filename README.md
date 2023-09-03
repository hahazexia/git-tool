# gitity

a git tool to run some simple command.

## install

```bash
npm i gitity -g
```

## test

```bash
# base on master to make a new test branch, then pick some branches merge into this new test branch
gitity test <branch name>
```

## delete

```bash
# pick some local branches to delete
gitity delete

# -D force to delete
gitity delete -D
```

## check

```bash
# pick a local branch to checkout
gitity check
```

## revert

```bash
# base on master make a new branch
git checkout master
git pull
git checkout -b feature/revert

# choose type
gitity revert

# `revert` means revert the revert commit to revert back
# other means other commit exclude revert commit
? choose which commit type you want to revert (Use arrow keys)
❯ revert 
  other 

# after choose type, then choose which commit you want to revert
? choose which commit you want to revert
❯ xxxxxxx____2023-09-01T08:37:57+00:00____some commit message________username

# then following 4 scenarios will occur:
# 1. revert success
# 2. there are some conflicts, you must resolve them by youself
# 3. the commit you want to revert is a merge commit, you must pick -m options to continue
# 4. unknown error, there will show error message from git
```

## usub

```bash
# equivalent to `git submodule update --init --recursive`
gitity usub
```

## push

```bash
# git push if error will execute git push --set-upstream origin xxx
gitity push
```
