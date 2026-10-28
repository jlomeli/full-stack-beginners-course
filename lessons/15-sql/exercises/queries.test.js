import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';

const NUMERIC = 1700;
const DATE = 1082;

let template;
let db;

beforeAll(async () => {
	template = new PGlite();
	await template.exec(readFileSync(new URL('../bookstore.sql', import.meta.url), 'utf8'));
}, 30_000);

afterAll(async () => {
	await template.close();
});

beforeEach(async () => {
	db = await template.clone();
});

afterEach(async () => {
	await db.close();
});

function toPlain(value, dataTypeID) {
	if (dataTypeID === NUMERIC && value !== null) return Number(value);
	if (dataTypeID === DATE && value !== null) return value.toISOString().slice(0, 10);
	return value;
}

async function runFile(name) {
	const sql = readFileSync(new URL(`./${name}.sql`, import.meta.url), 'utf8');
	return db.exec(sql);
}

async function rowsFrom(name) {
	const results = await runFile(name);
	const last = results.at(-1);
	if (!last || last.fields.length === 0) return [];
	return last.rows.map((row) =>
		Object.fromEntries(last.fields.map((field) => [field.name, toPlain(row[field.name], field.dataTypeID)])),
	);
}

async function select(sql, params) {
	return (await db.query(sql, params)).rows;
}

async function violation(sql, params) {
	await db.exec('BEGIN');
	try {
		await db.query(sql, params);
		return null;
	} catch (error) {
		return error.code;
	} finally {
		await db.exec('ROLLBACK');
	}
}

describe('SELECT, WHERE, and ORDER BY', () => {
	test('01-all-authors returns name and country for all nine authors, ordered by name', async () => {
		expect(await rowsFrom('01-all-authors')).toEqual([
			{ name: 'Chimamanda Ngozi Adichie', country: 'Nigeria' },
			{ name: 'Elena Ferrante', country: 'Italy' },
			{ name: 'Gabriel García Márquez', country: 'Colombia' },
			{ name: 'Haruki Murakami', country: 'Japan' },
			{ name: 'Isabel Allende', country: 'Chile' },
			{ name: 'Jhumpa Lahiri', country: 'USA' },
			{ name: 'Octavia E. Butler', country: 'USA' },
			{ name: 'Toni Morrison', country: 'USA' },
			{ name: 'Ursula K. Le Guin', country: 'USA' },
		]);
	});

	test('02-cheap-books returns the five books under 1500 cents, cheapest first', async () => {
		expect(await rowsFrom('02-cheap-books')).toEqual([
			{ title: 'A Wizard of Earthsea', price_cents: 1099 },
			{ title: 'The Left Hand of Darkness', price_cents: 1299 },
			{ title: 'The Dispossessed', price_cents: 1399 },
			{ title: 'Kafka on the Shore', price_cents: 1449 },
			{ title: 'Purple Hibiscus', price_cents: 1499 },
		]);
	});

	test('03-sci-fi-and-fantasy returns title and genre for those two genres, ordered by genre then title', async () => {
		expect(await rowsFrom('03-sci-fi-and-fantasy')).toEqual([
			{ title: 'A Wizard of Earthsea', genre: 'fantasy' },
			{ title: 'Kafka on the Shore', genre: 'fantasy' },
			{ title: 'Kindred', genre: 'sci-fi' },
			{ title: 'Parable of the Sower', genre: 'sci-fi' },
			{ title: 'The Dispossessed', genre: 'sci-fi' },
			{ title: 'The Left Hand of Darkness', genre: 'sci-fi' },
		]);
	});

	test('04-eighties returns the four books published from 1980 to 1989, ordered by year then title', async () => {
		expect(await rowsFrom('04-eighties')).toEqual([
			{ title: 'The House of the Spirits', published_year: 1982 },
			{ title: 'Love in the Time of Cholera', published_year: 1985 },
			{ title: 'Beloved', published_year: 1987 },
			{ title: 'Norwegian Wood', published_year: 1987 },
		]);
	});

	test('05-title-search returns every title containing "the" in any capitalization, ordered by title', async () => {
		expect(await rowsFrom('05-title-search')).toEqual([
			{ title: 'Kafka on the Shore' },
			{ title: 'Love in the Time of Cholera' },
			{ title: 'Parable of the Sower' },
			{ title: 'The Dispossessed' },
			{ title: 'The House of the Spirits' },
			{ title: 'The Left Hand of Darkness' },
		]);
	});

	test('06-customers-without-a-city returns name and email for customers whose city is NULL, ordered by name', async () => {
		expect(await rowsFrom('06-customers-without-a-city')).toEqual([
			{ name: 'Chen Wei', email: 'chen@example.com' },
			{ name: 'Fatima Khan', email: 'fatima@example.com' },
		]);
	});

	test('07-newest-books returns the three most recently published books, newest first', async () => {
		expect(await rowsFrom('07-newest-books')).toEqual([
			{ title: 'Americanah', published_year: 2013 },
			{ title: 'Half of a Yellow Sun', published_year: 2006 },
			{ title: 'Purple Hibiscus', published_year: 2003 },
		]);
	});

	test('08-genres returns each genre once, ordered A to Z', async () => {
		expect(await rowsFrom('08-genres')).toEqual([
			{ genre: 'fantasy' },
			{ genre: 'historical' },
			{ genre: 'literary' },
			{ genre: 'sci-fi' },
		]);
	});
});

describe('aggregates and GROUP BY', () => {
	test('09-stock-summary returns one row with book_count 15 and units_in_stock 79', async () => {
		expect(await rowsFrom('09-stock-summary')).toEqual([{ book_count: 15, units_in_stock: 79 }]);
	});

	test('10-books-per-genre counts the books in each genre, biggest genre first', async () => {
		expect(await rowsFrom('10-books-per-genre')).toEqual([
			{ genre: 'literary', book_count: 7 },
			{ genre: 'sci-fi', book_count: 4 },
			{ genre: 'fantasy', book_count: 2 },
			{ genre: 'historical', book_count: 2 },
		]);
	});
});

describe('JOIN', () => {
	test('11-books-with-authors returns all fifteen titles with their author names, ordered by title', async () => {
		const rows = await rowsFrom('11-books-with-authors');
		expect(rows).toHaveLength(15);
		expect(rows.slice(0, 3)).toEqual([
			{ title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin' },
			{ title: 'Americanah', author: 'Chimamanda Ngozi Adichie' },
			{ title: 'Beloved', author: 'Toni Morrison' },
		]);
		expect(rows.at(-1)).toEqual({ title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin' });
		expect(rows.map((row) => row.title)).toEqual(rows.map((row) => row.title).sort());
	});

	test('12-prolific-authors returns only the authors with more than two books', async () => {
		expect(await rowsFrom('12-prolific-authors')).toEqual([
			{ name: 'Chimamanda Ngozi Adichie', book_count: 3 },
			{ name: 'Ursula K. Le Guin', book_count: 3 },
		]);
	});

	test('13-orders-per-customer counts orders per customer and keeps customers with zero orders', async () => {
		expect(await rowsFrom('13-orders-per-customer')).toEqual([
			{ name: 'Ana Torres', order_count: 3 },
			{ name: 'Ben Okafor', order_count: 2 },
			{ name: 'Chen Wei', order_count: 1 },
			{ name: 'Dana Smith', order_count: 1 },
			{ name: 'Eli Cohen', order_count: 1 },
			{ name: 'Fatima Khan', order_count: 0 },
		]);
	});

	test('14-never-ordered returns the four books that appear in no order', async () => {
		expect(await rowsFrom('14-never-ordered')).toEqual([
			{ title: 'Kafka on the Shore' },
			{ title: 'Love in the Time of Cholera' },
			{ title: 'Song of Solomon' },
			{ title: 'The House of the Spirits' },
		]);
	});

	test('15-order-totals returns price times quantity summed for each of the eight orders', async () => {
		expect(await rowsFrom('15-order-totals')).toEqual([
			{ order_id: 1, total_cents: 3797 },
			{ order_id: 2, total_cents: 1899 },
			{ order_id: 3, total_cents: 5696 },
			{ order_id: 4, total_cents: 3798 },
			{ order_id: 5, total_cents: 3298 },
			{ order_id: 6, total_cents: 5197 },
			{ order_id: 7, total_cents: 3297 },
			{ order_id: 8, total_cents: 1599 },
		]);
	});

	test('16-top-spenders returns the three customers who spent the most, biggest first', async () => {
		expect(await rowsFrom('16-top-spenders')).toEqual([
			{ name: 'Ana Torres', total_cents: 11092 },
			{ name: 'Ben Okafor', total_cents: 7096 },
			{ name: 'Chen Wei', total_cents: 3798 },
		]);
	});
});

describe('CREATE TABLE, INSERT, UPDATE, and DELETE', () => {
	test('17-create-reviews creates a reviews table that accepts good rows and blocks bad ones', async () => {
		await runFile('17-create-reviews');

		const columns = await select(
			`SELECT column_name, is_nullable FROM information_schema.columns
			 WHERE table_name = 'reviews' ORDER BY column_name`,
		);
		expect(columns).toEqual([
			{ column_name: 'book_id', is_nullable: 'NO' },
			{ column_name: 'comment', is_nullable: 'YES' },
			{ column_name: 'customer_id', is_nullable: 'NO' },
			{ column_name: 'id', is_nullable: 'NO' },
			{ column_name: 'rating', is_nullable: 'NO' },
		]);

		const saved = await select('INSERT INTO reviews (book_id, customer_id, rating) VALUES (1, 1, 5) RETURNING id, comment');
		expect(saved).toEqual([{ id: 1, comment: null }]);

		expect(await violation('INSERT INTO reviews (book_id, customer_id, rating) VALUES (1, 1, 6)')).toBe('23514');
		expect(await violation('INSERT INTO reviews (book_id, customer_id, rating) VALUES (1, 1, 0)')).toBe('23514');
		expect(await violation('INSERT INTO reviews (book_id, customer_id, rating) VALUES (999, 1, 4)')).toBe('23503');
		expect(await violation('INSERT INTO reviews (book_id, customer_id, rating) VALUES (1, 999, 4)')).toBe('23503');
		expect(await violation('INSERT INTO reviews (book_id, customer_id) VALUES (1, 1)')).toBe('23502');
		expect(await violation('INSERT INTO reviews (id, book_id, customer_id, rating) VALUES (50, 1, 1, 4)')).toBe('428C9');
	});

	test('18-add-a-book adds Nnedi Okorafor and her book Binti, linked by author_id', async () => {
		await runFile('18-add-a-book');

		expect(await select(`SELECT name, country FROM authors WHERE name = 'Nnedi Okorafor'`)).toEqual([
			{ name: 'Nnedi Okorafor', country: 'Nigeria' },
		]);
		expect(
			await select(
				`SELECT books.title, authors.name AS author, books.genre, books.published_year, books.price_cents, books.stock
				 FROM books JOIN authors ON authors.id = books.author_id
				 WHERE books.title = 'Binti'`,
			),
		).toEqual([
			{ title: 'Binti', author: 'Nnedi Okorafor', genre: 'sci-fi', published_year: 2015, price_cents: 1199, stock: 6 },
		]);
		expect(await select('SELECT count(*)::int AS n FROM authors')).toEqual([{ n: 10 }]);
		expect(await select('SELECT count(*)::int AS n FROM books')).toEqual([{ n: 16 }]);
	});

	test('19-restock sets stock to 10 for the three sold-out books and leaves every other book alone', async () => {
		await runFile('19-restock');

		expect(await select('SELECT title, stock FROM books ORDER BY id')).toEqual([
			{ title: 'Kindred', stock: 12 },
			{ title: 'Parable of the Sower', stock: 10 },
			{ title: 'One Hundred Years of Solitude', stock: 7 },
			{ title: 'Love in the Time of Cholera', stock: 3 },
			{ title: 'Half of a Yellow Sun', stock: 5 },
			{ title: 'Americanah', stock: 9 },
			{ title: 'Norwegian Wood', stock: 4 },
			{ title: 'Kafka on the Shore', stock: 10 },
			{ title: 'A Wizard of Earthsea', stock: 15 },
			{ title: 'The Left Hand of Darkness', stock: 6 },
			{ title: 'The Dispossessed', stock: 2 },
			{ title: 'Beloved', stock: 8 },
			{ title: 'Song of Solomon', stock: 10 },
			{ title: 'The House of the Spirits', stock: 5 },
			{ title: 'Purple Hibiscus', stock: 3 },
		]);
	});

	test('20-remove-idle-customers deletes only Fatima Khan and leaves all eight orders', async () => {
		await runFile('20-remove-idle-customers');

		expect(await select('SELECT name FROM customers ORDER BY id')).toEqual([
			{ name: 'Ana Torres' },
			{ name: 'Ben Okafor' },
			{ name: 'Chen Wei' },
			{ name: 'Dana Smith' },
			{ name: 'Eli Cohen' },
		]);
		expect(await select('SELECT count(*)::int AS n FROM orders')).toEqual([{ n: 8 }]);
	});
});
