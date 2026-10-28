import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from './01-notes-api.js';

let app;
beforeEach(() => {
	app = createApp();
});

function createNote(title = 'Groceries', body = 'Milk, eggs, bread') {
	return request(app).post('/notes').send({ title, body });
}

describe('GET /notes', () => {
	test('responds 200 with an empty JSON array when there are no notes', async () => {
		const res = await request(app).get('/notes');
		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toMatch(/application\/json/);
		expect(res.body).toEqual([]);
	});

	test('lists every note, oldest first', async () => {
		const first = await createNote('First');
		const second = await createNote('Second');
		const res = await request(app).get('/notes');
		expect(res.status).toBe(200);
		expect(res.body).toEqual([first.body, second.body]);
	});
});

describe('POST /notes', () => {
	test('responds 201 with the new note', async () => {
		const res = await createNote('Groceries', 'Milk, eggs, bread');
		expect(res.status).toBe(201);
		expect(res.body).toEqual({
			id: expect.any(Number),
			title: 'Groceries',
			body: 'Milk, eggs, bread',
			createdAt: expect.any(String),
		});
	});

	test('gives each note a different id, starting at 1', async () => {
		const first = await createNote();
		const second = await createNote();
		expect(first.body.id).toBe(1);
		expect(second.body.id).toBe(2);
	});

	test('sets createdAt to the current time as an ISO string', async () => {
		const before = Date.now();
		const res = await createNote();
		const after = Date.now();
		const createdAt = res.body.createdAt;
		expect(typeof createdAt).toBe('string');
		expect(new Date(createdAt).toISOString()).toBe(createdAt);
		expect(Date.parse(createdAt)).toBeGreaterThanOrEqual(before);
		expect(Date.parse(createdAt)).toBeLessThanOrEqual(after);
	});
});

describe('GET /notes/:id', () => {
	test('responds 200 with the note that has that id', async () => {
		await createNote('First');
		const second = await createNote('Second');
		const res = await request(app).get(`/notes/${second.body.id}`);
		expect(res.status).toBe(200);
		expect(res.body).toEqual(second.body);
	});

	test('responds 404 with { error: "Note not found" } when no note has that id', async () => {
		const res = await request(app).get('/notes/999');
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: 'Note not found' });
	});
});

describe('PUT /notes/:id', () => {
	test('replaces the title and body and keeps the id and createdAt', async () => {
		const created = await createNote('Groceries', 'Milk');
		const res = await request(app).put(`/notes/${created.body.id}`).send({ title: 'Shopping', body: 'Milk, tea' });
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ ...created.body, title: 'Shopping', body: 'Milk, tea' });
	});

	test('saves the change, so GET /notes/:id returns the new version', async () => {
		const created = await createNote('Groceries', 'Milk');
		await request(app).put(`/notes/${created.body.id}`).send({ title: 'Shopping', body: 'Milk, tea' });
		const res = await request(app).get(`/notes/${created.body.id}`);
		expect(res.body).toEqual({ ...created.body, title: 'Shopping', body: 'Milk, tea' });
	});

	test('responds 404 with { error: "Note not found" } when no note has that id', async () => {
		const res = await request(app).put('/notes/999').send({ title: 'Shopping', body: 'Milk, tea' });
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: 'Note not found' });
	});
});

describe('DELETE /notes/:id', () => {
	test('responds 204 with an empty body', async () => {
		const created = await createNote();
		const res = await request(app).delete(`/notes/${created.body.id}`);
		expect(res.status).toBe(204);
		expect(res.text).toBe('');
	});

	test('removes the note, so it is gone from GET /notes and GET /notes/:id', async () => {
		const doomed = await createNote('Delete me');
		const kept = await createNote('Keep me');
		await request(app).delete(`/notes/${doomed.body.id}`);
		const list = await request(app).get('/notes');
		expect(list.body).toEqual([kept.body]);
		const one = await request(app).get(`/notes/${doomed.body.id}`);
		expect(one.status).toBe(404);
	});

	test('responds 404 with { error: "Note not found" } when no note has that id', async () => {
		const res = await request(app).delete('/notes/999');
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: 'Note not found' });
	});
});

describe('createApp', () => {
	test('gives each app its own notes, so one app never sees notes from another', async () => {
		await createNote('Only in the first app');
		const otherApp = createApp();
		const res = await request(otherApp).get('/notes');
		expect(res.status).toBe(200);
		expect(res.body).toEqual([]);
	});
});

describe('static files', () => {
	test('serves public/index.html at /', async () => {
		const res = await request(app).get('/');
		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toMatch(/text\/html/);
		expect(res.text).toContain('<h1>Notes</h1>');
	});
});
