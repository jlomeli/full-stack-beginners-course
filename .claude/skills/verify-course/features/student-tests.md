# Run a lesson's tests from a lesson branch

`scripts/test-lesson.mjs` takes `06`, `lesson-06`, or a branch name like `lesson-06-retry`, finds `lessons/06-*`, type-checks it when it has a `tsconfig.json` (lessons 18 and 19), and runs Vitest on that folder. CI passes `github.head_ref` to it.

## Sub-features

- Lesson id from a number, a `lesson-NN` name, or a longer branch name.
- Clear failure for a branch that doesn't name a lesson.
- `tsc --noEmit` before the tests in TypeScript lessons.

## How to get to it (user POV)

The student creates `lesson-NN` from `main`, runs `npm test NN`, and opens a PR. CI runs `npm test "$BRANCH"`.

## Driving it with the shell

```sh
npm test 20; echo "exit=$?"                 # starter: every test fails, exit 1
npm test lesson-20-retry; echo "exit=$?"    # same lesson, parsed from a branch name
npm test feature-x; echo "exit=$?"          # prints: "feature-x" does not name a lesson. Name your branch lesson-NN, ...
W=$(.claude/skills/verify-course/app.sh overlay 20); (cd "$W" && npm test 20; echo "exit=$?")   # solution: all pass, exit 0
```

Proof: the starter run shows `Tests  N failed (N)` with the count the lesson README states, and the overlay run passes with exit 0.

## Gotchas

- Lessons 00, 01, 02, 29, and 30 have no tests. `npm test` passes there with `--passWithNoTests`, and the review is the gate.
- Some lessons have tests that pass on the starter on purpose: 26 (5 of 45), 27 (1 of 24), 28 (35 of 59) check code that is already written. The suite as a whole still fails.
- In lesson 18 or 19 a type error stops the run before Vitest starts. That's intended.
