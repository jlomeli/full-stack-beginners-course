# 00. Orientation and dev environment

In this lesson you install the tools you'll use for the whole course and run your first command in the course repo.

## What you will be able to do

- Install Node.js, Git, VS Code, and the GitHub CLI
- Move around the file system from the terminal
- Clone your course repo and run its tests

## Install the tools

Install each of these. Accept the default options unless a step says otherwise.

1. **VS Code** from [code.visualstudio.com](https://code.visualstudio.com).
2. **Git**. On macOS, run `xcode-select --install` in Terminal. On Windows, install [Git for Windows](https://git-scm.com/download/win) and use **Git Bash** as your terminal for this course.
3. **Node.js 22 or newer** from [nodejs.org](https://nodejs.org). Pick the LTS version.
4. **GitHub CLI** from [cli.github.com](https://cli.github.com).

Check that each one works. Open a new terminal and run:

```sh
node -v
git --version
gh --version
```

Each command prints a version number. If one prints `command not found`, close the terminal, open a new one, and try again. If it still fails, post the exact error in class chat.

## Set up Git and GitHub

Create a free account at [github.com](https://github.com) if you don't have one, and send your username to your instructor.

Tell Git who you are. Use the email address from your GitHub account:

```sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

Log in to GitHub from the terminal:

```sh
gh auth login
```

Choose **GitHub.com**, then **HTTPS**, then **Login with a web browser**. Answer **Yes** when it asks to authenticate Git with your GitHub credentials.

## Find your way around the terminal

The terminal always has a current folder. These commands are enough to start:

| Command | What it does |
| --- | --- |
| `pwd` | Print the folder you're in |
| `ls` | List what's in it |
| `cd projects` | Go into the `projects` folder |
| `cd ..` | Go up one folder |
| `mkdir projects` | Create a folder named `projects` |
| `code .` | Open the current folder in VS Code |

Make a home for your course work:

```sh
cd ~
mkdir -p projects
cd projects
pwd
```

The last command prints a path ending in `/projects`.

## Get your course repo

Your instructor creates a private repo for you and GitHub emails you an invitation. Accept it, then follow **Your repository** in [how to submit your work](../../docs/student-workflow.md). It clones the repo and installs its dependencies.

Check that everything works by running the tests for lesson 06:

```sh
npm test 06
```

You see 21 failing tests. That's expected. You'll make them pass in lesson 06.

## Exercise

You'll submit this lesson after lesson 01 teaches you how. For now, save the output of these commands in a note:

```sh
node -v
git --version
gh --version
```

Lesson 01 has you paste it into your first pull request.
