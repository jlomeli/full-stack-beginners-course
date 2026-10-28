# 16. Data modeling and migrations

In this lesson you design the database for a library app, then build it with four numbered migration files. Tests try to put bad data into your tables, and your constraints must push back.

## What you will be able to do

- Model one-to-many and many-to-many relationships
- Write and run migrations
- Choose constraints that block bad data

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-16
```

Run the tests for this lesson:

```sh
npm test 16
```

You see 16 failing tests. Your job this lesson is to make them pass, and to fill in `exercises/01-design.md`.

## The library app

Your library lends books to members. The database remembers three kinds of thing:

- A **book** has a title, an author, and a publication year.
- A **member** has a name and an email address.
- A **loan** records that one member borrowed one book, when they borrowed it, and when they brought it back.

A book is available when no loan for it is still open. A loan is open while its `returned_at` is empty.

Lesson 15 gave you a finished database. This lesson you decide what the tables look like.

## Tables, rows, and keys

Give each kind of thing its own table. Give each table a **primary key**, a column whose value identifies one row and never repeats. This course uses `id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY`, which makes the database number the rows for you.

A **foreign key** is a column that holds the primary key of a row in another table. It is how one row points at another:

```sql
CREATE TABLE authors (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL
);

CREATE TABLE novels (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	title text NOT NULL,
	author_id integer NOT NULL REFERENCES authors (id)
);
```

`REFERENCES authors (id)` tells the database that every `author_id` must match a real row in `authors`. The database now refuses a novel by author 999 when no author 999 exists.

## One-to-many

One author writes many novels, and each novel has one author. That is a **one-to-many** relationship. The foreign key lives on the "many" side: `novels.author_id`. Each novel stores one author id, so a novel can have only one author.

Ask yourself this to find the foreign key: "Does one X have many Y?" If so, put `x_id` on Y.

## Many-to-many

Now let a novel have several authors. An author still writes many novels, and a novel now has many authors. That is a **many-to-many** relationship.

You cannot store it with one foreign key. A single `author_id` column holds one author. A column that holds a list breaks the rules of a relational database: you cannot join on it, and you cannot make the database check it.

The fix is a third table, a **junction table**, with one row per pairing:

```sql
CREATE TABLE novel_authors (
	novel_id integer NOT NULL REFERENCES novels (id),
	author_id integer NOT NULL REFERENCES authors (id),
	PRIMARY KEY (novel_id, author_id)
);
```

The primary key spans two columns, so the same pairing cannot appear twice. A many-to-many relationship is always two one-to-many relationships joined at a junction table.

### The library has one

Look at books and members. A member borrows many books. A book is borrowed by many members over the years. That is many-to-many, so the library needs a junction table. That table is `loans`.

A `loans` row has two foreign keys, `book_id` and `member_id`. It also has columns that describe the pairing itself: `borrowed_at` and `returned_at`. A junction table often carries data like this, and it is the reason `loans` is a table you design, not a hidden detail.

Notice that `loans` does not use the two foreign keys as its primary key, as `novel_authors` does. The same member can borrow the same book twice. Each borrowing needs its own row, so `loans` gets its own `id`.

## Constraints

A **constraint** is a rule the database enforces on every insert and update, no matter which program sends it. Your Node code will have bugs. A constraint in the database is the last line of defense.

| Constraint | What it blocks | Example |
| --- | --- | --- |
| `NOT NULL` | A missing value | `title text NOT NULL` |
| `UNIQUE` | Two rows with the same value | `email text UNIQUE` |
| `CHECK (...)` | A value that breaks a condition | `CHECK (year BETWEEN 1450 AND 2100)` |
| `REFERENCES` | A foreign key that points at nothing | `book_id integer REFERENCES books (id)` |
| `DEFAULT` | Not a block, but it fills in a value | `borrowed_at timestamptz DEFAULT now()` |

Put a rule in the column definition when it concerns one column. Put it on its own line when it concerns several:

```sql
CREATE TABLE loans (
	-- ...
	borrowed_at timestamptz NOT NULL DEFAULT now(),
	returned_at timestamptz,
	CHECK (returned_at IS NULL OR returned_at >= borrowed_at)
);
```

Every `CHECK` passes when its condition is true or unknown. An empty `returned_at` makes `returned_at >= borrowed_at` unknown, so the check would pass anyway. The `IS NULL` part makes the intent explicit.

A title of `'   '` is not empty to `NOT NULL`. To block it, trim the spaces: `CHECK (btrim(title) <> '')`.

### What happens when you delete a row that others point at

Suppose book 7 has loans and someone runs `DELETE FROM books WHERE id = 7`. Those loans now point at nothing. A foreign key can say what to do:

- `ON DELETE RESTRICT` refuses the delete.
- `ON DELETE CASCADE` deletes the loans too.
- `ON DELETE SET NULL` clears `book_id` in the loans. This fails if the column is `NOT NULL`.

A loan is a historical record. For `loans`, refuse the delete with `RESTRICT`. Choose `CASCADE` when the child rows mean nothing without the parent, such as the items in a shopping cart.

### A rule about some rows

"A book can be out on only one loan at a time" is not a plain `UNIQUE (book_id)`. A book has many loans over the years. The rule applies only to loans that are still open. A **partial unique index** applies a unique rule to the rows that match a `WHERE`:

```sql
CREATE UNIQUE INDEX one_open_session_per_user ON sessions (user_id) WHERE ended_at IS NULL;
```

At most one row per `user_id` can have an empty `ended_at`. Rows with a value in `ended_at` are free to repeat. You write the library version in migration 004.

## Migrations

You will change your schema many times: add a table, add a column, tighten a rule. A running app has real data, so you cannot throw the database away and start again. A **migration** is a file that changes the schema from one version to the next. You keep the files in order and apply each one once.

Open `exercises/migrations/`. It has four files, numbered so they sort in the order to run:

```
001-create-books.sql
002-create-members.sql
003-create-loans.sql
004-one-open-loan-per-book.sql
```

`migrate.js` in this lesson's folder is a small migration runner. Read it. For a folder of `.sql` files it:

1. Creates a `schema_migrations` table that records which files are done.
2. Skips files already recorded.
3. Runs each remaining file inside a transaction, then records its name. If the file fails halfway, the transaction undoes it.

Two rules keep migrations safe:

- **Never edit a migration that has already run on a database someone else uses.** Their database would not match yours. Write a new migration, such as `005-add-books-isbn.sql`, instead.
- **One purpose per file.** A small file is quick to review and safe to undo.

For this lesson, your four files have not run anywhere yet, so you can edit them freely while you work. The tests apply them to a fresh in-memory database every time.

Real projects use a tool such as `node-pg-migrate` or Prisma Migrate. They add undo files and generate the file names, but they do the same job as `migrate.js`.

## Try your migrations

Fill in `001-create-books.sql`. Each file starts with a comment that lists the columns and rules. Replace `-- TODO` with your SQL:

```sql
CREATE TABLE books (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	title text NOT NULL
	-- more columns and rules
);
```

Then open a prompt on a fresh database that has your migrations applied:

```sh
node lessons/16-data-modeling/run.js
```

At `library=>`, type these statements. End each with `;`:

```sql
INSERT INTO books (title, author, year) VALUES ('Kindred', 'Octavia E. Butler', 1979);
SELECT * FROM books;
INSERT INTO books (title, author, year) VALUES ('Broken', 'Nobody', 1200);
```

You see the first row come back, and an `ERROR (23514)` for the third statement. `23514` is the code Postgres gives for a failed `CHECK`. Other codes you meet in this lesson:

| Code | Meaning |
| --- | --- |
| `23502` | `NOT NULL` violated |
| `23503` | Foreign key violated |
| `23505` | `UNIQUE` violated |
| `23514` | `CHECK` violated |
| `23001` | `RESTRICT` blocked a delete |

Press Ctrl+D to leave. The database was in memory, so it is gone, and the next run starts clean.

Run `npm test 16` often. Each failing test name says which rule is missing.

## Exercises

1. `exercises/01-design.md` is a written design. Answer each question in your own words. Do this first, on paper if it helps, before you write any SQL. There is no test. Your reviewer reads it.
2. `exercises/migrations/` holds four migration files. Each starts with a comment that lists what to build. Replace `-- TODO` with SQL:
   - `001-create-books.sql` creates `books`.
   - `002-create-members.sql` creates `members`.
   - `003-create-loans.sql` creates `loans`, the junction table.
   - `004-one-open-loan-per-book.sql` adds the partial unique index and an index on `loans (member_id)`.

   `exercises/migrations.test.js` applies your migrations and tries to insert bad data. Read it. It is the exact spec.

Run `npm test 16` after each file. When every test passes and your design answers are done, you're ready to submit.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Write `005-add-books-isbn.sql`. Add an optional `isbn` column to `books` with a `UNIQUE` constraint. Run `node lessons/16-data-modeling/run.js` and try to insert two books with the same isbn. Why is this a new file and not an edit to `001`?
- Make email uniqueness ignore case, so `Ada@Example.com` and `ada@example.com` count as the same member. Hint: a unique index can be built on `lower(email)`.
- A book can have several authors. Sketch the tables you would add. Which relationship is it?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/16-data-modeling
git commit -m "Complete lesson 16 exercises"
git push -u origin lesson-16
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Each design answer says why, not only what
- Foreign keys sit on the "many" side of every one-to-many relationship
- Constraints live in the database, not only in a comment
- Each migration file does one thing and is named for it
- Columns have the type that fits (`timestamptz` for moments, `integer` for ids)
