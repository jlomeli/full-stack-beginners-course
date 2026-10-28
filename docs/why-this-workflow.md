# Why one repo per student with one PR per lesson

The course keeps lessons in folders on one `main` branch. Each student gets a private copy of the course repo and submits each lesson as a pull request into their own `main`. This document explains why, and what the alternatives cost.

## Branches hold student work, not lessons

The first design considered was one branch per lesson in the course repo. It fails in three ways for beginners:

- GitHub shows the default branch. A lesson on a branch is invisible until the student finds the branch picker, which is a lot to ask in week one.
- A fix to shared material, such as the setup instructions or the test runner, has to be copied to every lesson branch. With 31 lessons, the branches drift apart within a month.
- Cumulative lessons would need each branch to contain the ones before it. That means merging every fix forward through the whole chain.

Folders on `main` have none of these problems. A fix is one commit. The syllabus links straight to each lesson. The branch per lesson that the original idea wanted still exists. It's the student's `lesson-NN` branch, where it carries their work, and each one gets its own PR.

## Why each student has their own repo

| Option | Problem |
| --- | --- |
| Students push branches to the shared course repo | Every student needs write access to the course. Students can see and change each other's work. Hundreds of branches pile up in one repo. |
| Students fork the course repo | Forks of a public repo are public, so students can copy each other's solutions. PRs into the course repo must never merge, which teaches the wrong habit. |
| GitHub Classroom | Creates one repo per assignment, so about 31 repos per student. Its feedback PR is a single long-running PR per repo rather than one review per unit of work. It's a good choice if your school already runs it. |
| One private repo per student, one PR per lesson | Students can't see each other's work. Each review is a normal PR into the student's own `main`, which is exactly how code review works on a job. |

The last option is the one this course uses. `scripts/class.sh provision` creates the repos, so the extra setup is one command per cohort.

## Why the student repo has full course history

The provision script pushes the course's git history into each student repo instead of using a GitHub template. A template repo starts with a fresh, unrelated history, so `git pull upstream main` fails with "refusing to merge unrelated histories". With shared history, instructor updates merge into student repos like any other commit.

## Why CI reads the lesson number from the branch name

The repo holds all 31 lessons. Running every test on every PR would fail on lessons the student hasn't started. The branch name `lesson-06` tells `scripts/test-lesson.mjs` which folder to test. A misnamed branch fails the check with a message saying how to name it, so the convention enforces itself instead of relying on reviewers to catch it.

## Why one source file for the curriculum

Lesson titles, objectives, and the schedule live in `curriculum.json`. The syllabus, the lesson folder skeletons, and the week numbers are generated from it. Changing the pace, such as from five sessions a week to three for a part-time cohort, is a one-line edit to `sessionsPerWeek`, not a rewrite of the syllabus.

## What this costs

- Students learn branches and PRs in week one. Lesson 01 teaches exactly that, and the skill pays off for the rest of the course and on the job.
- Peer review needs extra setup, because students can't see each other's repos. For lesson 29, give each student read access to two classmates' repos.
- [GitHub's plans page](https://docs.github.com/en/get-started/learning-about-github/githubs-plans) lists protected branches for private repos under the paid plans. On a free organization, a student can push straight to `main` and skip review. The `progress` report counts only merged PRs, so a skipped lesson shows up as missing. If your organization qualifies for a GitHub Education or Team plan, add a rule to each student repo that requires one approval before merging into `main`.
