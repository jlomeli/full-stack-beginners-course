# 29. Working on a team

In this lesson you review two classmates' pull requests, then fix an issue in a codebase the whole class shares. You finish with a pull request that a maintainer merges into a project you didn't write.

## What you will be able to do

- Write clear issues and pull request descriptions
- Give and receive code review
- Work in an existing codebase you did not write

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-29
```

This lesson has no automated tests. You fill in `exercises/team-log.md` with links to your reviews, your issue, and your pull request, and your reviewer follows the links. `npm test 29` finds no test files and exits without an error, so the **Lesson checks** on your PR pass as soon as you push.

The work takes about a day, but other people's reviews take longer to come back. Open your class repo PR early in the day. You can start lesson 30 while you wait for reviews.

## How the class is set up

Until now, only you and your instructor could see your course repo. For this lesson, your instructor sets up two things.

1. **Review pairings.** You get read access to two classmates' course repos, and two classmates get read access to yours. GitHub emails you an invitation for each. Accept both. Read access lets you see the code and comment on pull requests. It doesn't let you push. Your instructor posts the pairings in class chat and removes the access at the end of the week.
2. **The class repo.** Your instructor creates a public repo, `<org>/class-project`, with a small working app and a list of open issues. Some issues carry the `good first issue` label. Everyone can read the repo. Only the instructor can merge into it. You contribute the way you would to any open-source project: fork it, fix an issue on a branch, and open a pull request.

Your instructor's setup steps are in [instructor-setup.md](instructor-setup.md) if you're curious how it works.

## Issues

An **issue** is a page on GitHub that describes one bug or one feature. Teams use issues to agree on what to do before anyone writes code. Every issue has a number, and you refer to it as `#14`.

A good bug report lets someone who has never seen the bug reproduce it in a minute:

```md
Title: Book search misses titles with different capital letters

## Steps to reproduce
1. Start the app with the seed data.
2. Search for `dune`.

## Expected
The book "Dune" appears.

## Actual
"No books found."

## Notes
`searchBooks` in `src/books.js` compares strings with `===`.
```

A good feature request says who wants it, what they want, and how you'll know it's done:

```md
Title: Show how many copies of a book are on loan

As a librarian, I want to see how many copies of a book are out,
so I can tell a member when to come back.

## Done when
- [ ] The book page shows "2 of 3 copies on loan"
- [ ] A book with no loans shows "All copies available"
- [ ] A test covers both cases
```

Notice what both titles do. They say what's wrong or what's wanted, in plain words. "Search broken" and "Feature idea" make every reader open the issue to find out what it's about.

**Labels** sort issues. GitHub creates these on every new repo: `bug`, `enhancement`, `documentation`, and `good first issue`. A `good first issue` is small, well described, and touches only a few files. Maintainers save these for new contributors.

List the open good first issues in the class repo:

```sh
gh issue list --repo <org>/class-project --label "good first issue"
```

Open one to read it in the terminal:

```sh
gh issue view 14 --repo <org>/class-project
```

**Claim one issue.** Pick an issue nobody is assigned to, and comment on it: "I'd like to work on this." Wait for your instructor to assign you before you start. One person per issue keeps two people from fixing the same thing.

## Fork the class repo

A **fork** is your own copy of someone else's repo, on your GitHub account. You push your branch to your fork, then open a pull request from your fork into the original. That's how open source works, because maintainers can't give write access to every stranger who wants to help.

Fork the class repo and clone your fork:

```sh
cd ~/projects
gh repo fork <org>/class-project --clone
cd class-project
git remote -v
```

You see two remotes, the same names you use in your course repo. `origin` is your fork. `upstream` is the class repo.

Install the dependencies and run the tests:

```sh
npm install
npm test
```

Every test passes on `main`. If one fails, tell your instructor before you change anything. You need to know the tests passed before your change, or you can't tell whether your change broke them.

On a job you usually have write access to the team's repo. Then you skip the fork, clone the repo, and push your branch to it directly. Everything else in this lesson stays the same.

## Read code you didn't write

Nobody reads a whole codebase before changing it. You find the one path your issue cares about and follow it. Work through these steps in the class repo:

1. **Read the README.** It says what the app does and how to run it.
2. **Read `package.json`.** The `scripts` section lists every command the project expects you to run.
3. **Run the app** and do the thing your issue describes. See the bug, or see where the feature goes.
4. **Find the entry point.** For an Express app it's the file that calls `listen`. For a React app it's the file that calls `createRoot`.
5. **Search for words from the issue.** `git grep` searches every tracked file and skips `node_modules`:

   ```sh
   git grep -n "search"
   ```

   `-n` prints line numbers. Open the files it finds and follow the function calls until you reach the code that does the work.
6. **Read the tests for that code.** Tests show how the author expected the code to be used.
7. **Ask the history.** `git log` shows who changed a file and why:

   ```sh
   git log --oneline -- src/books.js
   git blame src/books.js
   ```

   `git blame` shows the last commit that touched each line. Run `git show <commit-id>` on one of them to see the whole change and its message.

Write down the files you opened and the commands that helped. Your team log asks for them.

While you read, you'll notice other problems: a confusing name, a missing test, a README step that doesn't work. Don't fix them in your PR. File each one as its own issue. Your team log asks for one.

## Branch names and commits

Teams name branches so anyone can tell what a branch is for without opening it. The class repo uses this pattern:

```
<type>/<issue-number>-<short-description>
```

The type is one of `fix`, `feat`, `docs`, `test`, or `refactor`. For issue 14:

```sh
git fetch upstream
git switch -c fix/14-search-ignores-case upstream/main
```

`git fetch upstream` downloads the newest commits from the class repo. Starting the branch from `upstream/main` means you start from what's merged today, not from the day you forked.

Write commit messages as a command that finishes the sentence "This commit will...". Keep the first line under about 50 characters:

| Instead of | Write |
| --- | --- |
| `fixed stuff` | `Make book search case-insensitive` |
| `changes` | `Add test for searching with capital letters` |
| `WIP` | `Trim spaces from the search query` |

Keep your change to what the issue asks. A reviewer can check a 20-line PR in five minutes. A 400-line PR that also renames things and reformats files takes an hour, and bugs hide in it.

## Write a pull request description

Your reviewer reads the description before the code. A good one answers four questions: what issue this closes, what changed, why you did it this way, and how to check it.

```md
Closes #14

## What changed
`searchBooks` now lowercases both the query and the title before comparing them.

## Why
The old comparison used `===`, so `dune` didn't match `Dune`. I lowercased
both sides instead of using a regular expression because the query can
contain characters like `(` that mean something in a regex.

## How to test
1. `npm test`. The new test "finds a book whatever the capitals" passes.
2. Run the app, search for `dune`, and see "Dune".

## Questions for the reviewer
Should a search for `the` match every title? It does now, and it did before.
```

`Closes #14` is a keyword. When the PR merges, GitHub closes issue 14 and links the two. For a change to the page, add a screenshot. Drag the image into the description box.

Push your branch to your fork and open the PR into the class repo:

```sh
git push -u origin fix/14-search-ignores-case
gh pr create --repo <org>/class-project --web
```

`--repo` sends the PR to the class repo instead of your fork. `--web` opens the PR form in your browser, so you can write the description with a preview. Click **Create pull request** when it's ready.

## Give code review

Review is a conversation about code, not a grade. Your job as a reviewer is to help the author ship something better and to learn from how they solved it.

### Find the PR and run it

List your classmate's PRs, including merged ones:

```sh
gh pr list --repo <org>/fullstack-<classmate> --state all
```

Pick one from a lesson with real code, such as 24 to 28. Clone the repo into its own folder, check out the PR, and run its tests:

```sh
cd ~/projects
gh repo clone <org>/fullstack-<classmate> review-<classmate>
cd review-<classmate>
npm install
gh pr checkout 12
npm test 26
```

`gh pr checkout 12` switches to the branch of PR 12. Replace `12` and `26` with your PR and lesson numbers.

### Read it in this order

1. The PR description and the lesson's **Review focus** list. They tell you what the author was trying to do.
2. The tests, if the lesson has them. Did they pass for you?
3. The code, one file at a time, on the **Files changed** tab.

### Leave labeled comments

On **Files changed**, hover over a line and click the blue **+**. Write your comment, then click **Start a review**. Add the rest of your comments the same way. When you're done, click **Finish your review**, write a short summary, select **Comment**, and click **Submit review**. Your instructor's review is still the one that approves or requests changes.

Start every comment with one of the labels from the course's [review guide](../../docs/review-guide.md):

| Label | Meaning | Blocks merging |
| --- | --- | --- |
| `fix:` | Must change. Say why. | Yes |
| `question:` | Explain your reasoning in a reply. | Only if the answer shows a bug |
| `suggestion:` | A better way. Take it or leave it. | No |
| `nit:` | Style or polish. | No |
| `praise:` | Something done well. | No |

The label tells the author what to do with your comment, so they don't treat every nit as an emergency.

A useful comment points at a specific line, says why, and offers a way forward. Write about the code, not the person:

| Instead of | Write |
| --- | --- |
| This is wrong. | `fix:` when `members` is empty this returns `undefined`, and the page shows "undefined". Return `[]` instead? |
| Why did you do this?? | `question:` why a `for` loop here instead of `filter`? Is there a case `filter` misses? |
| Bad name. | `nit:` `data` could be `overdueLoans`, so the next line reads as a sentence. |
| Nice. | `praise:` testing the empty list first makes this test file clear to follow. |

Leave at least four comments on each PR, with at least one `praise:` and one `question:`. If you find nothing to fix, that's fine. Say what works and ask about one decision you'd have made differently.

To link to a comment in your team log, click the **...** menu on the comment and choose **Copy link**.

## Receive code review

Your two reviewers comment on your PRs, and someone reviews your class repo PR. Reply to every comment, even if the reply is "Done".

- For a `fix:` you agree with, change the code, commit, push, and reply with the commit: "Fixed in a1b2c3d." GitHub turns the commit ID into a link.
- For a `fix:` you disagree with, say why and ask. "I kept `==` here because..." is a conversation. Silence is not.
- For a `question:`, answer it. If answering shows you a bug, fix it.
- For a `suggestion:` or `nit:`, take it or say you're leaving it. Either is fine.

If the PR in your course repo is already merged, reply with what you would change. You don't need to reopen it.

Read every review as feedback on the code, not on you. The best engineers you'll work with get dozens of review comments a week and treat each one as free help.

## Resolve a merge conflict

Your classmates' PRs merge into the class repo while yours is open. If one of them changed the same lines you did, GitHub shows **This branch has conflicts that must be resolved** at the bottom of your PR. Lesson 01 showed you what a conflict looks like. Here's how to fix one on a real team.

Bring the newest class repo code into your branch:

```sh
git fetch upstream
git switch fix/14-search-ignores-case
git merge upstream/main
```

Git merges what it can and stops on the conflict:

```
Auto-merging src/books.js
CONFLICT (content): Merge conflict in src/books.js
Automatic merge failed; fix conflicts and then commit the result.
```

`git status` lists the file under **Unmerged paths**. Open it:

```js
export function searchBooks(books, query) {
<<<<<<< HEAD
  return books.filter((book) => book.title.toLowerCase().includes(query.toLowerCase()));
=======
  return books.filter((book) => book.title.includes(query.trim()));
>>>>>>> upstream/main
}
```

The top half is your branch. The bottom half is what a classmate merged: they trimmed spaces from the query. Picking one half throws away the other person's fix. Usually you want both:

```js
export function searchBooks(books, query) {
  return books.filter((book) => book.title.toLowerCase().includes(query.trim().toLowerCase()));
}
```

Delete the marker lines, run the tests, then commit the merge and push:

```sh
npm test
git add src/books.js
git commit --no-edit
git push
```

`--no-edit` keeps Git's default message, "Merge remote-tracking branch 'upstream/main'...". The conflict banner on your PR disappears. You didn't rewrite any history, so a normal `git push` works.

If you get stuck halfway, `git merge --abort` puts the branch back the way it was before the merge.

### Practice on a conflict you make yourself

Your class repo PR might never conflict. Make a guaranteed one in a scratch repo:

```sh
mkdir ~/projects/conflict-drill
cd ~/projects/conflict-drill
git init -b main
printf 'function greet(name) {\n  return "Hello, " + name;\n}\n' > greet.js
git add greet.js
git commit -m "Add greet"

git switch -c shout
printf 'function greet(name) {\n  return ("Hello, " + name).toUpperCase();\n}\n' > greet.js
git commit -am "Shout the greeting"

git switch main
printf 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n' > greet.js
git commit -am "Use a template literal"

git merge shout
```

You see `CONFLICT (content): Merge conflict in greet.js`. Resolve it so the function keeps both changes: a template literal with an exclamation mark, in capitals. Commit the merge and run `git log --oneline --graph` to see the two branches join.

## Exercises

Fill in `exercises/team-log.md` as you go. Every answer is a link or a few sentences.

1. **Review two classmates' pull requests.** Leave at least four labeled comments on one PR from each classmate. Reply to every comment you receive on your own PRs.
2. **Fix a labeled issue in the class repo.** Claim a `good first issue`, fork the repo, fix it on a branch named by the convention, and open a PR with a description that closes the issue. Respond to its review. Along the way:
   - File one new issue for a problem you noticed while reading the code.
   - Resolve a merge conflict. Use your class repo PR if it gets one, or the drill if it doesn't.

### Stretch goals

These don't count toward review. Mention them in your PR description if you try them.

- Write a failing test that shows the bug before you fix it. Push it as its own commit so your reviewer sees it fail, then pass.
- Review a class repo PR from someone outside your pairing.
- Take a second issue that isn't labeled `good first issue`.

## Submit

Your class repo PR doesn't need to be merged before you submit. It needs at least one round of review that you've replied to. When it merges later, update the status in your team log and push again.

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/29-working-on-a-team
git commit -m "Complete lesson 29 exercises"
git push -u origin lesson-29
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things:

- Every review comment you left starts with a label, each `fix:` says why, and each review has at least one `praise:`
- Your comments point at specific lines and talk about the code, not the person
- You replied to every comment you received, with a commit link or a reason
- Your class repo PR closes its issue with `Closes #N`, touches only what the issue asks, and has a description a reviewer can test from without asking you anything
- Your conflict resolution keeps both sides' changes, and the tests pass after it
