# Full Stack Web Development

An 11-week full-time course that takes beginners from their first terminal command to a deployed full-stack app. It covers HTML, CSS, JavaScript, Node.js, PostgreSQL, TypeScript, and React, plus the team workflow of branches, pull requests, and code review.

Read the [syllabus](SYLLABUS.md) for the full lesson list.

## How the course works

- Every lesson is a folder in `lessons/` with a README and exercises.
- Each student works in their own private copy of this repo.
- For each lesson, the student creates a `lesson-NN` branch, does the exercises, and opens a pull request into their own `main`.
- GitHub Actions runs that lesson's tests on the PR. The instructor reviews the code and comments on specific lines.
- The student fixes the feedback on the same branch and merges after approval.

## Students

Start with [lesson 00](lessons/00-orientation/README.md). [How to submit your work](docs/student-workflow.md) covers branches, PRs, and review.

Run a lesson's tests:

```sh
npm test 06
```

## Instructors

- [Instructor guide](docs/instructor-guide.md). Set up a cohort, review PRs, and track progress.
- [Review guide](docs/review-guide.md). The rubric and comment conventions.
- [Why one repo per student with one PR per lesson](docs/why-this-workflow.md). The alternatives and their costs.

## Repository layout

| Path | Contents |
| --- | --- |
| `curriculum.json` | Source of truth for lessons, objectives, exercises, and pace |
| `SYLLABUS.md` | Generated from `curriculum.json` by `npm run build` |
| `lessons/NN-slug/` | One lesson: `README.md` and `exercises/` |
| `scripts/build.mjs` | Generates the syllabus and missing lesson folders |
| `scripts/test-lesson.mjs` | Runs one lesson's tests, given `06` or a branch name like `lesson-06` |
| `scripts/class.sh` | Instructor commands: `provision`, `queue`, `progress` |
| `.github/workflows/lesson.yml` | Runs the lesson tests on student PRs |
