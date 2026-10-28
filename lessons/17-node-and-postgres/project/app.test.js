import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { applySchema } from '../db.js';
import { createApp } from './app.js';

let template;
let db;
let app;

beforeAll(async () => {
	template = new PGlite();
	await applySchema(template);
}, 30_000);

afterAll(async () => {
	await template.close();
});

beforeEach(async () => {
	db = await template.clone();
	app = createApp(db);
});

afterEach(async () => {
	await db.close();
	vi.restoreAllMocks();
});

async function insertBook(title = 'Kindred', author = 'Octavia E. Butler', year = 1979) {
	const { rows } = await db.query('INSERT INTO books (title, author, year) VALUES ($1, $2, $3) RETURNING id', [title, author, year]);
	return rows[0].id;
}

async function insertMember(name = 'Ada Lovelace', email = 'ada@example.com') {
	const { rows } = await db.query('INSERT INTO members (name, email) VALUES ($1, $2) RETURNING id', [name, email]);
	return rows[0].id;
}

async function insertLoan(bookId, memberId, returned = false) {
	const { rows } = await db.query('INSERT INTO loans (book_id, member_id, returned_at) VALUES ($1, $2, CASE WHEN $3 THEN now() END) RETURNING id', [bookId, memberId, returned]);
	return rows[0].id;
}

async function count(table) {
	const { rows } = await db.query(`SELECT count(*)::int AS total FROM ${table}`);
	return rows[0].total;
}

const fieldsOf = (res) => res.body.details.map((detail) => detail.field).sort();
const errorBody = { error: expect.any(String) };

function expectValidationFailure(res, fields) {
	expect(res.status).toBe(400);
	expect(res.body).toEqual({ error: 'Validation failed', details: fields.map((field) => ({ field, message: expect.any(String) })) });
}

describe('books', () => {
	test('POST /books saves a book and answers 201 with it as JSON, and GET /books/:id returns it', async () => {
		const created = await request(app).post('/books').send({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 });
		expect(created.status).toBe(201);
		expect(created.headers['content-type']).toMatch(/application\/json/);
		expect(created.body).toEqual({ id: expect.any(Number), title: 'Kindred', author: 'Octavia E. Butler', year: 1979, available: true });

		const fetched = await request(app).get(`/books/${created.body.id}`);
		expect(fetched.status).toBe(200);
		expect(fetched.body).toEqual(created.body);
	});

	test('POST /books saves the title and author with spaces trimmed off', async () => {
		const created = await request(app).post('/books').send({ title: '  Kindred  ', author: ' Octavia E. Butler ', year: 1979 });
		expect(created.status).toBe(201);
		expect(created.body).toMatchObject({ title: 'Kindred', author: 'Octavia E. Butler' });
	});

	test('POST /books names every bad field in a 400 and saves nothing more', async () => {
		const valid = { title: 'Kindred', author: 'Octavia E. Butler', year: 1979 };
		expect((await request(app).post('/books').send(valid)).status).toBe(201);

		expectValidationFailure(await request(app).post('/books').send({ ...valid, title: undefined }), ['title']);
		expectValidationFailure(await request(app).post('/books').send({ ...valid, author: '   ' }), ['author']);
		expectValidationFailure(await request(app).post('/books').send({ ...valid, year: '1979' }), ['year']);
		expectValidationFailure(await request(app).post('/books').send({ ...valid, year: 1200 }), ['year']);
		expectValidationFailure(await request(app).post('/books').send({ ...valid, year: 1979.5 }), ['year']);
		const several = await request(app).post('/books').send({ title: '', author: 5, year: 'x' });
		expect(several.status).toBe(400);
		expect(fieldsOf(several)).toEqual(['author', 'title', 'year']);
		expect(await count('books')).toBe(1);
	});

	test('POST /books with no body, or a body that is not JSON, is a 400 with an error message', async () => {
		expect((await request(app).post('/books').send({ title: 'Kindred', author: 'Octavia E. Butler', year: 1979 })).status).toBe(201);
		const empty = await request(app).post('/books');
		expect(empty.status).toBe(400);
		expect(empty.body).toEqual(expect.objectContaining(errorBody));
		const broken = await request(app).post('/books').set('Content-Type', 'application/json').send('{"title": ');
		expect(broken.status).toBe(400);
		expect(broken.body).toEqual(errorBody);
	});

	test('GET /books lists the books with their availability', async () => {
		const free = await insertBook('Kindred');
		const out = await insertBook('Beloved', 'Toni Morrison', 1987);
		await insertLoan(out, await insertMember());
		const res = await request(app).get('/books');
		expect(res.status).toBe(200);
		expect(res.body.map((book) => [book.id, book.available])).toEqual([
			[free, true],
			[out, false],
		]);
	});

	test('GET /books?available= keeps available books or books that are out, and rejects other values', async () => {
		const free = await insertBook('Kindred');
		const out = await insertBook('Beloved', 'Toni Morrison', 1987);
		await insertLoan(out, await insertMember());
		expect((await request(app).get('/books?available=true')).body.map((book) => book.id)).toEqual([free]);
		expect((await request(app).get('/books?available=false')).body.map((book) => book.id)).toEqual([out]);
		expectValidationFailure(await request(app).get('/books?available=maybe'), ['available']);
	});

	test('GET /books?search= matches title or author, ignoring case, even when the text has a quote or SQL in it', async () => {
		await insertBook("Ender's Game", 'Orson Scott Card', 1985);
		await insertBook('Beloved', 'Toni Morrison', 1987);
		expect((await request(app).get('/books').query({ search: 'morrison' })).body.map((book) => book.title)).toEqual(['Beloved']);
		expect((await request(app).get('/books').query({ search: "Ender's" })).body.map((book) => book.title)).toEqual(["Ender's Game"]);
		const attack = await request(app).get('/books').query({ search: "'; DROP TABLE books; --" });
		expect(attack.status).toBe(200);
		expect(attack.body).toEqual([]);
		expect(await count('books')).toBe(2);
	});

	test('GET /books/:id is 404 for a missing book and 400 for an id that is not a positive whole number', async () => {
		const id = await insertBook();
		expect((await request(app).get(`/books/${id}`)).status).toBe(200);
		const missing = await request(app).get(`/books/${id + 100}`);
		expect(missing.status).toBe(404);
		expect(missing.body).toEqual(errorBody);
		for (const bad of ['abc', '0', '-3', '1.5']) {
			const res = await request(app).get(`/books/${bad}`);
			expect(res.status, bad).toBe(400);
			expect(res.body, bad).toEqual(expect.objectContaining(errorBody));
		}
	});

	test('DELETE /books/:id is 204 and removes the book, 404 when missing, and 409 when the book has loans', async () => {
		const unused = await insertBook('Unused');
		const lent = await insertBook('Kindred');
		await insertLoan(lent, await insertMember());

		const deleted = await request(app).delete(`/books/${unused}`);
		expect(deleted.status).toBe(204);
		expect(deleted.text).toBe('');
		const again = await request(app).delete(`/books/${unused}`);
		expect(again.status).toBe(404);
		expect(again.body).toEqual(errorBody);
		const blocked = await request(app).delete(`/books/${lent}`);
		expect(blocked.status).toBe(409);
		expect(blocked.body).toEqual(errorBody);
		expect(await count('books')).toBe(1);
	});
});

describe('members', () => {
	test('POST /members saves a member and answers 201, and GET /members lists members', async () => {
		const created = await request(app).post('/members').send({ name: 'Ada Lovelace', email: 'ada@example.com' });
		expect(created.status).toBe(201);
		expect(created.body).toEqual({ id: expect.any(Number), name: 'Ada Lovelace', email: 'ada@example.com' });
		await insertMember('Grace Hopper', 'grace@example.com');
		const listed = await request(app).get('/members');
		expect(listed.status).toBe(200);
		expect(listed.body.map((member) => member.name)).toEqual(['Ada Lovelace', 'Grace Hopper']);
	});

	test('POST /members names every bad field in a 400', async () => {
		expect((await request(app).post('/members').send({ name: 'Ada Lovelace', email: 'ada@example.com' })).status).toBe(201);
		expectValidationFailure(await request(app).post('/members').send({ name: 'Grace Hopper', email: 'not-an-email' }), ['email']);
		expectValidationFailure(await request(app).post('/members').send({ name: '  ', email: 'grace@example.com' }), ['name']);
		expectValidationFailure(await request(app).post('/members').send({ email: 'grace@example.com' }), ['name']);
		const both = await request(app).post('/members').send({ name: 7 });
		expect(fieldsOf(both)).toEqual(['email', 'name']);
		expect(await count('members')).toBe(1);
	});

	test('POST /members with an email that is taken is a 409', async () => {
		await insertMember('Ada Lovelace', 'ada@example.com');
		const res = await request(app).post('/members').send({ name: 'Imposter', email: 'ada@example.com' });
		expect(res.status).toBe(409);
		expect(res.body).toEqual(errorBody);
		expect(await count('members')).toBe(1);
	});

	test("GET /members/:id/loans lists the member's loans newest first with titles, and ?active=true keeps open ones", async () => {
		const memberId = await insertMember();
		const kindred = await insertBook('Kindred');
		const beloved = await insertBook('Beloved', 'Toni Morrison', 1987);
		const old = await insertLoan(kindred, memberId, true);
		const recent = await insertLoan(beloved, memberId);

		const all = await request(app).get(`/members/${memberId}/loans`);
		expect(all.status).toBe(200);
		expect(all.body.map((loan) => [loan.id, loan.title])).toEqual([
			[recent, 'Beloved'],
			[old, 'Kindred'],
		]);
		expect(all.body[0]).toEqual({ id: recent, bookId: beloved, memberId, borrowedAt: expect.any(String), returnedAt: null, title: 'Beloved' });
		const open = await request(app).get(`/members/${memberId}/loans?active=true`);
		expect(open.body.map((loan) => loan.id)).toEqual([recent]);
	});

	test('GET /members/:id/loans is 404 for a missing member and 400 for a bad id', async () => {
		const memberId = await insertMember();
		expect((await request(app).get(`/members/${memberId}/loans`)).status).toBe(200);
		const missing = await request(app).get(`/members/${memberId + 100}/loans`);
		expect(missing.status).toBe(404);
		expect(missing.body).toEqual(errorBody);
		expect((await request(app).get('/members/abc/loans')).status).toBe(400);
	});
});

describe('loans', () => {
	test('POST /loans lends the book: 201 with the loan, and the book is no longer available', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const res = await request(app).post('/loans').send({ bookId, memberId });
		expect(res.status).toBe(201);
		expect(res.body).toEqual({ id: expect.any(Number), bookId, memberId, borrowedAt: expect.any(String), returnedAt: null });
		expect((await request(app).get(`/books/${bookId}`)).body.available).toBe(false);
	});

	test('POST /loans names every bad field in a 400 and creates no loan', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		expect((await request(app).post('/loans').send({ bookId, memberId })).status).toBe(201);
		expectValidationFailure(await request(app).post('/loans').send({ bookId: String(bookId), memberId }), ['bookId']);
		expectValidationFailure(await request(app).post('/loans').send({ bookId }), ['memberId']);
		expectValidationFailure(await request(app).post('/loans').send({ bookId: 0, memberId: -1 }), ['bookId', 'memberId']);
		expect(await count('loans')).toBe(1);
	});

	test('POST /loans is 404 when the book or the member does not exist', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const other = await insertBook('Beloved', 'Toni Morrison', 1987);
		expect((await request(app).post('/loans').send({ bookId, memberId })).status).toBe(201);
		const noBook = await request(app).post('/loans').send({ bookId: other + 100, memberId });
		expect(noBook.status).toBe(404);
		expect(noBook.body).toEqual(errorBody);
		const noMember = await request(app).post('/loans').send({ bookId: other, memberId: memberId + 100 });
		expect(noMember.status).toBe(404);
		expect(noMember.body).toEqual(errorBody);
		expect(await count('loans')).toBe(1);
	});

	test('POST /loans is 409 when the book is already out', async () => {
		const bookId = await insertBook();
		const first = await insertMember();
		const second = await insertMember('Grace Hopper', 'grace@example.com');
		expect((await request(app).post('/loans').send({ bookId, memberId: first })).status).toBe(201);
		const res = await request(app).post('/loans').send({ bookId, memberId: second });
		expect(res.status).toBe(409);
		expect(res.body).toEqual(errorBody);
		expect(await count('loans')).toBe(1);
	});

	test('POST /loans/:id/return answers 200 with the closed loan and the book is available again', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const loan = (await request(app).post('/loans').send({ bookId, memberId })).body;
		const res = await request(app).post(`/loans/${loan.id}/return`);
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ id: loan.id, bookId, memberId, returnedAt: expect.any(String) });
		expect((await request(app).get(`/books/${bookId}`)).body.available).toBe(true);
	});

	test('POST /loans/:id/return is 404 for a missing loan, 409 when already returned, and 400 for a bad id', async () => {
		const bookId = await insertBook();
		const memberId = await insertMember();
		const loan = (await request(app).post('/loans').send({ bookId, memberId })).body;
		expect((await request(app).post(`/loans/${loan.id}/return`)).status).toBe(200);
		const again = await request(app).post(`/loans/${loan.id}/return`);
		expect(again.status).toBe(409);
		expect(again.body).toEqual(errorBody);
		const missing = await request(app).post(`/loans/${loan.id + 100}/return`);
		expect(missing.status).toBe(404);
		expect(missing.body).toEqual(errorBody);
		expect((await request(app).post('/loans/abc/return')).status).toBe(400);
	});
});

describe('everything else', () => {
	test('a route that does not exist is a JSON 404', async () => {
		await insertBook();
		expect((await request(app).get('/books')).status).toBe(200);
		const res = await request(app).get('/shelves');
		expect(res.status).toBe(404);
		expect(res.headers['content-type']).toMatch(/application\/json/);
		expect(res.body).toEqual(errorBody);
	});

	test('a failing database is a 500 that does not leak the error message', async () => {
		const broken = {
			query: async () => {
				throw new Error('connection to 10.0.0.5 refused');
			},
		};
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await request(createApp(broken)).get('/books');
		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: 'Internal server error' });
	});
});
