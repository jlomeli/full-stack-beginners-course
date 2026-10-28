-- The library database. Tests, server/dev.js, and your deployed database all load this file.
CREATE TABLE books (
	id SERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	year INTEGER NOT NULL
);

CREATE TABLE members (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL
);

CREATE TABLE loans (
	id SERIAL PRIMARY KEY,
	book_id INTEGER NOT NULL REFERENCES books (id),
	member_id INTEGER NOT NULL REFERENCES members (id),
	borrowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	returned_at TIMESTAMPTZ
);

-- A book can have at most one open loan. The database enforces it even if two requests race.
CREATE UNIQUE INDEX one_open_loan_per_book ON loans (book_id) WHERE returned_at IS NULL;
