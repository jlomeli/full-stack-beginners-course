# Regenerate the syllabus from curriculum.json

`npm run build` writes `SYLLABUS.md` and creates a draft README for any missing lesson folder. `npm run check` writes nothing and fails when something is stale. CI runs `check` on the course repo, where the Actions variable `COURSE_SOURCE` is `true`.

## Sub-features

- Week numbers from `sessionsPerWeek` and each lesson's `sessions`.
- Validation: ids sequential from 00, slugs kebab-case.
- Draft READMEs for new lessons.

## How to get to it (user POV)

The instructor edits `curriculum.json`, runs `npm run build`, and commits both files.

## Driving it with the shell

```sh
npm run check; echo "exit=$?"     # expect: 31 lessons, 11 weeks. Up to date.  exit=0
git diff --stat SYLLABUS.md       # after a build, the diff should match the curriculum change and nothing else
```

Proof: `check` exits 0 after `build`, and the `SYLLABUS.md` diff shows the expected rows changing.

## Gotchas

- `build` never overwrites an existing README, so changing a lesson's objectives doesn't update its README. Edit the README by hand.
- No README may still contain "Draft. Generated" when the course ships: `grep -rl "Draft. Generated" lessons` should print nothing.
