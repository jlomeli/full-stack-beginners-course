# Check starters fail and solutions pass

`scripts/verify-solutions.mjs <solutions-repo> [ids...]` checks, for each lesson with tests, that the starter fails and the solution, copied over a scratch copy, passes.

## Sub-features

- All lessons, or only the ids given.
- `no tests` for review-gated lessons.
- `NOT VERIFIED` with the reason (starter passes, solution fails, or no solution folder).

## How to get to it (user POV)

The instructor runs it after editing a lesson or a solution, before pushing.

## Driving it with the shell

```sh
node scripts/verify-solutions.mjs ../full-stack-beginners-course-solutions 17 20; echo "exit=$?"
```

Proof: one `NN  VERIFIED  starter fails, solution passes` line per id, and exit 0. A full run (no ids) takes several minutes. Run it with a 10-minute timeout.

## Gotchas

- It reports one line per lesson and hides test output. To see why a lesson fails, run `npm test NN` in an overlay (see student-tests.md).
- The scratch copy skips `node_modules` and `.git`, and links `node_modules` back to the course.
