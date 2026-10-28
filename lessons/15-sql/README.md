# 15. SQL with PostgreSQL

In this lesson you answer twenty questions about a bookstore by writing SQL queries. You start with `SELECT` and finish by creating a table and changing rows.

## What you will be able to do

- Create tables and insert, update, and delete rows
- Query with WHERE, ORDER BY, GROUP BY, and JOIN
- Explain primary keys and foreign keys

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-15
```

Run the tests for this lesson:

```sh
npm test 15
```

You see 20 failing tests, one for each challenge. Each test loads a fresh copy of the bookstore database, runs the `.sql` file for its challenge, and compares the rows your query returns with the rows it expects.

## What a database is

Most apps keep their data in a **relational database**. A relational database stores data in **tables**. A table is a grid. Each **column** has a name and a type, and each **row** is one record. The `authors` table in this lesson looks like this:

| id | name | country |
| --- | --- | --- |
| 1 | Octavia E. Butler | USA |
| 2 | Gabriel García Márquez | Colombia |
| 3 | Chimamanda Ngozi Adichie | Nigeria |

**PostgreSQL** (say "post-gres") is the database this course uses. You talk to it in **SQL**, a language made for asking questions about tables. SQL keywords are not case sensitive, but this course writes them in capitals so you can spot them.

## Practice database

You don't need to install anything. `lessons/15-sql/run.js` starts PostgreSQL inside Node.js using a package called PGlite, loads the bookstore from `bookstore.sql`, and runs your SQL. Every run starts from a fresh copy, so you can't break anything.

Run SQL you type:

```sh
node lessons/15-sql/run.js "SELECT * FROM authors LIMIT 3;"
```

You see a table of results:

```
┌─────────┬────┬────────────────────────────┬────────────┐
│ (index) │ id │ name                       │ country    │
├─────────┼────┼────────────────────────────┼────────────┤
│ 0       │ 1  │ 'Octavia E. Butler'        │ 'USA'      │
│ 1       │ 2  │ 'Gabriel García Márquez'   │ 'Colombia' │
│ 2       │ 3  │ 'Chimamanda Ngozi Adichie' │ 'Nigeria'  │
└─────────┴────┴────────────────────────────┴────────────┘
(3 rows)
```

Run a file:

```sh
node lessons/15-sql/run.js lessons/15-sql/exercises/01-all-authors.sql
```

Open a prompt where you type statements one at a time. End every statement with `;`, and press Ctrl+D to quit:

```sh
node lessons/15-sql/run.js
```

The bookstore has five tables:

| Table | Columns |
| --- | --- |
| `authors` | `id`, `name`, `country` |
| `books` | `id`, `title`, `author_id`, `genre`, `published_year`, `price_cents`, `stock` |
| `customers` | `id`, `name`, `email`, `city` |
| `orders` | `id`, `customer_id`, `ordered_on` |
| `order_items` | `order_id`, `book_id`, `quantity` |

Prices are whole numbers of cents (`1599` means $15.99). Money in floating-point numbers drifts by fractions of a cent, so databases and payment APIs store integers.

Open `bookstore.sql` and read it once. It is the `CREATE TABLE` and `INSERT` statements that build this database, and you write statements like these by the end of the lesson.

## Reading rows with SELECT

`SELECT` picks columns and `FROM` names the table:

```sql
SELECT name, country FROM authors;
```

`*` means every column:

```sql
SELECT * FROM authors;
```

Name the columns you need. `SELECT *` is fine for exploring, but real code should ask for what it uses.

Try it. Run the two queries above with `run.js`.

### WHERE filters rows

```sql
SELECT title, price_cents FROM books WHERE genre = 'fantasy';
```

```
┌─────────┬────────────────────────┬─────────────┐
│ (index) │ title                  │ price_cents │
├─────────┼────────────────────────┼─────────────┤
│ 0       │ 'Kafka on the Shore'   │ 1449        │
│ 1       │ 'A Wizard of Earthsea' │ 1099        │
└─────────┴────────────────────────┴─────────────┘
(2 rows)
```

Strings go in single quotes. Double quotes mean something else in SQL: they quote a column or table name.

SQL compares with `=` (one equals sign), `<>` (not equal), `<`, `<=`, `>`, and `>=`. Combine tests with `AND`, `OR`, and `NOT`. Three shortcuts save typing:

```sql
WHERE genre IN ('sci-fi', 'fantasy')           -- one of several values
WHERE published_year BETWEEN 1980 AND 1989     -- inclusive on both ends
WHERE title ILIKE '%war%'                      -- pattern match, ignoring case
```

In a `LIKE` or `ILIKE` pattern, `%` matches any run of characters and `_` matches exactly one.

### NULL means "no value"

A column that holds no value holds `NULL`. Two customers have no city. `NULL` is not equal to anything, not even to `NULL`, so this query returns nothing:

```sql
SELECT name FROM customers WHERE city = NULL;
```

Ask with `IS NULL` instead:

```sql
SELECT name, city FROM customers WHERE city IS NULL;
```

```
┌─────────┬───────────────┬──────┐
│ (index) │ name          │ city │
├─────────┼───────────────┼──────┤
│ 0       │ 'Chen Wei'    │ null │
│ 1       │ 'Fatima Khan' │ null │
└─────────┴───────────────┴──────┘
(2 rows)
```

Use `IS NOT NULL` for the opposite.

### ORDER BY, LIMIT, and DISTINCT

A query returns rows in no promised order. Add `ORDER BY` when order matters. It sorts ascending unless you add `DESC`, and it accepts several columns:

```sql
SELECT title, genre, price_cents
FROM books
ORDER BY genre, price_cents DESC;
```

`LIMIT` keeps only the first rows after sorting. The three most expensive books:

```sql
SELECT title, price_cents FROM books ORDER BY price_cents DESC LIMIT 3;
```

`DISTINCT` removes repeated rows:

```sql
SELECT DISTINCT country FROM authors;
```

Do challenges 01 to 08 now. Run `npm test 15` to see them pass one by one.

## Summarizing with aggregates

An **aggregate function** turns many rows into one value: `count`, `sum`, `avg`, `min`, and `max`.

```sql
SELECT count(*) AS book_count, max(price_cents) AS highest_price FROM books;
```

`AS` gives a column a name of your choosing. Tests read your results by those names, so use the names each challenge asks for.

`GROUP BY` makes one group per value and runs the aggregate on each group:

```sql
SELECT genre, count(*) AS book_count
FROM books
GROUP BY genre
ORDER BY genre;
```

```
┌─────────┬──────────────┬────────────┐
│ (index) │ genre        │ book_count │
├─────────┼──────────────┼────────────┤
│ 0       │ 'fantasy'    │ 2          │
│ 1       │ 'historical' │ 2          │
│ 2       │ 'literary'   │ 7          │
│ 3       │ 'sci-fi'     │ 4          │
└─────────┴──────────────┴────────────┘
(4 rows)
```

Every column in the `SELECT` list must either appear in `GROUP BY` or sit inside an aggregate. PostgreSQL refuses the query otherwise.

`WHERE` filters rows before they are grouped. To filter groups by their aggregate, use `HAVING`:

```sql
SELECT genre, count(*) AS book_count
FROM books
GROUP BY genre
HAVING count(*) > 2;
```

Do challenges 09 and 10.

One more detail. `avg` returns a decimal such as `1602.3333333333333333`. Wrap it in `round(avg(price_cents))` when you want a whole number.

## Primary keys and foreign keys

Look at the first lines of `bookstore.sql`:

```sql
CREATE TABLE authors (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL,
	country text NOT NULL
);
```

A **primary key** is the column that identifies a row. No two rows share a primary key value, and it is never `NULL`. `GENERATED ALWAYS AS IDENTITY` makes the database hand out the numbers 1, 2, 3, and so on, so you never choose an `id` yourself.

The `books` table connects to authors like this:

```sql
author_id integer NOT NULL REFERENCES authors (id),
```

A **foreign key** is a column that holds the primary key of a row in another table. Here every book stores the `id` of its author. `REFERENCES authors (id)` makes the database enforce the link. Try to delete an author who still has books:

```sh
node lessons/15-sql/run.js "DELETE FROM authors WHERE id = 1;"
```

```
ERROR: update or delete on table "authors" violates foreign key constraint "books_author_id_fkey" on table "books"
```

The database refuses, because the delete would leave books pointing at an author that doesn't exist. That protection is the reason to use foreign keys.

Why keep authors in their own table? Each author's name is stored once. Fix a typo in one row and every book shows the fix. Lesson 16 goes deeper on this.

The `order_items` table has a primary key made of two columns, `(order_id, book_id)`. It lists the books on each order, and one book can appear once per order.

## JOIN puts tables back together

To list each book with its author's name, join the tables on the key that links them:

```sql
SELECT books.title, authors.name
FROM books
JOIN authors ON authors.id = books.author_id
WHERE authors.country = 'Colombia';
```

```
┌─────────┬─────────────────────────────────┬──────────────────────────┐
│ (index) │ title                           │ name                     │
├─────────┼─────────────────────────────────┼──────────────────────────┤
│ 0       │ 'One Hundred Years of Solitude' │ 'Gabriel García Márquez' │
│ 1       │ 'Love in the Time of Cholera'   │ 'Gabriel García Márquez' │
└─────────┴─────────────────────────────────┴──────────────────────────┘
(2 rows)
```

`ON` says which rows pair up: a book pairs with the author whose `id` equals the book's `author_id`. Write `table.column` whenever two tables share a column name, such as `id`.

A plain `JOIN` (also called `INNER JOIN`) keeps only rows that have a match on both sides. An author with no books disappears from the result. A `LEFT JOIN` keeps every row from the left table and fills the right side with `NULL` when nothing matches:

```sql
SELECT authors.name, books.title
FROM authors
LEFT JOIN books ON books.author_id = authors.id
ORDER BY authors.name;
```

Elena Ferrante and Jhumpa Lahiri have no books, so they show up with a `null` title. This also finds rows with no match. Add `WHERE books.id IS NULL` and you get only the authors without books.

You can chain joins. This walks from customers to their orders to the books on those orders:

```sql
SELECT customers.name, books.title, order_items.quantity
FROM customers
JOIN orders ON orders.customer_id = customers.id
JOIN order_items ON order_items.order_id = orders.id
JOIN books ON books.id = order_items.book_id;
```

Joins and `GROUP BY` work together. To count with a join, group by the table you are counting for:

```sql
SELECT authors.name, count(books.id) AS book_count
FROM authors
LEFT JOIN books ON books.author_id = authors.id
GROUP BY authors.id, authors.name;
```

`count(books.id)` counts only rows where `books.id` isn't `NULL`, so an author with no books gets 0. `count(*)` would count the one `NULL`-filled row and report 1. Challenge 13 needs this.

Do challenges 11 to 16.

## Changing data

So far you only read. Four statements change the database.

### CREATE TABLE

```sql
CREATE TABLE publishers (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL UNIQUE,
	founded_year integer CHECK (founded_year > 1400)
);
```

Each column has a name, a type, and optional rules called **constraints**:

- `NOT NULL` rejects rows that leave the column empty.
- `UNIQUE` rejects a second row with the same value.
- `CHECK (...)` rejects rows that fail the test.
- `REFERENCES table (column)` makes a foreign key.

Common types are `integer`, `text`, `boolean`, `date`, and `timestamptz` (a moment in time with its time zone).

### INSERT

```sql
INSERT INTO authors (name, country)
VALUES ('Octavia Butler', 'USA'), ('N. K. Jemisin', 'USA');
```

List the columns you fill, then one parenthesized group of values per row. Leave out `id`. The database generates it. Add `RETURNING id, name` to the end and the statement shows you the rows it created, with their new ids.

To fill a foreign key without typing a number, look the number up with a **subquery**, a `SELECT` inside parentheses:

```sql
INSERT INTO books (title, author_id, genre, published_year, price_cents, stock)
VALUES ('Fledgling', (SELECT id FROM authors WHERE name = 'Octavia Butler'), 'sci-fi', 2005, 1599, 4);
```

### UPDATE

```sql
UPDATE books SET price_cents = 999 WHERE id = 1;
```

`SET` lists the new values. `WHERE` picks the rows. The right side of `SET` can use the current value: `SET stock = stock + 5`.

**Always write the `WHERE`.** `UPDATE books SET price_cents = 999;` changes every book. Before you run an `UPDATE` or `DELETE`, write the same `WHERE` in a `SELECT` and read the rows it finds.

### DELETE

```sql
DELETE FROM customers WHERE id = 6;
```

The same rule applies: no `WHERE` means every row. Foreign keys protect you here. You can't delete a customer who still has orders, because those orders would point at nobody.

Do challenges 17 to 20.

## Exercises

Each challenge is a `.sql` file in `exercises/`. The comment at the top states the question and the columns your result needs. Write your SQL under the comment. The test file `queries.test.js` shows exactly how each answer is checked.

For `SELECT` challenges, the test compares the rows your last statement returns. Use the column names the challenge gives, and sort the rows the way it asks. For the change challenges (17 to 20), the test runs your file and then looks at the database.

| Challenge | Practice |
| --- | --- |
| `01-all-authors.sql` | SELECT, ORDER BY |
| `02-cheap-books.sql` | WHERE with a comparison |
| `03-sci-fi-and-fantasy.sql` | IN, ordering by two columns |
| `04-eighties.sql` | BETWEEN |
| `05-title-search.sql` | ILIKE pattern |
| `06-customers-without-a-city.sql` | IS NULL |
| `07-newest-books.sql` | ORDER BY DESC, LIMIT |
| `08-genres.sql` | DISTINCT |
| `09-stock-summary.sql` | count and sum |
| `10-books-per-genre.sql` | GROUP BY |
| `11-books-with-authors.sql` | JOIN |
| `12-prolific-authors.sql` | JOIN, GROUP BY, HAVING |
| `13-orders-per-customer.sql` | LEFT JOIN, count |
| `14-never-ordered.sql` | LEFT JOIN to find missing matches |
| `15-order-totals.sql` | A join across three tables, sum |
| `16-top-spenders.sql` | Four tables, sum, LIMIT |
| `17-create-reviews.sql` | CREATE TABLE with constraints |
| `18-add-a-book.sql` | INSERT, subquery |
| `19-restock.sql` | UPDATE |
| `20-remove-idle-customers.sql` | DELETE with a subquery |

Try a challenge with `run.js` before you run the tests. You see your rows right away, so you can compare them with the question.

### Stretch goals

These don't have tests. Add them to your PR description if you try them.

- Write challenge 14 a second way, with `WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE ...)`. Which version is easier to read?
- Find the customer who has bought the most books in total, counting quantities.
- Run `EXPLAIN SELECT * FROM books WHERE genre = 'fantasy';` and read the output. What do you think `Seq Scan` means?

### Optional: use real PostgreSQL

PGlite runs real PostgreSQL code, so everything in this lesson works the same in a full install. If you want the real thing, install PostgreSQL 17 (`brew install postgresql@17` on macOS, or the installer from postgresql.org on Windows), then:

```sh
createdb bookstore
psql bookstore -f lessons/15-sql/bookstore.sql
psql bookstore
```

`\dt` lists tables, `\d books` describes one, and `\q` quits. Your installed server may sort text differently from PGlite (for example, where `A Wizard of Earthsea` lands among the titles). The tests run on PGlite, so check your answers with `npm test 15`.

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/15-sql
git commit -m "Complete lesson 15 exercises"
git push -u origin lesson-15
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things beyond passing tests:

- Keywords in capitals and one clause per line, so a long query reads top to bottom
- Column names listed out instead of `SELECT *`
- `table.column` names wherever two tables are joined
- An `UPDATE` or `DELETE` that has a `WHERE`, and that you checked with a `SELECT` first
- The right join: a `LEFT JOIN` where rows without a match must stay in the result
