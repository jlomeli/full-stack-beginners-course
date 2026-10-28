# 01. Git and GitHub: commits, branches, pull requests

In this lesson you open your first pull request, get a review comment from your instructor, fix it, and merge. You'll do this for every lesson in the course, so this is the most important workflow you'll learn.

## What you will be able to do

- Explain what a commit, a branch, and a remote are
- Create a branch, commit, push, and open a pull request
- Respond to review comments with new commits

## Commits

Git takes snapshots of your project. Each snapshot is a **commit**. A commit records which files changed, who changed them, when, and a message saying why.

See the commits already in your repo:

```sh
git log --oneline
```

Each line is one commit: a short ID and its message. The newest is at the top.

Making a commit has two steps. First you **stage** the changes you want in the snapshot with `git add`. Then you **commit** them with a message. Staging lets you choose which changes go together.

## Branches

A **branch** is a line of commits with a name. Your repo starts with one branch, `main`. You never work on `main` directly in this course. For each lesson, you create a branch, do the work there, and merge it into `main` when your reviewer approves.

See your branches. The current one has a `*`:

```sh
git branch
```

## Remotes

Your repo lives in two places: the copy on your computer and the copy on GitHub. The GitHub copy is a **remote** named `origin`. `git push` sends your commits to `origin`. `git pull` brings commits from `origin` to your computer.

```sh
git remote -v
```

You also see `upstream`, the instructor's course repo. You set it up in lesson 00.

## Your first pull request

A **pull request** (PR) asks to merge one branch into another. On GitHub, it shows every change on the branch, and reviewers can comment on any line.

1. Create a branch for this lesson:

   ```sh
   git switch main
   git pull
   git switch -c lesson-01
   ```

2. Create the file `lessons/01-git-and-github/about-me.md` in VS Code. Write a few lines: your name, why you're taking this course, and something you'd like to build. Below that, paste the version output you saved in lesson 00.

3. See what Git noticed:

   ```sh
   git status
   ```

   Your new file appears under **Untracked files**.

4. Stage and commit it:

   ```sh
   git add lessons/01-git-and-github/about-me.md
   git commit -m "Add about-me page"
   git status
   ```

   Now `git status` says `nothing to commit, working tree clean`.

5. Push the branch to GitHub:

   ```sh
   git push -u origin lesson-01
   ```

   `-u` links your local branch to the one on GitHub, so next time `git push` is enough.

6. Open the pull request:

   ```sh
   gh pr create --fill
   ```

   The command prints a link. Open it in your browser. Fill in the template on the PR page. Click **Edit** next to the description if you need to.

7. Wait for **Lesson checks** to show a green check mark at the bottom of the PR page.

## Respond to review

Your instructor leaves at least one comment on your PR and selects **Request changes**. That's part of the exercise. It's how you practice the review loop before the code gets harder.

1. Read the comment on the **Files changed** tab.
2. Make the change in VS Code.
3. Commit and push it to the same branch:

   ```sh
   git add lessons/01-git-and-github/about-me.md
   git commit -m "Address review feedback"
   git push
   ```

4. Reply to the comment on GitHub with what you changed.
5. Click the **Re-request review** icon next to your reviewer's name, in the **Reviewers** box at the top right of the PR.

When your instructor approves, click **Merge pull request**, then **Confirm merge**. Then update your local `main`:

```sh
git switch main
git pull
git log --oneline
```

Your commits are now in `main`.

## Merge conflicts

A **conflict** happens when two branches change the same lines of a file. Git can't tell which version you want, so it asks you to choose. Git marks the spot in the file like this:

```
<<<<<<< HEAD
the version on your current branch
=======
the version on the branch you're merging in
>>>>>>> lesson-01
```

To resolve it, edit the file so it contains what you want, delete the three marker lines, then `git add` the file and `git commit`. VS Code shows **Accept Current Change** and **Accept Incoming Change** buttons above each conflict that do the editing for you.

## Exercises

1. Write `about-me.md` and submit it as your first pull request.
2. Fix the review comment your instructor leaves on it, re-request review, and merge after approval.

## Review focus

- The branch is named `lesson-01`
- The PR template is filled in
- The fix is a new commit on the same branch, not a new PR
