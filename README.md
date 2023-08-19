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
# base on master make a new breanch
git checkout master
git pull
git checkout -b feature/revert-back

# pick a history revert commit to revert back
gitity revert
```

## upd-sub

```bash
# equivalent to `git submodule update --init --recursive`
gitity upd-sub
```
