# How to write a lesson

Follow this guide to write or rewrite a lesson. `lessons/06-js-basics/` is the reference example. Read it before you start.

## Start from curriculum.json

The lesson's entry in `curriculum.json` sets its title, objectives, and exercises. The lesson must teach every objective and include every exercise. If the lesson needs a different exercise, change `curriculum.json` and run `npm run build`.

## Folder layout

```
lessons/NN-slug/
  README.md                 the lesson
  exercises/
    01-name.js              starter file: the spec in a comment, // TODO where code goes
    01-name.test.js         Vitest tests: the exact spec
  project/                  project lessons only: starter and tests for the project
  tsconfig.json             TypeScript lessons only: npm test type-checks the folder
```

Name test files `*.test.js`, `*.test.jsx`, or `*.test.ts`. `npm test NN` runs every test file in the folder.

## Write the README as a tutorial

- Open with one or two sentences that say what the student builds in this lesson, not what they "learn".
- Keep the heading **What you will be able to do** and list the objectives from `curriculum.json`.
- Add a **Before you start** section that creates the `lesson-NN` branch from `main` and runs `npm test NN`. State how many tests fail on the starter code.
- Teach with small code examples. After each concept, give the student something to type and say what they should see.
- Explain only what the exercises need. Link to MDN or the official docs for depth.
- Write to the student as "you", in the present tense, with short sentences. Write instructions as commands. Never write "simply", "easy", "just", or "obviously".
- Put an **Exercises** section near the end that lists each exercise file and what it does.
- Add optional **Stretch goals** without tests when they help.
- End with **Submit**, using the same commands as lesson 06 with the lesson number changed, and **Review focus**, three to five things the reviewer checks beyond passing tests.
- A lesson takes a beginner about one day of focused work. A project lesson with `sessions` in `curriculum.json` takes that many days.

## Write exercises with tests whenever the result can be checked

- Each starter file exports functions with the right names and parameters, and a body of `// TODO`. The comment above each function states the spec.
- Tests assert behavior the student can observe: return values, rendered text, HTTP responses, and database rows. Never assert how the code is written.
- Each test name reads as a sentence that tells the student what's wrong when it fails.
- Every test fails on the starter code and passes on the reference solution. `node scripts/verify-solutions.mjs <solutions-repo> NN` checks both.
- Keep every lesson self-contained. Never import from another lesson's folder. When a lesson builds on earlier work, include its own starter version of that earlier code.

Some outcomes can't be checked by a test: page design, written answers, deployment, and team work. For those, the exercise produces a file the reviewer reads, such as `answers.md` or a filled-in checklist. The lesson has no test files, and the review is the gate.

## Tools available to tests

These are installed in the root `package.json`. Don't add others without updating it.

| Need | Use |
| --- | --- |
| Unit tests | `vitest` |
| DOM and HTML | Add `// @vitest-environment jsdom` as the first line of the test file. Use `@testing-library/dom` and `@testing-library/user-event`. Load an HTML file with `readFileSync` and set `document.body.innerHTML`. |
| React | `react`, `react-dom`, and `@testing-library/react` in a `.test.jsx` file with the jsdom comment. JSX needs no extra setup. |
| HTTP servers | `express` and `supertest`. Starters export the Express `app` and never call `listen`. A separate `server.js` calls `listen` for running it by hand. |
| PostgreSQL | `@electric-sql/pglite` runs Postgres in memory with no install. Starter code takes a `db` argument with a `query(sql, params)` method that resolves to `{ rows }`. A real `pg` pool and a PGlite instance both have that method, so tests pass a PGlite instance and the README shows a `pg` pool for real use. |
| Validation | `zod` |
| TypeScript | `typescript`. Vitest runs `.ts` files directly. Add a `tsconfig.json` with `"strict": true` and `"noEmit": true` to make `npm test NN` type-check the folder. |

Tests never use the network. Mock `fetch` with `vi.stubGlobal('fetch', ...)`.

## Reference solutions

Solutions live in the private solutions repo, `full-stack-beginners-course-solutions`, at the same path as the files they replace, for example `lessons/06-js-basics/exercises/01-temperature.js`. Include only the files a student changes.
