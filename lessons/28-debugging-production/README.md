# 28. Debugging and performance in production

In this lesson you diagnose a sample library API that has three planted bugs: a slow query, a date that depends on the computer's timezone, and an error that crashes the server. You find each one from evidence (a query plan, a failing test, a stack trace), fix it, and write down what you found in `diagnosis.md`. Then you measure your deployed front end with Lighthouse.

## What you will be able to do

- Read logs and stack traces from a deployed app
- Find slow queries and add indexes
- Measure page performance with Lighthouse

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-28
```

Run the tests for this lesson:

```sh
npm test 28
```

You see 24 failing tests and 35 passing. The failures come from the three bugs. The tests that pass already describe working behavior, and they must keep passing while you fix the bugs.

## How to debug

In production you can't set a breakpoint, and you can't ask the user to open their console. You work from evidence the system left behind. The loop is the same every time:

1. **Reproduce.** Make the problem happen on demand. A bug you can't repeat, you can't be sure you fixed.
2. **Gather evidence.** Logs, a stack trace, a query plan, a measurement.
3. **Form one hypothesis** that explains the evidence. Write it down.
4. **Change one thing** and run it again.
5. **Keep a test** that fails without the fix, so the bug can't return.

Guessing and changing three things at once feels fast and teaches you nothing. Every bug below has a failing test. Read the failure first.

## Logs and stack traces

A log is the app's diary. Everything your server prints with `console.log` or `console.error` goes to standard output and standard error. A host collects both and shows them in its Logs tab, or you read them with its command line tool. Look there first.

Use the right call for the job: `console.error` for things that went wrong, `console.log` for normal events. Log what happened, to whom, and why, in one line you can search for:

```js
console.error(`Receipt failed for loan ${loan.id}:`, error);
```

Never log passwords, tokens, session cookies, or full connection strings.

A **stack trace** lists the functions that were running when an error was created, newest first:

```
Error: Receipt for loan 20001 bounced: mailbox wren@bounce.example does not exist
    at sendReturnReceipt (file:///app/exercises/notify.js:7:9)
```

Read it like this:

1. The first line is the message. Search for it.
2. The first `at` line is where the error was created: file, line, column.
3. The lines below are the callers, in order. Find the first one that is your code, not a library's.

When a trace is short and doesn't mention your route, that is evidence too. Something started the work and then moved on, so the route is no longer on the call stack when the error happens. You see that in bug 3.

## Bug 1: a slow query

Run the API by hand:

```sh
node lessons/28-debugging-production/exercises/server.js
```

It loads `schema.sql` and `seed.sql` into an in-memory Postgres: 500 books, 200 members, and 20,000 loans. In another terminal, call the open-loans route:

```sh
curl -i localhost:3000/api/members/10/loans/open
```

It answers fast here because 20,000 rows is small for Postgres. Real tables grow to millions of rows, and the cost grows with them. You don't need a slow response to see the problem. The database will tell you how it plans to answer.

### EXPLAIN

Put `EXPLAIN` in front of any query and Postgres prints its plan without running it. `EXPLAIN ANALYZE` runs it too, and shows real times and row counts. Lesson 15 has `run.js` for trying SQL; for this lesson use a short script. Create `lessons/28-debugging-production/explain.mjs` (leave it uncommitted, or commit it):

```js
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { OPEN_LOANS_FOR_MEMBER_SQL } from './exercises/01-slow-query.js';

const read = (name) => readFileSync(new URL(`./exercises/${name}`, import.meta.url), 'utf8');
const db = new PGlite();
await db.exec(read('schema.sql'));
await db.exec(read('seed.sql'));
await db.exec(read('01-indexes.sql'));
await db.exec('ANALYZE');

const { rows } = await db.query(`EXPLAIN ANALYZE ${OPEN_LOANS_FOR_MEMBER_SQL}`, [10]);
console.log(rows.map((row) => row['QUERY PLAN']).join('\n'));
```

Run `node lessons/28-debugging-production/explain.mjs`. You see something like this (your numbers differ):

```
Sort  (cost=... rows=10 ...)
  ->  Hash Join  (...)
        ->  Seq Scan on loans l  (cost=0.00..433.00 rows=10 width=...) (actual time=... rows=10 loops=1)
              Filter: ((returned_at IS NULL) AND (member_id = 10))
              Rows Removed by Filter: 19990
```

Read it from the innermost, most indented line outward. Two lines matter:

- `Seq Scan on loans` means Postgres read every row of the table.
- `Rows Removed by Filter: 19990` means it read 20,000 rows to keep 10.

An **index** is a sorted lookup structure kept next to the table, like the index of a book. With an index on `member_id`, Postgres jumps to that member's rows. You see `Index Scan` or `Bitmap Index Scan` in the plan instead of `Seq Scan`.

```sql
CREATE INDEX loans_member_id_idx ON loans (member_id);
```

Postgres indexes primary keys and `UNIQUE` columns by itself. It does not index a plain `REFERENCES` column, which is the usual cause of a slow join or lookup.

Indexes are not free. Each one makes inserts and updates a little slower and takes disk space. Add one when a query you run often filters or joins on a column and reads far fewer rows than the table holds. Don't add one per column. On a tiny table, a sequential scan is the faster plan, and Postgres knows that.

### Your task

1. Run the tests: `npm test 28`. Read the failure of `01-slow-query.test.js`.
2. Run `explain.mjs` and paste the plan into `diagnosis.md`.
3. Write the fix in `exercises/01-indexes.sql`. Don't edit `01-slow-query.js`, `schema.sql`, or `seed.sql`.
4. Run `explain.mjs` again and paste the new plan into `diagnosis.md`.

The test reads the plan as JSON (`EXPLAIN (FORMAT JSON)`) and checks that no node does a sequential scan on `loans` and that an index you created is used. It checks the plan, not the clock, so it gives the same answer on a slow or fast machine.

## Bug 2: a date that changes with the timezone

Every loan is due 14 days after it was borrowed. Open `exercises/02-dates.js` and run `dueDate`:

```sh
node -e "
import('./lessons/28-debugging-production/exercises/02-dates.js').then(({ dueDate }) => {
  console.log(dueDate('2026-03-01T03:00:00Z'));
})"
TZ=America/Los_Angeles node -e "
import('./lessons/28-debugging-production/exercises/02-dates.js').then(({ dueDate }) => {
  console.log(dueDate('2026-03-01T03:00:00Z'));
})"
```

Same input, two answers. Your laptop might have printed the right one both times, because the bug depends on the timezone of the computer. That makes it the worst kind of bug: it works on your machine, in CI (which runs in UTC), and for most users.

### Why

A JavaScript `Date` is one moment in time, stored as a number. Its methods come in two families:

| Local time | UTC |
| --- | --- |
| `getDate()`, `setDate()`, `setHours()` | `getUTCDate()`, `setUTCDate()`, `setUTCHours()` |
| Depends on the timezone of the computer | Same everywhere |

Midnight in Los Angeles is not midnight in UTC. Code that mixes the two families moves the date by a day or more for some users and never for others. `toISOString()` always prints UTC.

To catch it in a test, the test file changes `process.env.TZ` and runs the same checks in four timezones. Look at the `describe.each(zones)` block in `02-dates.test.js`. Notice that the UTC run passes on the buggy code. A test suite run only in UTC would never have found this.

Fix the bug in `02-dates.js`. The comment above `dueDate` says what the answer must be. Read the failing test names first: they list the input and the timezone. Explain in `diagnosis.md` which methods caused it.

Off-by-one errors are close relatives. The tests check the edges: the last second of the due date (0 days overdue), and the first second after it (1 day overdue). Test edges on purpose, because bugs live there.

## Bug 3: an error that crashes the server

Run the server again (stop the old one with Ctrl+C). Return a loan that belongs to a member whose mailbox bounces:

```sh
curl -i -X POST localhost:3000/api/loans/20001/return
```

You get a normal `200` answer. Then look at the terminal where the server runs: it printed a stack trace and exited. The next request gets no answer at all.

Read the trace. It points to `notify.js`, which throws. It does not mention `03-app.js`. Now read the route. It calls `sendReceipt(...)` without `await` and without a `.catch`. The function is `async`, so it returns a promise, and the promise rejects after the route already answered.

Promises are covered in lesson 10. A rejected promise that nothing handles is an **unhandled rejection**. Node's default is to end the process when one happens. Express 5 catches errors from your `async` route handlers, but only on the promise that the handler returns. A promise you start and walk away from is outside that safety net.

```js
// The promise is not awaited and has no catch. If it rejects, the process dies.
sendReceipt(member, loan);

// Handled. The route still answers right away, and the failure goes to the log.
sendReceipt(member, loan).catch((error) => console.error(`Receipt failed for loan ${loan.id}:`, error));
```

Two decisions are yours, and both appear in the tests:

- Should the response wait for the email? Open the comment above the route. It says no.
- What should happen when the email fails? The member already returned the book, so the answer stays `200`, and the failure goes to the log so someone can find it.

Fix `03-app.js`. Do not edit `notify.js`: a real email service fails sometimes and you can't change that.

In `diagnosis.md`, paste the crash from your terminal, say which file and line threw, and say why the route does not appear in the trace.

A real app also needs a last-resort log for rejections you missed. Search the Node docs for `process.on('unhandledRejection')`. Use it to log, not to hide the problem.

## Measure page performance with Lighthouse

Tests can't tell you how a page feels. [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) is a tool built into Chrome that loads your page and scores it for performance, accessibility, best practices, and SEO. It also lists specific things to fix.

Run it on your deployed library app from lesson 27:

1. Open the live URL in a Chrome **incognito window**. Extensions change the result, and incognito turns them off.
2. Open DevTools (F12 or Cmd+Option+I) and choose the **Lighthouse** panel.
3. Choose **Mobile** first, check all four categories, and click **Analyze page load**.
4. Read the report. Don't stop at the number. Open **Opportunities** and **Diagnostics**. They name files, sizes, and the savings.
5. Choose one fix: compress or resize an image, load a script later, add a missing label, or add a `lang` attribute. Make the change, redeploy, and run Lighthouse again.

Know these three measurements:

| Metric | What it measures |
| --- | --- |
| Largest Contentful Paint (LCP) | How long until the biggest thing on screen appears |
| Cumulative Layout Shift (CLS) | How much the page jumps around as it loads |
| Total Blocking Time (TBT) | How long scripts froze the page and ignored clicks |

Scores move from run to run, because your network, your machine, and the server all vary. Run it three times and read the trend, not one number. A test on `localhost` hides network costs a visitor pays. If you did not deploy lesson 27, test the production build instead: `npx vite build lessons/26-testing-the-stack/project`, then `npx vite preview lessons/26-testing-the-stack/project`, and test the preview URL. Say that in `diagnosis.md`.

Record the scores, the three metrics, two opportunities, and your before and after in `diagnosis.md`. No test checks this part. Your reviewer reads it.

## Exercises

Open each file in `exercises/`, read the comment at the top, and fix the bug. Each bug has a test file. Read the tests too: they are the exact spec.

1. `01-indexes.sql` holds the fix for the slow open-loans query, checked by `01-slow-query.test.js`.
2. `02-dates.js` holds the timezone bug in `dueDate`, checked by `02-dates.test.js` in four timezones.
3. `03-app.js` holds the unhandled rejection in `POST /api/loans/:id/return`, checked by `03-app.test.js`.
4. `diagnosis.md` is where you record the evidence, root cause, and fix for each bug, plus your Lighthouse results. The reviewer reads it.

Run `npm test 28` after each fix. When every test passes and `diagnosis.md` is filled in, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Deploy the sample app the way you deployed the library app in lesson 27, return loan 20001 on the live URL, and find the crash in your host's logs.
- Make the index smaller with a partial index (`WHERE returned_at IS NULL`). Does the plan still use it? What question would stop it from being used?
- Add `unhandledRejection` logging to `server.js` and compare what you see with and without it.
- Write a test that fails for a bug in `daysOverdue` that happens only when `asOf` is a `Date` and not a string.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/28-debugging-production
git commit -m "Complete lesson 28 exercises"
git push -u origin lesson-28
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- `diagnosis.md` has pasted evidence (plans, traces, scores), not only descriptions
- Each root cause names the exact line or method, not "a timezone problem"
- The fixes are small: one index, a swap to UTC methods, one `.catch`. Nothing unrelated changed.
- The Lighthouse section reports a before and after, and notes that the runs varied
- The prevention ideas are specific enough to act on
