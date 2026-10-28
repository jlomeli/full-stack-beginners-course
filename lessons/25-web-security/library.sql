-- The library database for this lesson. The tests load it into a fresh in-memory database for every test.
-- server.js loads it the same way.

CREATE TABLE members (
	id serial PRIMARY KEY,
	name text NOT NULL,
	email text NOT NULL UNIQUE
);

CREATE TABLE books (
	id serial PRIMARY KEY,
	title text NOT NULL,
	author text NOT NULL,
	year integer NOT NULL
);

CREATE TABLE loans (
	id serial PRIMARY KEY,
	book_id integer NOT NULL REFERENCES books (id),
	member_id integer NOT NULL REFERENCES members (id),
	borrowed_at timestamptz NOT NULL DEFAULT now(),
	returned_at timestamptz
);

CREATE TABLE reviews (
	id serial PRIMARY KEY,
	book_id integer NOT NULL REFERENCES books (id),
	member_id integer NOT NULL REFERENCES members (id),
	body text NOT NULL
);

INSERT INTO members (name, email) VALUES
	('Ada Lovelace', 'ada@example.com'),
	('Grace Hopper', 'grace@example.com');

INSERT INTO books (title, author, year) VALUES
	('Kindred', 'Octavia E. Butler', 1979),
	('The Left Hand of Darkness', 'Ursula K. Le Guin', 1969),
	('Beloved', 'Toni Morrison', 1987),
	('A Wrinkle in Time', 'Madeleine L''Engle', 1962);

-- Ada has Kindred. Grace has The Left Hand of Darkness.
INSERT INTO loans (book_id, member_id) VALUES (1, 1), (2, 2);
