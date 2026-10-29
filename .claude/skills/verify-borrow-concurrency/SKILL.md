---
name: verify-borrow-concurrency
description: Exhaustively checks that lesson 17's borrowBook (the library REST API, Project 3) never lets one book have two open loans and never leaks a raw unique-index error, across every interleaving of concurrent borrow and return requests under PostgreSQL READ COMMITTED. Use when you change borrowBook or returnBook in the reference solution, lesson 17's schema.sql or db.js (withTransaction), the lesson 17 starter spec for borrowBook, or when reviewing a student's lesson 17 PR for race conditions.
---

# Verify borrow concurrency

**Property.** For any number of simultaneous `POST /loans` requests for the same book, with returns happening at any time:

- **OneOpenLoanPerBook:** a book never has two open loans (`returned_at IS NULL`). If this breaks, two members are told they have the same physical book.
- **NoRawUniqueViolation:** no borrow fails with Postgres error `23505` from the `one_open_loan_per_book` index. `borrowBook` doesn't translate that error, so the client gets a 500 instead of the 409 "That book is already on loan".
- **NoStuckRequest:** no state exists where a borrow is unfinished and nothing can move.

Lesson 17's README teaches the fix: `withTransaction` plus `SELECT ... FOR UPDATE`. The unit tests run on one PGlite connection, so they can't produce the race. This check covers what they can't.

## Run it

From the course repo root:

```sh
node .claude/skills/verify-borrow-concurrency/check.mjs                         # the reference solution
node .claude/skills/verify-borrow-concurrency/check.mjs path/to/student/library.js   # a student's lesson 17 project
BORROWERS=4 RETURNS=3 node .claude/skills/verify-borrow-concurrency/check.mjs   # larger bounds
```

It needs only Node, with no other install, and takes well under a second. Exit codes:

- `0`, `PASS`: all three properties hold in every interleaving.
- `1`, `FAIL`: the shortest sequence of SQL statements that breaks a property, written as requests `A`, `B`, ... and the statements they run.
- `2`, `OUT OF SYNC`: `borrowBook` no longer has the shape the model assumes. That is not a pass. Read the message, then update the model (see below).

## How it works

`check.mjs` reads `borrowBook` from the given `library.js` and derives three facts from the real code. It prints them as `Derived: ...` with the line numbers of each query.

- `transaction`: `borrowBook` calls `withTransaction` and runs every query through `tx`.
- `row lock`: the books `SELECT` has `FOR UPDATE`.
- `partial unique index`: lesson 17's `schema.sql` has `CREATE UNIQUE INDEX ... ON loans (book_id) WHERE returned_at IS NULL`.

`model.mjs` then explores every interleaving of N borrows and up to R returns of one book. Each SQL statement is one atomic step, which is how READ COMMITTED behaves: each statement sees the data committed before it starts. The model encodes these Postgres rules:

- `FOR UPDATE` blocks other lockers until the holder's transaction ends.
- An `INSERT` that would collide with another transaction's uncommitted row in a unique index waits for that transaction.
- An `INSERT` that collides with a committed row fails with `23505`.
- `returnBook`'s autocommit `UPDATE` sees only committed loans.

Read a `FAIL` trace step by step against the printed line numbers. For example, with `FOR UPDATE` removed: A checks and finds no loan, A inserts, B checks and finds no loan because A hasn't committed, A commits, then B's insert hits the index and returns a 500.

## Is a failure a real bug or a modeling error?

- If the `Derived:` line matches what the code does, the trace is a real race. Report it in the code's terms with the trace. Don't weaken a property or the model to make it pass, and don't edit the solution unless the user asks.
- If `Derived:` is wrong, for example the lock lives in a helper the regex doesn't see, fix the extraction in `check.mjs` so it reads the code correctly. Then rerun.

## Scope and limits

- Covered: one book at a time. Different books never share a row lock or an index key, so they can't interact. Up to 3 borrows and 2 returns by default, with 107 states. 4 and 3 also pass, with 446 states.
- Assumed: READ COMMITTED (Postgres's default, and what `withTransaction`'s plain `BEGIN` gets). Each statement is atomic.
- Left out: the member lookup, which reads only `members`; `returnBook` returning the same loan twice, which its `AND returned_at IS NULL` guard handles and which this property doesn't depend on; `deleteBook`; and any isolation level other than READ COMMITTED.
- Out of sync, exit 2: `borrowBook` mixing `tx.query` and `db.query`, more than four queries, the insert before the check, or no `borrowBook` at all. The lesson 17 starter is a TODO, so it reports exit 2 until the student writes the function.

## Coverage record

| Check | Covers |
| --- | --- |
| model.mjs, check.mjs | `borrowBook` and `returnBook` in `full-stack-beginners-course-solutions/lessons/17-node-and-postgres/project/library.js` |
| | `withTransaction` in `lessons/17-node-and-postgres/db.js` |
| | `one_open_loan_per_book` and the `loans` table in `lessons/17-node-and-postgres/schema.sql` |
| | The borrowBook spec comment in `lessons/17-node-and-postgres/project/library.js` (the starter) |

**Last confirmed in sync:** course repo `b04a1ac`, solutions repo `67223e2`.

When any covered file changes after those commits, re-read it against the model's header comment in `model.mjs` before trusting a PASS. Move the commits above forward only after you've confirmed that the model still describes the code at the new commits.

## Proof that it can fail

These breaks were checked when the skill was written. Each change was made to the real solution file, or to a copy, and then reverted.

| Scratch change | Result |
| --- | --- |
| Remove `FOR UPDATE` from the solution | `FAIL NoRawUniqueViolation`, 7 steps, exit 1 |
| Remove `FOR UPDATE` and the partial index | `FAIL OneOpenLoanPerBook`: two committed loans, exit 1 |
| Run every query on `db`, with no transaction | `FAIL NoRawUniqueViolation`, exit 1 |
| Move only the `INSERT` to `db` | `OUT OF SYNC`, exit 2 |
| Restore the solution | `PASS`, exit 0 |

After any change to `model.mjs`, repeat the first row. A check you haven't seen fail proves nothing.
