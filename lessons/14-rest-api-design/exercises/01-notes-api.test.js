import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, createMemoryStore } from './01-notes-api.js';

let app;
beforeEach(() => {
	app = createApp();
});

afterEach(() => {
	vi.restoreAllMocks();
});

const jsonError = (message, details) => (details ? { error: message, details } : { error: message });
const problem = (field) => ({ field, message: expect.any(String) });

function createNote(note) {
	return request(app).post('/notes').send(note);
}

function fieldsOf(res) {
	return res.body.details.map((detail) => detail.field).sort();
}

describe('POST /notes validation', () => {
	test('rejects a note with no title: 400 and a details entry for title', async () => {
		const res = await createNote({ body: 'No title here' });
		expect(res.status).toBe(400);
		expect(res.headers['content-type']).toMatch(/application\/json/);
		expect(res.body).toEqual(jsonError('Validation failed', [problem('title')]));
	});

	test('rejects a title that is only spaces', async () => {
		const res = await createNote({ title: '   ', body: 'x' });
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Validation failed', [problem('title')]));
	});

	test('rejects a title that is not a string', async () => {
		const res = await createNote({ title: 42, body: 'x' });
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Validation failed', [problem('title')]));
	});

	test('rejects a title longer than 100 characters, and accepts exactly 100', async () => {
		const tooLong = await createNote({ title: 'a'.repeat(101) });
		expect(tooLong.status).toBe(400);
		expect(tooLong.body).toEqual(jsonError('Validation failed', [problem('title')]));

		const longest = await createNote({ title: 'a'.repeat(100) });
		expect(longest.status).toBe(201);
	});

	test('rejects a body that is not a string', async () => {
		const res = await createNote({ title: 'Groceries', body: 123 });
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Validation failed', [problem('body')]));
	});

	test('rejects a body longer than 1000 characters', async () => {
		const res = await createNote({ title: 'Groceries', body: 'a'.repeat(1001) });
		expect(res.status).toBe(400);
		expect(fieldsOf(res)).toEqual(['body']);
	});

	test('reports every problem at once, not just the first', async () => {
		const res = await createNote({ title: '', body: 5 });
		expect(res.status).toBe(400);
		expect(fieldsOf(res)).toEqual(['body', 'title']);
	});

	test('does not create a note when validation fails', async () => {
		await createNote({ body: 'No title here' });
		const res = await request(app).get('/notes');
		expect(res.body).toEqual([]);
	});

	test('answers 400 with a details entry for the whole body when the request is not JSON', async () => {
		const res = await request(app).post('/notes').type('text').send('title=Groceries');
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Validation failed', [problem('')]));
	});
});

describe('POST /notes cleaning', () => {
	test('trims the spaces off the title', async () => {
		const res = await createNote({ title: '  Groceries  ', body: 'Milk' });
		expect(res.status).toBe(201);
		expect(res.body.title).toBe('Groceries');
	});

	test('fills in an empty body when the client leaves it out', async () => {
		const res = await createNote({ title: 'Groceries' });
		expect(res.status).toBe(201);
		expect(res.body.body).toBe('');
	});

	test('drops fields the client has no business sending, such as id and createdAt', async () => {
		const res = await createNote({ title: 'Groceries', body: 'Milk', id: 99, createdAt: '2000-01-01T00:00:00.000Z', admin: true });
		expect(res.status).toBe(201);
		expect(res.body).toEqual({ id: 1, title: 'Groceries', body: 'Milk', createdAt: expect.any(String) });
		expect(res.body.createdAt).not.toBe('2000-01-01T00:00:00.000Z');
	});
});

describe('PUT /notes/:id validation and cleaning', () => {
	test('rejects an invalid replacement with the same 400 shape as POST', async () => {
		const created = await createNote({ title: 'Groceries', body: 'Milk' });
		const res = await request(app).put(`/notes/${created.body.id}`).send({ title: '', body: 5 });
		expect(res.status).toBe(400);
		expect(res.body.error).toBe('Validation failed');
		expect(fieldsOf(res)).toEqual(['body', 'title']);
	});

	test('keeps the old note when the replacement is invalid', async () => {
		const created = await createNote({ title: 'Groceries', body: 'Milk' });
		await request(app).put(`/notes/${created.body.id}`).send({ body: 'No title' });
		const res = await request(app).get(`/notes/${created.body.id}`);
		expect(res.body).toEqual(created.body);
	});

	test('replaces the whole note: a body left out becomes an empty string', async () => {
		const created = await createNote({ title: 'Groceries', body: 'Milk' });
		const res = await request(app).put(`/notes/${created.body.id}`).send({ title: '  Shopping ' });
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ ...created.body, title: 'Shopping', body: '' });
	});

	test('drops extra fields, so the client cannot change what it does not own', async () => {
		const created = await createNote({ title: 'Groceries', body: 'Milk' });
		const res = await request(app).put(`/notes/${created.body.id}`).send({ title: 'Shopping', body: 'Tea', admin: true });
		expect(res.body).toEqual({ ...created.body, title: 'Shopping', body: 'Tea' });
	});
});

describe('note ids in the URL', () => {
	test.each(['abc', '0', '-1', '1.5', '1e3', '007'])('GET /notes/%s answers 400 { error: "Invalid note id" }', async (id) => {
		const res = await request(app).get(`/notes/${id}`);
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Invalid note id'));
	});

	test('PUT with an invalid id answers 400 { error: "Invalid note id" }', async () => {
		const res = await request(app).put('/notes/abc').send({ title: 'Shopping', body: 'Tea' });
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Invalid note id'));
	});

	test('DELETE with an invalid id answers 400 { error: "Invalid note id" }', async () => {
		const res = await request(app).delete('/notes/abc');
		expect(res.status).toBe(400);
		expect(res.body).toEqual(jsonError('Invalid note id'));
	});
});

describe('errors that are not about one route', () => {
	test('answers an unknown URL with 404 and a JSON error', async () => {
		const res = await request(app).get('/nope');
		expect(res.status).toBe(404);
		expect(res.headers['content-type']).toMatch(/application\/json/);
		expect(res.body).toEqual(jsonError('Route not found'));
	});

	test('answers an unknown URL with the same 404 for every method', async () => {
		const res = await request(app).post('/notes/1/comments').send({});
		expect(res.status).toBe(404);
		expect(res.body).toEqual(jsonError('Route not found'));
	});

	test('answers malformed JSON with 400 and a JSON error', async () => {
		const res = await request(app).post('/notes').set('Content-Type', 'application/json').send('{"title": "Groceries"');
		expect(res.status).toBe(400);
		expect(res.headers['content-type']).toMatch(/application\/json/);
		expect(res.body).toEqual(jsonError('Request body is not valid JSON'));
	});

	test('answers a body over the size limit with 413 and a JSON error', async () => {
		const res = await createNote({ title: 'Groceries', body: 'a'.repeat(200_000) });
		expect(res.status).toBe(413);
		expect(res.body).toEqual(jsonError('Request body is too large'));
	});
});

describe('unexpected failures', () => {
	function appWithBrokenStore(method) {
		const store = createMemoryStore();
		store[method] = async () => {
			throw new Error('connection to the database was lost');
		};
		return createApp({ store });
	}

	test('answers 500 with a generic JSON error when the store rejects', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await request(appWithBrokenStore('list')).get('/notes');
		expect(res.status).toBe(500);
		expect(res.headers['content-type']).toMatch(/application\/json/);
		expect(res.body).toEqual(jsonError('Internal server error'));
	});

	test('does not leak the error message or a stack trace to the client', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await request(appWithBrokenStore('create')).post('/notes').send({ title: 'Groceries' });
		expect(res.status).toBe(500);
		expect(res.text).not.toContain('database');
		expect(res.text).not.toContain('node_modules');
		expect(res.body).toEqual(jsonError('Internal server error'));
	});

	test('logs the error with console.error so you can find it later', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		await request(appWithBrokenStore('get')).get('/notes/1');
		expect(consoleError).toHaveBeenCalled();
	});
});
