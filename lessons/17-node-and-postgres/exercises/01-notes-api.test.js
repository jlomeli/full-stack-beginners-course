import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { applySchema } from '../db.js';
import { createApp } from './01-notes-api.js';

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
});

async function seed(title, body = '') {
	const { rows } = await db.query('INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING id', [title, body]);
	return rows[0].id;
}

async function countNotes() {
	const { rows } = await db.query('SELECT count(*)::int AS total FROM notes');
	return rows[0].total;
}

describe('reading notes', () => {
	test('GET /notes lists the notes stored in the database, oldest first', async () => {
		const first = await seed('Buy milk', 'Two litres');
		const second = await seed('Call Ada');
		const res = await request(app).get('/notes');
		expect(res.status).toBe(200);
		expect(res.body.map((note) => note.id)).toEqual([first, second]);
		expect(res.body[0]).toEqual({ id: first, title: 'Buy milk', body: 'Two litres', createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) });
	});

	test('GET /notes/:id returns one note from the database', async () => {
		const id = await seed('Buy milk', 'Two litres');
		const res = await request(app).get(`/notes/${id}`);
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ id, title: 'Buy milk', body: 'Two litres' });
	});

	test('GET /notes/:id is a 404 with an error message for a missing note and for an id that is not a number', async () => {
		const id = await seed('Buy milk');
		expect((await request(app).get(`/notes/${id}`)).status).toBe(200);
		const missing = await request(app).get(`/notes/${id + 100}`);
		expect(missing.status).toBe(404);
		expect(missing.body).toEqual({ error: expect.any(String) });
		const notANumber = await request(app).get('/notes/abc');
		expect(notANumber.status).toBe(404);
		expect(notANumber.body).toEqual({ error: expect.any(String) });
	});

	test('notes survive a new app: a second createApp(db) sees notes saved through the first', async () => {
		const created = await request(app).post('/notes').send({ title: 'Remember me' });
		expect(created.status).toBe(201);
		const restarted = createApp(db);
		const res = await request(restarted).get('/notes');
		expect(res.body.map((note) => note.title)).toEqual(['Remember me']);
	});
});

describe('writing notes', () => {
	test('POST /notes saves a row and answers 201 with the new note', async () => {
		const res = await request(app).post('/notes').send({ title: 'Buy milk', body: 'Two litres' });
		expect(res.status).toBe(201);
		expect(res.body).toEqual({ id: expect.any(Number), title: 'Buy milk', body: 'Two litres', createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) });
		const { rows } = await db.query('SELECT title, body FROM notes WHERE id = $1', [res.body.id]);
		expect(rows).toEqual([{ title: 'Buy milk', body: 'Two litres' }]);
	});

	test('POST /notes gives each note a different id and defaults body to an empty string', async () => {
		const first = await request(app).post('/notes').send({ title: 'One' });
		const second = await request(app).post('/notes').send({ title: 'Two' });
		expect(first.body.body).toBe('');
		expect(second.body.id).not.toBe(first.body.id);
		const { rows } = await db.query('SELECT body FROM notes ORDER BY id');
		expect(rows).toEqual([{ body: '' }, { body: '' }]);
	});

	test('POST /notes rejects a bad note with 400 and saves nothing more', async () => {
		expect((await request(app).post('/notes').send({ title: 'Good' })).status).toBe(201);
		const bad = [{}, { title: '   ' }, { title: 42 }, { title: 'Fine', body: 7 }];
		for (const payload of bad) {
			const res = await request(app).post('/notes').send(payload);
			expect(res.status, JSON.stringify(payload)).toBe(400);
			expect(res.body).toEqual({ error: expect.any(String) });
		}
		expect(await countNotes()).toBe(1);
	});

	test('DELETE /notes/:id removes the row, then answers 404 the second time', async () => {
		const id = await seed('Delete me');
		await seed('Keep me');
		const res = await request(app).delete(`/notes/${id}`);
		expect(res.status).toBe(204);
		expect(res.text).toBe('');
		expect(await countNotes()).toBe(1);
		const again = await request(app).delete(`/notes/${id}`);
		expect(again.status).toBe(404);
		expect(again.body).toEqual({ error: expect.any(String) });
	});
});

describe('searching notes', () => {
	test('GET /notes?search= matches the title or the body, ignoring case', async () => {
		await seed('Buy MILK', 'Two litres');
		await seed('Call Ada', 'About the milk delivery');
		await seed('Water the plants', 'Fern');
		const res = await request(app).get('/notes').query({ search: 'milk' });
		expect(res.status).toBe(200);
		expect(res.body.map((note) => note.title)).toEqual(['Buy MILK', 'Call Ada']);
	});

	test('a search with a quote in it finds the note instead of breaking the query', async () => {
		await seed("Don't forget the milk");
		await seed('Water the plants');
		const res = await request(app).get('/notes').query({ search: "Don't" });
		expect(res.status).toBe(200);
		expect(res.body.map((note) => note.title)).toEqual(["Don't forget the milk"]);
	});

	test('a search that looks like SQL is treated as plain text and the table survives', async () => {
		await seed('Buy milk');
		expect((await request(app).get('/notes').query({ search: 'milk' })).body).toHaveLength(1);
		const res = await request(app).get('/notes').query({ search: "'; DROP TABLE notes; --" });
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
		expect(await countNotes()).toBe(1);
	});

	test('request data goes to the database as parameters, never inside the SQL text', async () => {
		await seed('Buy milk');
		const calls = [];
		const spy = {
			query: (sql, params) => {
				calls.push({ sql, params });
				return db.query(sql, params);
			},
		};
		const search = "zq'x";
		const title = "unique-title-9k'";
		await request(createApp(spy)).get('/notes').query({ search });
		await request(createApp(spy)).post('/notes').send({ title });
		expect(calls.length).toBeGreaterThan(1);
		for (const { sql } of calls) {
			expect(sql).not.toContain('zq');
			expect(sql).not.toContain('unique-title');
		}
	});
});

describe('errors', () => {
	test('a failing database is a 500 that does not leak the error message', async () => {
		const broken = {
			query: async () => {
				throw new Error('connection to 10.0.0.5 refused');
			},
		};
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await request(createApp(broken)).get('/notes');
		expect(res.status).toBe(500);
		expect(res.body).toEqual({ error: 'Internal server error' });
		expect(JSON.stringify(res.body)).not.toContain('10.0.0.5');
	});
});
