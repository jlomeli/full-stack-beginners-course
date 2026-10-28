# 17. Connecting Node to PostgreSQL

In this project lesson you connect an Express server to a real database. First you move the Notes API from an array in memory to a Postgres table. Then you build Project 3, a REST API for the library app, with validation, a transaction for borrowing a book, and tests that talk to the whole stack.

This is a three-session lesson. Plan roughly one day for each part:

1. **Session 1.** Parameterized queries, SQL injection, and exercise 1 (the Notes API).
2. **Session 2.** Transactions, and the project's data layer (`project/library.js`).
3. **Session 3.** The project's HTTP layer (`project/app.js`), validation with zod, and cleanup before review.

## What you will be able to do

- Query Postgres from Node with parameterized queries
- Explain and prevent SQL injection
- Use transactions

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-17
```

Run the tests for this lesson:

```sh
npm test 17
```

You see 55 failing tests: 13 for the Notes API, 20 for the project's data layer, and 22 for the project's HTTP routes. Your job is to make them pass.

## How Node talks to Postgres

Postgres is a separate program. It listens on a port, and your Node program connects to it and sends SQL as text. The standard library for this is the `pg` package. This is how you use it in a real project (you don't install it in this course, because the tests don't need a server):

```js
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query('SELECT id, title FROM books WHERE year > $1', [1980]);
console.log(rows); // [{ id: 2, title: 'Beloved' }, ...]
```

A **pool** keeps several connections open and hands one to each query, so you don't pay for a new connection every time. `DATABASE_URL` looks like `postgres://user:password@localhost:5432/library`. Keep it in an environment variable, never in your code.

`pool.query(sql, params)` returns a promise. It resolves to an object whose `rows` property is an array of plain objects, one per row, keyed by column name.

### Your code takes a `db`

In this lesson no Postgres server runs on your machine. The tests and `server.js` use **PGlite**, which runs real Postgres inside your Node process, in memory or in a folder. A PGlite database and a `pg` Pool have the same `query(sql, params)` method, so every function you write takes a `db` argument and calls `db.query(...)`:

```js
export async function getBook(db, id) {
	const { rows } = await db.query('SELECT id, title FROM books WHERE id = $1', [id]);
	return rows[0] ?? null;
}
```

The tests pass a PGlite database. In production you would pass the pool. The function can't tell the difference, and you change nothing. This is called **dependency injection**: the function receives what it depends on instead of creating it.

Open `db.js` in this lesson's folder and read it. It has two helpers, and it is finished:

- `applySchema(db)` creates the tables from `schema.sql`.
- `withTransaction(db, work)` runs a transaction. You meet it later in this lesson.

### Run it by hand

`server.js` starts one of this lesson's APIs on top of a PGlite database saved in a `.data` folder:

```sh
node lessons/17-node-and-postgres/server.js notes
```

You see `notes API running at http://localhost:3000`. On the starter code this is the old in-memory API, so stop it with Ctrl+C and run it again after you finish exercise 1. Create a note in a second terminal, stop the server, start it again, and list the notes:

```sh
curl -X POST localhost:3000/notes -H 'Content-Type: application/json' -d '{"title":"Buy milk"}'
curl localhost:3000/notes
```

Before exercise 1, the note disappears when the server restarts. After it, the note is still there. That is the point of a database. Delete the `.data` folder to start from scratch.

## Parameterized queries

Suppose a user searches for books. The first idea is to build the SQL with a template string:

```js
// DO NOT DO THIS
const { rows } = await db.query(`SELECT * FROM books WHERE title ILIKE '%${search}%'`);
```

It works for `search = 'beloved'`. Now search for `x' OR 'a' = 'a`. The text becomes:

```sql
SELECT * FROM books WHERE title ILIKE '%x' OR 'a' = 'a%'
```

The user wrote SQL, and the database ran it. Every book comes back. That is **SQL injection**: user input that the database reads as part of the command. A worse input is `'; DROP TABLE books; --`. It ends your query, adds a second one that deletes a table, and comments out the rest.

The cause is mixing two things that must stay apart: the command (your SQL) and the data (what the user typed). When you join them into one string, the database can't tell where one ends.

The fix is a **parameterized query**. You send the SQL with numbered placeholders, and you send the values separately:

```js
const { rows } = await db.query('SELECT * FROM books WHERE title ILIKE $1', [`%${search}%`]);
```

`$1` stands for the first value in the array, `$2` for the second, and so on. Postgres parses the SQL first, with the holes in it, and then fills the holes with values. A value can never turn into SQL, whatever characters it has. A search for `'; DROP TABLE books; --` becomes a search for a book with that odd title, and it finds nothing.

Follow two rules:

- **Every value that comes from outside goes in the parameters array.** That means anything from `req.params`, `req.query`, `req.body`, or a header, and anything you read from a file or another service.
- **Placeholders stand for values, not for names.** You can't write `FROM $1` or `ORDER BY $1`. To pick a column or table from user input, check it against a fixed list of allowed names in your code and put the allowed name in the SQL yourself.

You may build the SQL text from your own fixed pieces. `library.js` does this to add optional filters. The pieces are strings you wrote, and the values still travel as parameters:

```js
const conditions = [];
const params = [];
if (search !== undefined) {
	params.push(`%${search}%`);
	conditions.push(`title ILIKE $${params.length}`);
}
const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
await db.query(`SELECT * FROM books ${where} ORDER BY id`, params);
```

`$${params.length}` looks odd. The first `$` is a literal dollar sign, and `${params.length}` is the template-string slot. It writes `$1`, then `$2`.

The tests check this. Some run an attack string through your code and check that the table survives. Another wraps `db`, records every SQL string you send, and checks that no user input appears inside one.

## Getting good data back

Postgres columns are snake_case (`book_id`). JavaScript properties are camelCase (`bookId`). Rename them in your SQL with `AS`. Double quotes keep the capital letter:

```js
await db.query('SELECT id, book_id AS "bookId", borrowed_at AS "borrowedAt" FROM loans WHERE id = $1', [id]);
```

`INSERT`, `UPDATE`, and `DELETE` can end with `RETURNING`, which hands back the affected rows. It saves a second query:

```js
const { rows } = await db.query('INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING id, title, body', [title, body]);
const note = rows[0];
```

Some types arrive as JavaScript values you might not expect. A `timestamptz` column comes back as a `Date`, and `res.json` turns it into an ISO string. A `bigint` such as `count(*)` comes back as a string, so write `count(*)::int` when you want a number.

## Async handlers in Express 5

A query takes time, so each handler becomes `async` and uses `await`:

```js
app.get('/notes/:id', async (req, res) => {
	const { rows } = await db.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
	if (rows.length === 0) return res.status(404).json({ error: 'Note not found' });
	res.json(rows[0]);
});
```

Express 5 catches an error thrown or a promise rejected in an async handler and sends it to your error-handling middleware. You don't write `try/catch` in every route. An error handler is a function with four parameters, placed after your routes:

```js
app.use((error, req, res, next) => {
	console.error(error);
	res.status(500).json({ error: 'Internal server error' });
});
```

Log the real error on the server, where you can read it. Send the client a generic message. An error message can contain table names, connection details, and parts of your queries, which help an attacker.

One more trap: a query with the wrong type of value throws. `WHERE id = 'abc'` fails because `id` is an integer, and the result would be a 500. Check that an id looks like a number before you query, and answer 404 or 400 yourself.

## Exercise 1: move the Notes API to Postgres

Open `exercises/01-notes-api.js`. It is the Notes API from lesson 14: it works, and it keeps notes in an array. The comment at the top lists the endpoints and what to change.

Do these steps, running `npm test 17` between them:

1. Change `createApp()` to `createApp(db)`.
2. Rewrite `GET /notes/:id` to run `SELECT`. Rename `created_at` to `createdAt` in the SQL.
3. Rewrite `GET /notes`. Pass the search text as a parameter, and use `ILIKE` for a search that ignores case.
4. Rewrite `POST /notes` and `DELETE /notes/:id` with `INSERT ... RETURNING` and `DELETE ... RETURNING`.
5. Delete the array and `nextId`.

Look at the first test failures before you start. The tests put rows into the database themselves and read them back after each request. A test fails when your API still keeps notes in memory.

When the tests pass, start `server.js notes` and try the API with `curl`. Stop it, start it again, and check that your notes survived.

## Errors the database raises

Some rules are enforced by the database, not by your code. You met them in lesson 16: `UNIQUE`, `NOT NULL`, `CHECK`, foreign keys. When a query breaks one, `db.query` rejects with an error that has a `code` property:

| Code | Meaning |
| --- | --- |
| `23502` | `NOT NULL` violated |
| `23503` | Foreign key violated |
| `23505` | `UNIQUE` violated |
| `23514` | `CHECK` violated |
| `23001` | `RESTRICT` blocked a delete |

Catch the error, check its code, and turn it into something your app understands:

```js
try {
	await db.query('INSERT INTO members (name, email) VALUES ($1, $2)', [name, email]);
} catch (error) {
	if (error.code === '23505') throw new LibraryError('EMAIL_TAKEN', 'A member with that email already exists');
	throw error;
}
```

Always rethrow errors you don't recognize. Swallowing them hides real bugs.

## Transactions

Some jobs take more than one query. Moving money between two accounts takes two updates:

```js
await db.query('UPDATE accounts SET balance = balance - 50 WHERE id = $1', [from]);
await db.query('UPDATE accounts SET balance = balance + 50 WHERE id = $1', [to]);
```

If the server crashes between the lines, 50 dollars vanish. A **transaction** groups statements so they succeed or fail together:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
COMMIT;
```

`COMMIT` saves every change. `ROLLBACK` undoes every change since `BEGIN`. If an error happens halfway, you roll back and the database looks as if nothing ran. Other connections never see the half-finished state. This property is called **atomicity**, the "A" in ACID.

A transaction must run on a single connection, because `BEGIN` belongs to a connection. A Pool hands each `pool.query` call to any free connection, so for a transaction you check one out with `pool.connect()`. `withTransaction` in `db.js` hides this:

```js
const result = await withTransaction(db, async (tx) => {
	await tx.query('UPDATE accounts SET balance = balance - 50 WHERE id = $1', [from]);
	await tx.query('UPDATE accounts SET balance = balance + 50 WHERE id = $1', [to]);
	return 'moved';
});
```

It begins the transaction, calls your function with `tx`, commits if the function returns, and rolls back if it throws. The error then continues to your caller.

Two rules:

- **Inside the callback, use `tx`, never `db`.** A query on `db` runs outside the transaction. With PGlite it also waits for the transaction to finish, and your test hangs until it times out. If a test hangs, look for a `db.query` inside a `withTransaction`.
- **Throw to roll back.** Throwing a `LibraryError` inside the callback undoes everything, and the caller sees the error.

### Why borrowing a book needs one

Borrowing is check-then-act: check that the book is free, then insert the loan. Two requests can run at once:

1. Request A checks. The book has no open loan.
2. Request B checks. The book still has no open loan.
3. Request A inserts a loan.
4. Request B inserts a loan. The book is now on loan twice.

Your partial unique index from lesson 16 refuses the second insert, which is the safety net. But B would get a raw database error instead of a clear "book unavailable". A transaction with a row lock fixes the order:

```sql
SELECT id FROM books WHERE id = $1 FOR UPDATE
```

`FOR UPDATE` locks the book's row until the transaction ends. Request B's `SELECT ... FOR UPDATE` waits until A commits, and then B's check sees A's loan. The steps run one after the other for the same book, and different books don't block each other.

The comment on `borrowBook` in `project/library.js` lists the four steps. The tests start two borrows at the same moment and check that exactly one wins.

## Project 3: a REST API for the library app

You build the API for the library app: books, members, borrowing, and returning. The data comes from the tables you designed in lesson 16. `schema.sql` has a copy of them, so this lesson stands alone.

Two files hold the project:

- `project/library.js` is the **data layer**: functions that take `db`, run SQL, and return plain objects or throw a `LibraryError`. It knows nothing about HTTP.
- `project/app.js` is the **HTTP layer**: `createApp(db)` returns an Express app. It validates requests, calls the data layer, and turns results and errors into status codes and JSON.

Keeping them apart means you can test the SQL without a web server, and you can change the routes without touching the SQL. The tests do both: `library.test.js` calls the functions directly, and `app.test.js` sends HTTP requests with supertest.

### Session 2: the data layer

Open `project/library.js`. Each function has a comment with its exact behavior. Work from the short functions to the long ones, and run the tests after each one:

```sh
npx vitest run lessons/17-node-and-postgres/project/library.test.js
```

1. `createBook`, `getBook`, `listMembers`, `getMember`, `createMember`. Write the SQL for each with parameters.
2. `listBooks`. Compute `available` in SQL with `NOT EXISTS (SELECT 1 FROM loans WHERE ...)`. Add the optional `search` and `available` filters. The `available` filter can't use an alias in `WHERE`, so wrap the query: `SELECT * FROM (SELECT ... AS available ...) AS book WHERE available = $1`.
3. `deleteBook` and `createMember`. Catch the database's error and translate its `code` into a `LibraryError`.
4. `borrowBook`. Use `withTransaction` and `FOR UPDATE`.
5. `returnBook`. A single `UPDATE ... WHERE id = $1 AND returned_at IS NULL RETURNING ...` closes an open loan. When it changes no row, run a second query to tell "no such loan" from "already returned".
6. `listLoansForMember`. Join `loans` to `books` to get the title.

### Session 3: the HTTP layer

Open `project/app.js`. The comment at the top is the API spec: each route, its status codes, and its error cases. Build it from the top, and run the tests after each route:

```sh
npx vitest run lessons/17-node-and-postgres/project/app.test.js
```

#### Validate with zod

Never trust `req.body`, `req.query`, or `req.params`. They are whatever the client sent. **zod** describes the shape you expect and checks input against it:

```js
import { z } from 'zod';

const bookSchema = z.object({
	title: z.string().trim().min(1),
	author: z.string().trim().min(1),
	year: z.number().int().min(1450).max(2100),
});

const result = bookSchema.safeParse(req.body);
if (!result.success) {
	// result.error.issues is an array of problems
} else {
	// result.data is the clean, trimmed, typed value
}
```

`safeParse` never throws. It returns `{ success: true, data }` or `{ success: false, error }`. `.trim()` removes surrounding spaces from the data it returns. Each entry in `error.issues` has a `path`, such as `['year']`, and a `message`. Turn them into the response shape the spec asks for:

```js
const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
res.status(400).json({ error: 'Validation failed', details });
```

Query strings and URL parameters are always strings. `z.coerce.number()` converts a string like `'12'` to the number 12 before it checks the rest, so `z.coerce.number().int().positive()` makes a good id schema. A JSON body keeps its types, so use plain `z.number()` there and a string `"1979"` fails, as the spec requires. `z.email()` checks an email address. `z.enum(['true', 'false'])` accepts only those two strings.

Write a small helper that parses a value against a schema and throws a 400 error on failure, so each route is a few lines. The spec says what 400 looks like.

#### Turn errors into statuses

The data layer throws `LibraryError`s with a `code`, such as `BOOK_UNAVAILABLE`. Routes shouldn't each decide which status that is. Keep a lookup table in one place:

```js
const statusForCode = { BOOK_NOT_FOUND: 404, BOOK_UNAVAILABLE: 409 /* ... */ };
```

Then the error-handling middleware does the translation once: a validation error becomes a 400, a `LibraryError` becomes the status from the table, a malformed JSON body (`error.type === 'entity.parse.failed'`) becomes a 400, and anything else becomes a 500 with a generic message. The status codes mean:

| Status | Meaning here |
| --- | --- |
| 400 | The request is malformed or invalid |
| 404 | The thing you named doesn't exist |
| 409 | The request is valid, but it conflicts with the current state (email taken, book already out) |
| 500 | Our bug or an outage |

Last, after all the routes, add a handler for unknown routes that answers 404 with JSON.

#### Try it for real

Start the library API with a few books and members already in it:

```sh
node lessons/17-node-and-postgres/server.js library
```

In a second terminal:

```sh
curl localhost:3000/books
curl -X POST localhost:3000/loans -H 'Content-Type: application/json' -d '{"bookId":1,"memberId":1}'
curl 'localhost:3000/books?available=false'
curl -X POST localhost:3000/loans/1/return
curl localhost:3000/members/1/loans
```

You see the book go out, show up under `available=false`, and come back.

## Exercises

1. `exercises/01-notes-api.js` moves the Notes API from an array to the `notes` table. `exercises/01-notes-api.test.js` is the spec.
2. Project 3, the library REST API:
   - `project/library.js` is the data layer, with parameterized queries and a transaction for borrowing. `project/library.test.js` is its spec.
   - `project/app.js` is the HTTP layer, with zod validation and error handling. `project/app.test.js` is its spec.

Run `npm test 17` as you go. When every test passes, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Add `PATCH /books/:id` to correct a book's title, author, or year. Which fields should be optional? How do you build an `UPDATE` that sets only the fields that were sent, and still uses parameters?
- Add `GET /books?limit=10&offset=20` for paging. Validate both with zod and pass them as parameters.
- Break your own code on purpose. Change `listBooks` to build the SQL with a template string, run the attack test, and read the failure. Then put it back.
- Write a `server.js` for the project that uses `pg.Pool` with `process.env.DATABASE_URL`. You can't run it here, but write it and explain in your PR how you would.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/17-node-and-postgres
git commit -m "Complete lesson 17 exercises and project"
git push -u origin lesson-17
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- No value from a request is ever joined into SQL text. Every one travels as a parameter.
- The data layer has no Express code, and the routes have no SQL
- `borrowBook` uses `tx` for every query inside the transaction
- Database errors are translated by `code`, and unknown errors are rethrown
- Error responses never include a raw database error message
- Each route validates its input, and the names of invalid fields appear in the 400 response
- Status codes mean the right thing: 400, 404, and 409 are not interchangeable
- No leftover `console.log` calls
