# Instructor guide

How to set up a cohort, review submissions, and track progress. For why the course uses this workflow, read [why one repo per student with one PR per lesson](why-this-workflow.md).

## Set up the course repo once

1. Create a GitHub organization for the course, for example `my-bootcamp`. Organizations on the free plan can hold unlimited private repos.
2. Push this repository to `<org>/course` and make it public, or private with the organization's base permission set to **Read**. Students pull lesson updates from it, so they need read access.
3. In `<org>/course`, open **Settings** > **Secrets and variables** > **Actions** > **Variables** and add `COURSE_SOURCE` with the value `true`. PRs to the course repo then run the curriculum check instead of the lesson tests.
4. Edit `.github/CODEOWNERS` so it names you, or a team such as `@my-bootcamp/instructors` if TAs help review. On a paid plan, GitHub requests a review from these people on every student PR. On GitHub Free, [code owners only work in public repos](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners), so student repos get no automatic request. The queue below doesn't depend on it.
5. Keep reference solutions out of this repo. Put them in a separate private repo, for example `<org>/course-solutions`, that has the same `lessons/` layout.

## Start a cohort

1. Ask each student for their GitHub username.
2. Copy `roster.example.csv` to `roster.csv` and add one row per student. `roster.csv` is in `.gitignore` so student names stay out of the repo.
3. Preview what the script will do:

   ```sh
   ORG=my-bootcamp DRY_RUN=1 scripts/class.sh provision
   ```

4. Run it:

   ```sh
   ORG=my-bootcamp scripts/class.sh provision
   ```

   For each student, the script creates the private repo `<org>/fullstack-<username>`, pushes the course into it with full history, and invites the student with write access. If a repo already exists, the script skips creating it and only re-sends the invitation. To add a late student, add their row and run it again.

5. Send students to [how to submit your work](student-workflow.md). Lesson 01 walks them through their first PR.

## Review submissions

See your review queue, oldest first:

```sh
ORG=my-bootcamp scripts/class.sh queue
```

The queue lists every open, non-draft PR in a student repo, oldest first. It doesn't rely on review requests, which GitHub Free doesn't send automatically in private repos.

For each PR:

1. Check that **Lesson checks** passed. If they failed, leave one comment pointing at the failing test, and select **Request changes**. Don't review code that doesn't pass yet.
2. Open **Files changed**. Comment on specific lines. Use **Insert a suggestion** for small fixes the student can commit with one click.
3. Finish with **Review changes**:
   - **Approve** when the work meets the lesson's review focus. Nitpicks can go in the same review as non-blocking comments.
   - **Request changes** when something must be fixed before you'd accept it.
4. Students merge their own PRs after approval.

[The review guide](review-guide.md) has the rubric and comment patterns that keep feedback consistent across reviewers.

### Draft reviews with Claude Code

In Claude Code, ask "review the PRs in my queue" or give it a PR URL. The `review-student-pr` skill in `.claude/skills/` runs the lesson's tests on the student's code, applies this rubric and the lesson's review focus, and leaves the comments as a pending review. A pending review is visible only to you. Open the PR's **Files changed** tab, edit or delete comments, and submit with **Review changes**. Nothing reaches the student until you submit.

To draft reviews automatically, install the background job described in `.claude/skills/review-student-pr/SKILL.md` under **Run it automatically**. Every 10 minutes it drafts a pending review for each new PR or new push and shows a macOS notification.

## Track progress

```sh
ORG=my-bootcamp scripts/class.sh progress
```

The output has one row per student, with the number of lessons merged and their numbers. A student two or more lessons behind the class is worth a check-in.

## Change the curriculum

`curriculum.json` is the source of truth for lesson titles, objectives, exercises, and the schedule. After you edit it, run:

```sh
npm run build
```

The build regenerates `SYLLABUS.md` and creates a draft `README.md` for any new lesson. It never overwrites an existing lesson README. CI on the course repo fails if `SYLLABUS.md` falls out of date.

To write a lesson, follow the pattern in `lessons/06-js-basics/`:

- `README.md` is the lesson. It is a tutorial. Every section ends in something the student runs or writes.
- `exercises/NN-name.js` is a starter file with the spec in a comment and `// TODO` where the code goes.
- `exercises/NN-name.test.js` holds Vitest tests that are the exact spec. `npm test NN` runs them.

Lessons without tests, such as the HTML and CSS lessons, still go through PR review. The lesson checks pass automatically for them, and your review is the only gate.

## Publish a fix mid-cohort

Commit the fix to `<org>/course` and tell students to run `git pull upstream main`. Lesson README fixes merge cleanly. Changes to starter files that students already edited cause merge conflicts, so change a starter only for lessons the cohort hasn't reached.

## Lesson 29 setup

Lesson 29 needs peer-review access and a shared class repo. Follow [lessons/29-working-on-a-team/instructor-setup.md](../lessons/29-working-on-a-team/instructor-setup.md) a few days before the lesson.
