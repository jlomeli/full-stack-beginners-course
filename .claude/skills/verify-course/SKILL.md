---
name: verify-course
description: Drive the full-stack course repo the way students and the instructor use it, and capture proof. Covers the student test runner (`npm test NN` from a lesson branch), the solution verifier, the curriculum build, each lesson's runnable API or page with the reference solution applied, and the instructor's `scripts/class.sh`. Use after changing a lesson, a script, or the curriculum, before telling the user it works.
---

# Verify the course

The course is a repo of 31 lesson folders (`lessons/NN-slug/`). Students run `npm test NN` on a `lesson-NN` branch. CI runs the same command from `.github/workflows/lesson.yml`. The instructor runs `scripts/verify-solutions.mjs`, `npm run build`/`check`, and `scripts/class.sh`. Lessons 13 onward also ship apps a student runs by hand (Express APIs, Vite pages).

Starter code is mostly `// TODO`, so a lesson's app only works with the reference solution applied. Solutions live in a separate private repo, `../full-stack-beginners-course-solutions`, at the same paths. Set `SOLUTIONS=/path` if it is elsewhere. Never copy solution files into this public repo.

Everything below runs from the course repo root. The helper is `.claude/skills/verify-course/app.sh`, called `app.sh` here.

## Launch

CLI surfaces need no launch. Run `npm ci` once if `node_modules` is missing.

For a lesson app:

```sh
W=$(.claude/skills/verify-course/app.sh overlay 17)    # scratch copy of the course with lesson 17's solution applied
.claude/skills/verify-course/app.sh start lib17 3417 http://localhost:3417/books -- node "$W/lessons/17-node-and-postgres/server.js" library
```

`overlay` copies the course to `/tmp/verify-course/run/course-NN`, links `node_modules`, and copies the solution over it. Your working tree and the lesson's `.data/` folder are never touched. `start` sets `PORT`, runs the command in the background, and returns once the URL answers. It refuses a port that something else owns. Pick a port per app (`34NN` for APIs and `53NN` for Vite is a convention that avoids clashes) so instances run side by side.

Ready means the URL answers. Every server here seeds or creates its schema before `listen`, so an answering URL is usable.

Exceptions to `PORT`: `lessons/22-*/server.js` and `lessons/23-*/server.js` always listen on 3000, and the Vite configs in 22, 23, and 26 proxy `/api` to 3000. Run one of those lessons at a time, and only when port 3000 is free.

## Doctor

```sh
.claude/skills/verify-course/app.sh doctor lib17 http://localhost:3417/books
```

It prints `OK` only when the process is one `app.sh` started, it's alive, and the URL answers. If it says `FAIL`, read the log it names in `/tmp/verify-course/evidence/` before you try anything else.

## Drive

Read the feature file for the surface you changed. Each one lists real commands and the end state that proves it works.

- [features/README.md](features/README.md) is the index.

Pages: no browser automation is installed (no Playwright, no Chrome on this machine). If your session has a browser tool, open the Vite URL with it and act through visible labels. If it doesn't, the proof for a page is the lesson's Vitest suite passing on the overlay (`cd "$W" && npm test NN`), which drives the components in jsdom with Testing Library, plus `curl` showing that Vite serves the page. Say which one you used.

## Evidence

Save proof to `/tmp/verify-course/evidence/`. App logs go there automatically as `NAME.log`. Save each `curl -i` response with `tee` there, and paste the key lines into your report.

Proof standards:
- Use the real path: the HTTP routes, the `npm` scripts, and the branch names a student uses. Don't call exported functions from a scratch script.
- Capture the action and the state after it. For example, `POST /loans` returns 201, then `GET /books?available=false` lists the book.
- For the verifier and test runner, record the exit code too (`echo "exit=$?"`), not only the output.
- A lesson's starter must still fail its tests. A change that makes `npm test NN` pass on the starter breaks the course.
- `class.sh` with `DRY_RUN=1` still calls `gh repo view` and `gh` for reads. It only skips the commands that change GitHub. Never run it without `DRY_RUN=1` unless the user asked you to.

## Cleanup

```sh
.claude/skills/verify-course/app.sh stop          # stop everything app.sh started and delete scratch copies
.claude/skills/verify-course/app.sh stop lib17    # or one app
```

It kills only the PIDs it recorded and their children, never a process found by name. `/tmp/verify-course/evidence/` survives cleanup. Delete it yourself once the user has the report.
