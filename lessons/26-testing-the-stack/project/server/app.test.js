import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { createApp } from './app.js';

const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');

let db;
let app;

beforeAll(async () => {
	db = new PGlite();
	await db.exec(schema);
});

afterAll(() => db.close());

beforeEach(async () => {
	await db.exec('TRUNCATE loans, books, members RESTART IDENTITY CASCADE');
	app = createApp(db);
});

async function addBookRow(title, author = 'Anonymous', year = 2000) {
	const { rows } = await db.query('INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING id', [title, author, year]);
	return rows[0].id;
}

async function logIn(email = 'ada@example.com') {
	const agent = request.agent(app);
	const res = await agent.post('/api/signup').send({ name: 'Ada Lovelace', email, password: 'correct-horse' });
	expect(res.status, 'sign-up should work, it is provided for you').toBe(201);
	return agent;
}

describe('GET /api/books', () => {
	test('responds 200 with an empty array when the library has no books', async () => {
		const res = await request(app).get('/api/books');
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});

	test('lists books ordered by title with id, title, author, and year', async () => {
		await addBookRow('Kindred', 'Octavia E. Butler', 1979);
		await addBookRow('Beloved', 'Toni Morrison', 1987);
		const res = await request(app).get('/api/books');
		expect(res.body.map((book) => book.title)).toEqual(['Beloved', 'Kindred']);
		expect(res.body[1]).toMatchObject({ id: 1, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
	});

	test('marks a book that was never borrowed as available', async () => {
		await addBookRow('Kindred');
		const res = await request(app).get('/api/books');
		expect(res.body[0].available).toBe(true);
	});

	test('marks a book with an open loan as not available', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn();
		await ada.post('/api/loans').send({ bookId });
		const res = await request(app).get('/api/books');
		expect(res.body[0].available).toBe(false);
	});

	test('marks a book as available again after its loan is returned', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn();
		const loan = await ada.post('/api/loans').send({ bookId });
		await ada.post(`/api/loans/${loan.body.id}/return`);
		const res = await request(app).get('/api/books');
		expect(res.body[0].available).toBe(true);
	});

	test('with ?available=true lists only the books that can be borrowed', async () => {
		const kindredId = await addBookRow('Kindred');
		await addBookRow('Beloved');
		const ada = await logIn();
		await ada.post('/api/loans').send({ bookId: kindredId });
		const res = await request(app).get('/api/books?available=true');
		expect(res.body.map((book) => book.title)).toEqual(['Beloved']);
	});
});

describe('POST /api/books', () => {
	const kindred = { title: 'Kindred', author: 'Octavia E. Butler', year: 1979 };

	test('responds 401 when nobody is logged in', async () => {
		const res = await request(app).post('/api/books').send(kindred);
		expect(res.status).toBe(401);
		expect(res.body.error).toEqual(expect.any(String));
	});

	test('responds 201 with the new book, which starts out available', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/books').send(kindred);
		expect(res.status).toBe(201);
		expect(res.body).toEqual({ id: expect.any(Number), ...kindred, available: true });
	});

	test('saves the book so it appears in the list', async () => {
		const ada = await logIn();
		await ada.post('/api/books').send(kindred);
		const res = await request(app).get('/api/books');
		expect(res.body.map((book) => book.title)).toEqual(['Kindred']);
	});

	test('responds 400 with a message and saves nothing when the title is blank', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/books').send({ ...kindred, title: '   ' });
		expect(res.status).toBe(400);
		expect(res.body.error).toBe('Title is required');
		const { rows } = await db.query('SELECT count(*)::int AS count FROM books');
		expect(rows[0].count).toBe(0);
	});

	test('responds 400 when the year is not a whole number', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/books').send({ ...kindred, year: '1979' });
		expect(res.status).toBe(400);
		expect(res.body.error).toEqual(expect.any(String));
	});

	test('responds 400 when the year is in the future', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/books').send({ ...kindred, year: new Date().getFullYear() + 1 });
		expect(res.status).toBe(400);
		expect(res.body.error).toBe('Year cannot be in the future');
	});
});

describe('POST /api/loans', () => {
	test('responds 401 when nobody is logged in', async () => {
		const bookId = await addBookRow('Kindred');
		const res = await request(app).post('/api/loans').send({ bookId });
		expect(res.status).toBe(401);
	});

	test('responds 201 with a loan for the logged-in member that is not returned yet', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn();
		const me = await ada.get('/api/me');
		const res = await ada.post('/api/loans').send({ bookId });
		expect(res.status).toBe(201);
		expect(res.body).toEqual({
			id: expect.any(Number),
			bookId,
			memberId: me.body.id,
			borrowedAt: expect.any(String),
			returnedAt: null,
		});
	});

	test('responds 409 when the book is already on loan to someone', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn('ada@example.com');
		const grace = await logIn('grace@example.com');
		await ada.post('/api/loans').send({ bookId });
		const res = await grace.post('/api/loans').send({ bookId });
		expect(res.status).toBe(409);
		expect(res.body.error).toEqual(expect.any(String));
	});

	test('responds 404 when no book has that id', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/loans').send({ bookId: 999 });
		expect(res.status).toBe(404);
	});

	test('responds 400 when bookId is missing', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/loans').send({});
		expect(res.status).toBe(400);
	});
});

describe('POST /api/loans/:id/return', () => {
	async function borrow(agent, bookId) {
		const res = await agent.post('/api/loans').send({ bookId });
		expect(res.status, 'borrowing must work before you can return').toBe(201);
		return res.body;
	}

	test('responds 401 when nobody is logged in', async () => {
		const res = await request(app).post('/api/loans/1/return');
		expect(res.status).toBe(401);
	});

	test('responds 200 with the loan, now with a returnedAt time', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn();
		const loan = await borrow(ada, bookId);
		const res = await ada.post(`/api/loans/${loan.id}/return`);
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ id: loan.id, bookId, returnedAt: expect.any(String) });
	});

	test('responds 403 when the loan belongs to another member', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn('ada@example.com');
		const grace = await logIn('grace@example.com');
		const loan = await borrow(ada, bookId);
		const res = await grace.post(`/api/loans/${loan.id}/return`);
		expect(res.status).toBe(403);
	});

	test('responds 409 when the loan was already returned', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn();
		const loan = await borrow(ada, bookId);
		await ada.post(`/api/loans/${loan.id}/return`);
		const res = await ada.post(`/api/loans/${loan.id}/return`);
		expect(res.status).toBe(409);
	});

	test('responds 404 when no loan has that id', async () => {
		const ada = await logIn();
		const res = await ada.post('/api/loans/999/return');
		expect(res.status).toBe(404);
	});

	test('lets the next member borrow the book once it is returned', async () => {
		const bookId = await addBookRow('Kindred');
		const ada = await logIn('ada@example.com');
		const grace = await logIn('grace@example.com');
		const loan = await borrow(ada, bookId);
		await ada.post(`/api/loans/${loan.id}/return`);
		const res = await grace.post('/api/loans').send({ bookId });
		expect(res.status).toBe(201);
	});
});
