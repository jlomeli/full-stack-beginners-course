# How to submit your work

You submit every lesson as a pull request (PR) in your own private repository. Your instructor reviews the PR, leaves comments on specific lines, and approves it when it's done. This is the same workflow you'll use on the job, so by the end of the course it will be second nature.

## Your repository

Your instructor creates a private repo for you named `fullstack-<your-github-username>`. It has the whole course in it. Only you and the instructors can see it.

Accept the invitation from the email GitHub sends you, then do this once:

```sh
gh repo clone <org>/fullstack-<your-github-username>
cd fullstack-<your-github-username>
git remote add upstream https://github.com/<org>/course.git
npm install
```

`origin` is your repo. `upstream` is the instructor's course repo, where lesson updates come from.

## Each lesson

1. Start from an up-to-date `main`:

   ```sh
   git switch main
   git pull
   ```

2. Create the lesson branch. The name must be `lesson-` and the two-digit lesson number, because the automated checks read the lesson number from it:

   ```sh
   git switch -c lesson-06
   ```

3. Read `lessons/06-.../README.md` and do the exercises. Commit as you go. Small commits with clear messages are easier to review than one giant commit.

   ```sh
   npm test 06
   git add lessons/06-js-basics
   git commit -m "Solve FizzBuzz"
   ```

4. Push the branch and open a PR into your own `main`:

   ```sh
   git push -u origin lesson-06
   gh pr create --fill
   ```

   Fill in the PR template. The **Where I got stuck** section is the most useful part for your reviewer.

5. Wait for the **Lesson checks** to finish on the PR page. If they fail, click **Details**, fix the problem, commit, and push. The PR updates by itself.

## When you get feedback

Your instructor reviews the PR and picks one of these:

- **Approve.** You're done. Click **Merge pull request**, then start the next lesson from step 1.
- **Request changes.** Read every comment. Fix each one with a new commit on the same branch, and push. Reply to each comment with what you changed, or ask a question if you disagree or don't understand. Then click the **Re-request review** icon next to your reviewer's name. That puts your PR back in the instructor's queue.
- **Comment.** Suggestions that don't block merging. Fix what you agree with, then merge.

Don't open a new PR for fixes. Keep pushing to the same branch so the whole conversation stays in one place.

A comment with a **Suggested change** block has a **Commit suggestion** button. Use it for small fixes like a typo.

## You can start the next lesson before the review comes back

Don't wait on a review. Create the next branch from `main` (step 1), not from the branch under review. When the review comes back, switch to the old branch, fix it, and switch back:

```sh
git switch lesson-06
# fix, commit, push
git switch lesson-07
```

## When the instructor updates the course

Your instructor will announce updates in class chat. To get them:

```sh
git switch main
git pull upstream main
git push
```

If Git reports a merge conflict, you edited a file the instructor also changed. That's normal. Ask in class chat if you're not sure how to resolve it. Lesson 01 covers conflicts.

## Common problems

**The checks say my branch "does not name a lesson."** Rename the branch: `git branch -m lesson-06`, then `git push -u origin lesson-06`. Close the old PR and open a new one from the renamed branch.

**I committed on `main` by accident.** Move the commits to a branch: `git switch -c lesson-06`, then `git switch main`, then `git reset --hard origin/main`. Check `git log lesson-06` first to confirm your commits are on the branch.

**My PR shows files from another lesson.** You created the branch from another lesson branch instead of `main`. Ask your instructor. It's fixable and doesn't need starting over.
