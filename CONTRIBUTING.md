# Contributing to Data Annotator for Machine Learning
The Data Annotator for Machine Learning (DAML) project team welcomes contributions from the community. Together, we can grow DAML and make it a better framework.

## Contribution Guidelines

Before you start working with DAML, please read our [Developer Certificate of Origin](https://cla.vmware.com/dco). All contributions to this repository must be signed as described on that page. Your signature certifies that you wrote the patch or have the right to pass it on as an open-source patch.

## Contribution Flow

Here are the typical steps in a contributor's workflow:

- [Fork](https://help.github.com/articles/fork-a-repo/) the main DAML repository.
- Clone your fork and set the upstream remote to the main DAML repository.
- Set your name and e-mail in the Git configuration for signing.
- Create a topic branch from where you want to base your work.
- Setup your local environment to run and build DAML. 
- Make commits of logical units.
- Make sure your commit messages are in the proper format (see below).
- Push your changes to a topic branch in your fork of the repository.
- [Submit a pull request](https://help.github.com/articles/about-pull-requests/).

Example:

``` shell
# Clone your forked repository
git clone git@github.com:<github username>/data-annotator-for-machine-learning.git

# Navigate to the directory
cd data-annotator-for-machine-learning

# Set name and e-mail configuration
git config user.name "John Doe"
git config user.email johndoe@example.com

# Setup the upstream remote
git remote add upstream https://github.com/vmware/data-annotator-for-machine-learning.git

# Create a topic branch for your changes
git checkout -b my-new-feature master

# After making the desired changes, commit and push to your fork.
# note the usage of the -s option which signs your commit.  This is required.
git commit -a -s -m "Some detailed and helpful comment here"
git push origin my-new-feature
```

### Staying In Sync With Upstream

When your branch gets out of sync with the master branch, use the following to update:

``` shell
git checkout my-new-feature
git fetch -a
git pull --rebase upstream master
git push --force-with-lease origin my-new-feature
```

### Updating Pull Requests

If your PR fails to pass CI, or requires changes based on code review, you'll most likely want to squash these changes into existing commits.

If your pull request contains a single commit, or your changes are related to the most recent commit, you can amend the commit.

``` shell
git add .
git commit --amend
git push --force-with-lease origin my-new-feature
```

If you need to squash changes into an earlier commit, use the following:

``` shell
git add .
git commit --fixup <commit>
git rebase -i --autosquash master
git push --force-with-lease origin my-new-feature
```

Make sure you add a comment to the PR indicating that your changes are ready to review. GitHub does not generate a notification when you use git push.

### Formatting Commit Messages

Use this format for your commit message:

```
<title>
<BLANK LINE>
<detailed commit message>
<BLANK LINE>
<reference to closing an issue if applicable>
<BLANK LINE>
Signed-off-by: Your Name <your.email@example.com>
```

#### Writing Guidelines

These documents provide guidance creating a well-crafted commit message:

 * [How to Write a Git Commit Message](http://chris.beams.io/posts/git-commit/)
 * [Closing Issues Via Commit Messages](https://help.github.com/articles/closing-issues-via-commit-messages/)

## Reporting Bugs and Creating Issues

You can submit an issue or a bug to our [GitHub repository](https://github.com/vmware/data-annotator-for-machine-learning/issues).  You must provide:
* The version number of Angular
* The version number of Data Annotator for Machine Learning
* The browser name and version number
* Any available console log messages that show the error.
