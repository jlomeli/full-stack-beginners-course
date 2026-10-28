-- The library database for the sample app. Tests, server.js, and the diagnosis all load this file. Do not edit it.
CREATE TABLE books (
	id SERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	year INTEGER NOT NULL
);

CREATE TABLE members (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE
);

CREATE TABLE loans (
	id SERIAL PRIMARY KEY,
	book_id INTEGER NOT NULL REFERENCES books (id),
	member_id INTEGER NOT NULL REFERENCES members (id),
	borrowed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	returned_at TIMESTAMPTZ
);
