# Provision repos, list the review queue, show progress

`scripts/class.sh provision|queue|progress` manages a cohort on GitHub with `gh`. `ORG` is the owner, which can be a user (`jlomeli`) or an organization.

## Sub-features

- `provision`: for each roster row, create a private `ORG/fullstack-<github>` repo if it's missing, push the course `main`, and add the student as a collaborator. Safe to rerun.
- `queue`: open PRs under `ORG` that request your review, oldest first.
- `progress`: lessons each student has merged, from `lesson-NN` head branches.

## How to get to it (user POV)

The instructor copies `roster.example.csv` to `roster.csv` (gitignored), fills it in, and runs `ORG=... scripts/class.sh provision` before the cohort starts.

## Driving it with the shell

```sh
printf 'github,name\noctocat,Test\n' > /tmp/verify-course/roster.csv
ORG=jlomeli ROSTER=/tmp/verify-course/roster.csv DRY_RUN=1 scripts/class.sh provision 2>&1 | tee /tmp/verify-course/evidence/provision-dry.txt
```

Proof: for each student, an `octocat -> jlomeli/fullstack-octocat` line and `would run:` lines for `gh repo create ... --private`, the `git push ... main:main`, and the collaborator `PUT`. `queue` and `progress` only read, so they're safe to run for real.

## Gotchas

- `DRY_RUN=1` still calls `gh repo view` to check whether each repo exists, so it needs `gh auth` and network. It skips only the commands that change GitHub.
- A real `provision` creates repos and sends invitations. Run it only when the user asks.
- The roster loop handles a last line with no trailing newline. Keep that when you edit `students()`.
