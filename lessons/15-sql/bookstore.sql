-- The bookstore database for lesson 15.
-- run.js and the tests load this file into a fresh in-memory database every time,
-- so nothing you change while practicing sticks around.

CREATE TABLE authors (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL,
	country text NOT NULL
);

CREATE TABLE books (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	title text NOT NULL,
	author_id integer NOT NULL REFERENCES authors (id),
	genre text NOT NULL,
	published_year integer NOT NULL,
	price_cents integer NOT NULL,
	stock integer NOT NULL
);

CREATE TABLE customers (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	name text NOT NULL,
	email text NOT NULL UNIQUE,
	city text
);

CREATE TABLE orders (
	id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	customer_id integer NOT NULL REFERENCES customers (id),
	ordered_on date NOT NULL
);

CREATE TABLE order_items (
	order_id integer NOT NULL REFERENCES orders (id),
	book_id integer NOT NULL REFERENCES books (id),
	quantity integer NOT NULL,
	PRIMARY KEY (order_id, book_id)
);

INSERT INTO authors (name, country) VALUES
	('Octavia E. Butler', 'USA'),
	('Gabriel García Márquez', 'Colombia'),
	('Chimamanda Ngozi Adichie', 'Nigeria'),
	('Haruki Murakami', 'Japan'),
	('Ursula K. Le Guin', 'USA'),
	('Toni Morrison', 'USA'),
	('Isabel Allende', 'Chile'),
	('Elena Ferrante', 'Italy'),
	('Jhumpa Lahiri', 'USA');

INSERT INTO books (title, author_id, genre, published_year, price_cents, stock) VALUES
	('Kindred', 1, 'sci-fi', 1979, 1599, 12),
	('Parable of the Sower', 1, 'sci-fi', 1993, 1699, 0),
	('One Hundred Years of Solitude', 2, 'literary', 1967, 1899, 7),
	('Love in the Time of Cholera', 2, 'literary', 1985, 1699, 3),
	('Half of a Yellow Sun', 3, 'historical', 2006, 1799, 5),
	('Americanah', 3, 'literary', 2013, 1899, 9),
	('Norwegian Wood', 4, 'literary', 1987, 1599, 4),
	('Kafka on the Shore', 4, 'fantasy', 2002, 1449, 0),
	('A Wizard of Earthsea', 5, 'fantasy', 1968, 1099, 15),
	('The Left Hand of Darkness', 5, 'sci-fi', 1969, 1299, 6),
	('The Dispossessed', 5, 'sci-fi', 1974, 1399, 2),
	('Beloved', 6, 'literary', 1987, 1699, 8),
	('Song of Solomon', 6, 'literary', 1977, 1599, 0),
	('The House of the Spirits', 7, 'historical', 1982, 1799, 5),
	('Purple Hibiscus', 3, 'literary', 2003, 1499, 3);

INSERT INTO customers (name, email, city) VALUES
	('Ana Torres', 'ana@example.com', 'Austin'),
	('Ben Okafor', 'ben@example.com', 'Chicago'),
	('Chen Wei', 'chen@example.com', NULL),
	('Dana Smith', 'dana@example.com', 'Austin'),
	('Eli Cohen', 'eli@example.com', 'Denver'),
	('Fatima Khan', 'fatima@example.com', NULL);

INSERT INTO orders (customer_id, ordered_on) VALUES
	(1, '2026-01-05'),
	(2, '2026-01-12'),
	(1, '2026-02-03'),
	(3, '2026-02-14'),
	(4, '2026-03-01'),
	(2, '2026-03-09'),
	(5, '2026-03-15'),
	(1, '2026-03-28');

INSERT INTO order_items (order_id, book_id, quantity) VALUES
	(1, 1, 1),
	(1, 9, 2),
	(2, 3, 1),
	(3, 10, 2),
	(3, 11, 1),
	(3, 2, 1),
	(4, 6, 2),
	(5, 1, 1),
	(5, 12, 1),
	(6, 5, 1),
	(6, 6, 1),
	(6, 15, 1),
	(7, 9, 3),
	(8, 7, 1);
