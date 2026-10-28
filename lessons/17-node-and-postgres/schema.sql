-- The tables for lesson 17: the notes table for exercise 1 and the library tables for the project.
-- The library tables are the result of lesson 16. This copy keeps lesson 17 self-contained.
-- Every statement uses IF NOT EXISTS, so running this file again is safe.

CREATE TABLE IF NOT EXISTS notes (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	title text NOT NULL CHECK (btrim(title) <> ''),
	body text NOT NULL DEFAULT '',
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	title text NOT NULL CHECK (btrim(title) <> ''),
	author text NOT NULL CHECK (btrim(author) <> ''),
	year integer NOT NULL CHECK (year BETWEEN 1450 AND 2100)
);

CREATE TABLE IF NOT EXISTS members (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL CHECK (btrim(name) <> ''),
	email text NOT NULL UNIQUE CHECK (email LIKE '%@%')
);

CREATE TABLE IF NOT EXISTS loans (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	book_id integer NOT NULL REFERENCES books (id) ON DELETE RESTRICT,
	member_id integer NOT NULL REFERENCES members (id) ON DELETE RESTRICT,
	borrowed_at timestamptz NOT NULL DEFAULT now(),
	returned_at timestamptz,
	CHECK (returned_at IS NULL OR returned_at >= borrowed_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_open_loan_per_book ON loans (book_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS loans_member_id_idx ON loans (member_id);
